"use client";

import { useState, useEffect } from "react";

type Result = {
  label: "likely_human" | "likely_ai" | "uncertain";
  confidence: number; // 0-100
  explanation: string;
  provider?: string;
  model?: string;
  latencyMs?: number;
  candidates?: Array<{ label: string; score: number }>;
  rawResult?: unknown;
  mode?: string;
  models?: string[];
  aggregate?: { aggAi: number; aggHuman: number };
  perModel?: Array<{
    model: string;
    latencyMs: number;
    topLabel: string | null;
    topScore: number | null;
    aiScore: number;
    humanScore: number;
    candidates: Array<{ label: string; score: number }>;
    error?: string;
  }>;
};

export default function HomePage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDev] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  const tips = [
    "Sending text to detectors… this can take ~10–15s",
    "Warming models and batching requests for accuracy",
    "Aggregating signals across multiple AI detectors",
    "Calibrating thresholds and estimating confidence",
  ];

  // Rotate explanatory tips every 3s while loading
  useEffect(() => {
    if (!loading) {
      setTipIndex(0);
      return;
    }
    const id = setInterval(() => {
      setTipIndex((i) => (i + 1) % tips.length);
    }, 3000);
    return () => clearInterval(id);
  }, [loading, tips.length]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!text.trim()) { 
      setError("Please paste some text first.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        throw new Error("Request failed");
      }
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function prettyLabel(label: Result["label"]) {
    if (label === "likely_human") return "likely human";
    if (label === "likely_ai") return "likely ai-generated";
    return "uncertain";
  }

  return (
    <main className="min-h-screen bg-[#050509] text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            realorai<span className="text-[#5f4cfa]">.net</span>
          </h1>
          <p className="text-sm md:text-base text-slate-400 max-w-xl">
            paste any text and we&apos;ll analyze whether it was written by a
            real human or an ai
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            className="w-full min-h-[180px] rounded-xl bg-slate-900/70 border border-slate-700 px-4 py-3 text-sm md:text-base outline-none focus:border-[#5f4cfa] focus:ring-1 focus:ring-[#5f4cfa] resize-vertical"
            placeholder="paste your text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="flex items-center justify-between gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-full bg-[#5f4cfa] hover:bg-[#5543f3] disabled:bg-slate-600 px-5 py-2 text-sm font-medium transition-colors"
            >
              {loading ? "analyzing..." : "analyze text"}
            </button>
            <p className="text-[11px] text-slate-500">
              prototype only • ai vs human detection
            </p>
          </div>
        </form>

        {loading && (
          <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
              <p className="text-sm text-slate-300">{tips[tipIndex]}</p>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full w-1/3 bg-[#5f4cfa] animate-[progress_1.2s_ease-in-out_infinite]" />
            </div>
            <p className="text-[11px] text-slate-500">estimating… usually completes within 10–15 seconds</p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        {result && (
          <section className="space-y-3 rounded-xl border border-slate-700 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  verdict
                </p>
                <p className="text-lg font-semibold">
                  {prettyLabel(result.label)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  confidence
                </p>
                <p className="text-lg font-semibold">
                  {Math.round(result.confidence)}%
          </p>
        </div>
            </div>

            {/* confidence bar */}
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  result.label === "likely_human"
                    ? "bg-emerald-400"
                    : result.label === "likely_ai"
                    ? "bg-pink-400"
                    : "bg-amber-400"
                }`}
                style={{ width: `${Math.max(5, result.confidence)}%` }}
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                explanation
              </p>
              <p className="text-sm text-slate-200 leading-relaxed">
                {result.explanation}
              </p>
            </div>

            {/* <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowDev((v) => !v)}
                className="inline-flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium transition-colors"
              >
                {showDev ? "hide developer info" : "show developer info"}
              </button>
            </div> */}

            {showDev && (
              <div className="mt-2 rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                <p className="text-xs text-slate-400 mb-2">
                  provider: <span className="text-slate-200">{result.provider || "unknown"}</span> • model:{" "}
                  <span className="text-slate-200">
                    {result.mode === "ensemble" && result.models?.length ? result.models.join(", ") : (result.model || "unknown")}
                  </span>{" "}
                  • latency:{" "}
                  <span className="text-slate-200">{typeof result.latencyMs === "number" ? `${result.latencyMs}ms` : "n/a"}</span>
                </p>
                {result.mode === "ensemble" && result.aggregate && (
                  <p className="text-xs text-slate-400 mb-2">
                    mode: <span className="text-slate-200">{result.mode}</span> • aggAI:{" "}
                    <span className="text-slate-200">{Math.round(result.aggregate.aggAi * 100)}%</span> • aggHuman:{" "}
                    <span className="text-slate-200">{Math.round(result.aggregate.aggHuman * 100)}%</span>
                  </p>
                )}
                <div className="grid gap-2">
                  {result.mode === "ensemble" && result.perModel && result.perModel.length > 0 && (
                    <pre className="text-[11px] leading-relaxed overflow-auto rounded bg-slate-900 p-2 border border-slate-800">
{JSON.stringify(result.perModel, null, 2)}
                    </pre>
                  )}
                  {result.candidates && (
                    <pre className="text-[11px] leading-relaxed overflow-auto rounded bg-slate-900 p-2 border border-slate-800">
{JSON.stringify(result.candidates, null, 2)}
                    </pre>
                  )}
                  {typeof result.rawResult !== "undefined" && (
                    <pre className="text-[11px] leading-relaxed overflow-auto rounded bg-slate-900 p-2 border border-slate-800">
{JSON.stringify(result.rawResult, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        <footer className="pt-6 border-t border-slate-800 mt-4">
          <p className="text-[11px] text-slate-500">
            <a href="https://leadmagnet.club" target="_blank" rel="noopener noreferrer" className="text-[#5f4cfa] hover:underline">
              leadmagnet.club
            </a>
          </p>
        </footer>
        </div>
      </main>
  );
}
