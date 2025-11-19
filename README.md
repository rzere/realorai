This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## About

This project is maintained by the Reconsider.ai Team. It represents version v0.1 of our AI text detection service.

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

## Environment variables

Minimal setup (local `.env.local` and Vercel Project Settings → Environment Variables):

```bash
HUGGINGFACE_API_KEY=your_hf_api_key
OPENAI_API_KEY=your_openai_api_key
```

That’s all. The app auto-selects Hugging Face when `HUGGINGFACE_API_KEY` is present, and falls back to OpenAI otherwise. Default HF detectors include:
- `openai-community/roberta-base-openai-detector`
- `Hello-SimpleAI/chatgpt-detector-roberta`

Example `.env.local` (tuning and model selection):

```bash
DETECTOR_PROVIDER=huggingface

DETECTOR_HEURISTIC_SALESY=true
DETECTOR_HEURISTIC_THRESHOLD=0.55
DETECTOR_HEURISTIC_MAX_LEN=320
DETECTOR_STRICT_MODE=false
DETECTOR_AI_CHUNK_THRESHOLD=0.69
DETECTOR_MAX_CHUNKS=1
DETECTOR_CHUNK_LEN=400
DETECTOR_AI_MULTIPLIER=1.10
DETECTOR_AI_BIAS=0.04
DETECTOR_MIN_MARGIN=0.18
DETECTOR_MIN_MAXSCORE=0.58
DETECTOR_TIEBREAK_HUMAN_CONF=85
DETECTOR_TIEBREAK_SHORT_LEN=260
DETECTOR_HUMAN_CONF_CAP=92

HF_MODEL_IDS=openai-community/roberta-base-openai-detector,Hello-SimpleAI/chatgpt-detector-roberta,andreas122001/roberta-academic-detector,desklib/ai-text-detector-v1.01
``` 

## Privacy and data usage

- The endpoint `api/check` may send submitted text to:
  - Hugging Face Inference API for classification using models defined in `HF_MODEL_IDS`.
  - OpenAI (model `gpt-5.1-2025-11-13`) for a tiebreaker classification in specific cases.
- This app does not persist your submitted text; however, third‑party providers may log requests per their policies.
- Configure providers and models via environment variables as documented above.

## Acknowledgements

- Uses Hugging Face Inference API and community models including:
  - `openai-community/roberta-base-openai-detector` (MIT) — see the model page:
    https://huggingface.co/openai-community/roberta-base-openai-detector/tree/main
  - `Hello-SimpleAI/chatgpt-detector-roberta`
- Built with Next.js and the Vercel AI SDK.

## License

This project is licensed under the MIT License — see `LICENSE` for details.
