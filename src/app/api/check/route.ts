import { NextRequest, NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { HfInference } from "@huggingface/inference";

const openai = createOpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});
const hf = process.env.HUGGINGFACE_API_KEY
	? new HfInference(process.env.HUGGINGFACE_API_KEY)
	: null;

export async function POST(req: NextRequest) {
	try {
		const { text } = await req.json();

		if (!text || typeof text !== "string" || text.trim().length < 20) {
			return NextResponse.json(
				{
					error: "Please provide at least 20 characters of text.",
				},
				{ status: 400 },
			);
		}

		// Provider switch: prefer Hugging Face if API key present, else Vercel AI (OpenAI)
		const provider = (process.env.DETECTOR_PROVIDER || (hf ? "huggingface" : "openai")).toLowerCase();

		if (provider === "huggingface" && hf) {
			// Try/aggregate a list of detectors; allow override via env
			const envList = (process.env.HF_MODEL_IDS || process.env.HF_MODEL_ID || "")
				.split(",")
				.map((m) => m.trim())
				.filter(Boolean);
			const defaultModels = [
				"Hello-SimpleAI/chatgpt-detector-roberta",
				"andreas122001/roberta-academic-detector",
				"desklib/ai-text-detector-v1.01",
			];
			const modelCandidates = envList.length > 0 ? envList : defaultModels;

			// Calibration thresholds via env
			const aiChunkThreshold = Number(process.env.DETECTOR_AI_CHUNK_THRESHOLD || 0.6);
			const minMargin = Number(process.env.DETECTOR_MIN_MARGIN || 0.15);
			const minMaxScore = Number(process.env.DETECTOR_MIN_MAXSCORE || 0.55);

			const makeChunks = (input: string): string[] => {
				const maxChunks = Number(process.env.DETECTOR_MAX_CHUNKS || 4);
				const targetLen = Number(process.env.DETECTOR_CHUNK_LEN || 400);
				if (input.length <= targetLen) return [input];
				const chunks: string[] = [];
				for (let i = 0; i < input.length && chunks.length < maxChunks; i += targetLen) {
					chunks.push(input.slice(i, Math.min(input.length, i + targetLen)));
				}
				return chunks;
			};
			const chunks = makeChunks(text);

			const perModel: Array<{
				model: string;
				latencyMs: number;
				topLabel: string | null;
				topScore: number | null;
				aiScore: number;
				humanScore: number;
				candidates: Array<{ label: string; score: number }>;
				rawResult: unknown;
				error?: string;
				aiChunkScores?: number[];
				humanChunkScores?: number[];
			}> = [];

			const flatten = (arr: any): Array<{ label: string; score: number }> => {
				if (!Array.isArray(arr)) return [];
				const out: Array<{ label: string; score: number }> = [];
				for (const item of arr) {
					if (Array.isArray(item)) {
						for (const sub of item) {
							if (sub && typeof sub === "object" && "label" in sub && "score" in sub) {
								out.push({ label: String(sub.label), score: Number((sub as any).score) });
							}
						}
					} else if (item && typeof item === "object" && "label" in item && "score" in item) {
						out.push({ label: String(item.label), score: Number((item as any).score) });
					}
				}
				return out;
			};

			for (const model of modelCandidates) {
				const started = Date.now();
				try {
					const aiChunkScores: number[] = [];
					const humanChunkScores: number[] = [];
					let lastCandidates: Array<{ label: string; score: number }> = [];
					let lastRaw: unknown = null;
					for (const chunk of chunks) {
						// Optionally allow a custom HF Inference Endpoint URL for models that fail on the public server
						const customUrl = process.env.HF_ENDPOINT_URL;
						let result: unknown;
						if (customUrl) {
							const resp = await fetch(customUrl, {
								method: "POST",
								headers: {
									"Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY || ""}`,
									"Content-Type": "application/json",
								},
								body: JSON.stringify({
									inputs: chunk,
									options: {
										wait_for_model: true,
										use_cache: process.env.DETECTOR_USE_CACHE === "true" ? true : false,
									},
								}),
							});
							result = await resp.json();
						} else {
							result = await (hf as any).textClassification({
								model,
								inputs: chunk,
								options: {
									wait_for_model: true,
									use_cache: process.env.DETECTOR_USE_CACHE === "true" ? true : false,
								},
							});
						}
						lastRaw = result;
						const candidates = flatten(result).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
						lastCandidates = candidates;
						const getAiScoreFor = (): number => {
							let best = 0;
							for (const c of candidates) {
								const normalized = c.label.toLowerCase();
								if (
									normalized.includes("chatgpt") ||
									normalized.includes("gpt") ||
									normalized.includes("ai") ||
									normalized.includes("llm") ||
									normalized.includes("machine") ||
									normalized.includes("generated") ||
									normalized.includes("fake")
								) {
									best = Math.max(best, Number(c.score ?? 0));
								}
							}
							if (best === 0) {
								const human = candidates.find((c) => c.label.toLowerCase().includes("human"));
								if (human) return Math.max(0, Math.min(1, 1 - Number(human.score ?? 0)));
							}
							return best;
						};
						const ai = getAiScoreFor();
						const human = candidates.find((c) => c.label.toLowerCase().includes("human"));
						const humanVal = human ? Number(human.score ?? 0) : Math.max(0, 1 - ai);
						aiChunkScores.push(ai);
						humanChunkScores.push(humanVal);
					}

					const latencyMs = Date.now() - started;
					const candidates = lastCandidates;
					const top = candidates[0] ?? null;
					const getAiScore = (): number => {
						// Use max of per-chunk AI scores to catch localized AI-y sections
						return Math.max(...(aiChunkScores.length ? aiChunkScores : [0]));
					};
					const aiScore = getAiScore();
					const humanScore =
						humanChunkScores.length ? humanChunkScores.reduce((s, x) => s + x, 0) / humanChunkScores.length : (top?.label.toLowerCase().includes("human") ? Number(top?.score ?? 0) : Math.max(0, 1 - aiScore));

					perModel.push({
						model,
						latencyMs,
						topLabel: top?.label ?? null,
						topScore: top?.score ?? null,
						aiScore,
						humanScore,
						candidates,
						rawResult: lastRaw,
						aiChunkScores,
						humanChunkScores,
					});
				} catch (err: any) {
					const latencyMs = Date.now() - started;
					perModel.push({
						model,
						latencyMs,
						topLabel: null,
						topScore: null,
						aiScore: 0,
						humanScore: 0,
						candidates: [],
						rawResult: null,
						error: String(err?.message || err),
					});
				}
			}

			const valid = perModel.filter((r) => r.candidates.length > 0);
			if (valid.length > 0) {
				const avg = (arr: number[]) => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0);
				const aggAi = avg(valid.map((r) => r.aiScore));
				const aggHuman = avg(valid.map((r) => r.humanScore));
				const maxChunkAi = Math.max(...valid.map((r) => Math.max(...(r.aiChunkScores || [0]))));
				const maxScore = Math.max(aggAi, aggHuman, maxChunkAi);
				const margin = Math.abs(Math.max(aggAi, maxChunkAi) - aggHuman);
				let label: "likely_human" | "likely_ai" | "uncertain" = "uncertain";
				// Heuristic: if any chunk crosses threshold, prefer likely_ai
				if (maxChunkAi >= aiChunkThreshold) {
					label = "likely_ai";
				} else if (maxScore < minMaxScore || margin < minMargin) {
					label = "uncertain";
				} else {
					label = Math.max(aggAi, maxChunkAi) > aggHuman ? "likely_ai" : "likely_human";
				}
				let confidence = Math.round(100 * maxScore);
				let explanation =
					label === "likely_ai"
						? "Ensemble of detectors leans AI-generated. This is a statistical estimate, not a cryptographic proof."
						: label === "likely_human"
						? "Ensemble of detectors leans human-written. This is a statistical estimate, not a cryptographic proof."
						: "Ensemble signals are mixed. This is a statistical estimate, not a cryptographic proof.";
				const latencyMs = valid.reduce((s, r) => s + (r.latencyMs || 0), 0);

				// OpenAI tiebreaker: if HF is very confident it's human, cross-check with LLM
				let tieBreaker: any = null;
				if (label === "likely_human" && confidence >= 90) {
					try {
						const schema = z.object({
							label: z.enum(["likely_human", "likely_ai", "uncertain"]),
							confidence: z.number().min(0).max(100),
							explanation: z.string().min(1),
						});
						const { object } = await generateObject({
							model: openai("gpt-4.1-mini"),
							schema,
							temperature: 0.1,
							prompt: `
You are an AI-text detector. Decide if the text is likely human or likely AI.
Return JSON with "label", "confidence" (0-100) and "explanation".
Be conservative about "likely human" when text has generic marketing or poetic boilerplate.

Text:
"""${text}"""
`,
						});
						tieBreaker = { provider: "openai", ...object };
						if (object.label === "likely_ai" && object.confidence >= 60) {
							label = "likely_ai";
							confidence = object.confidence;
							explanation = object.explanation;
						}
					} catch {
						// ignore tiebreaker errors
					}
				}

				return NextResponse.json({
					label,
					confidence,
					explanation,
					provider: "huggingface",
					mode: "ensemble",
					models: valid.map((r) => r.model),
					latencyMs,
					aggregate: { aggAi, aggHuman, maxChunkAi },
					perModel,
					tieBreaker,
				});
			}
			// If all HF models failed to produce outputs, fall through to OpenAI path
			console.warn("All Hugging Face model attempts produced no candidates; falling back to OpenAI.");
		}

		// Default: use Vercel AI SDK (OpenAI) with structured output
		const schema = z.object({
			label: z.enum(["likely_human", "likely_ai", "uncertain"]),
			confidence: z.number().min(0).max(100),
			explanation: z.string().min(1),
		});

		const start = Date.now();
		const { object } = await generateObject({
			model: openai("gpt-4.1-mini"),
			schema,
			temperature: 0.2,
			prompt: `
You are a detector that estimates whether text was written by a human or an AI system.
Return ONLY a JSON object with the following fields:
- "label": one of "likely_human", "likely_ai", or "uncertain"
- "confidence": number from 0 to 100 (how confident you are in that label)
- "explanation": one short paragraph explaining your reasoning in simple language.

Text to analyze:
"""${text}"""
`,
		});
		const latencyMs = Date.now() - start;

		return NextResponse.json({
			...object,
			provider: "openai",
			model: "gpt-4.1-mini",
			latencyMs,
		});
	} catch (err) {
		console.error(err);
		return NextResponse.json(
			{
				error: "Internal error",
			},
			{ status: 500 },
		);
	}
}

