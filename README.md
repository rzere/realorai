This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Environment variables (detector)

Set these for local dev (e.g., in `.env.local`) and in Vercel Project Settings → Environment Variables:

- DETECTOR_PROVIDER: "huggingface" or "openai". If omitted, the app prefers "huggingface" when HUGGINGFACE_API_KEY is present, else "openai".
- HUGGINGFACE_API_KEY: Required to use Hugging Face models.
- HF_MODEL_IDS: Comma-separated HF model IDs. Defaults include `openai-community/roberta-base-openai-detector`.
- HF_ENDPOINT_URL: Optional custom Inference Endpoint URL if you use a private HF endpoint.
- DETECTOR_USE_CACHE: Optional, "true" to enable HF server-side caching.
- OPENAI_API_KEY: Required when using OpenAI provider and for tie-breaker cross-checks.

Recommended setup to use the Roberta detector:

```bash
DETECTOR_PROVIDER=huggingface
HUGGINGFACE_API_KEY=your_hf_api_key
HF_MODEL_IDS=openai-community/roberta-base-openai-detector,Hello-SimpleAI/chatgpt-detector-roberta,andreas122001/roberta-academic-detector,desklib/ai-text-detector-v1.01
OPENAI_API_KEY=your_openai_api_key
```

Tuning knobs (optional):

- DETECTOR_AI_CHUNK_THRESHOLD (default 0.6)
- DETECTOR_MIN_MARGIN (default 0.15)
- DETECTOR_MIN_MAXSCORE (default 0.55)
- DETECTOR_AI_MULTIPLIER (default 1)
- DETECTOR_AI_BIAS (default 0)
- DETECTOR_TIEBREAK_HUMAN_CONF (default 85)
- DETECTOR_TIEBREAK_SHORT_LEN (default 300)
- DETECTOR_HUMAN_CONF_CAP (default 95)
- DETECTOR_STRICT_MODE (default true)
- DETECTOR_HUMAN_STRICT_THRESHOLD (default 95)
- DETECTOR_HEURISTIC_SALESY (default true)
- DETECTOR_HEURISTIC_THRESHOLD (default 0.5)
- DETECTOR_HEURISTIC_MAX_LEN (default 400)
