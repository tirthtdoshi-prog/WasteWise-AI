import express from 'express';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

const app = express();
app.use(express.json({ limit: '15mb' }));

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured. Please add it in Settings > Secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'wastewise-ai' });
});

const RETRYABLE_ERROR_PATTERNS = [
  '503',
  'UNAVAILABLE',
  'high demand',
  '429',
  'RESOURCE_EXHAUSTED',
  '500',
  '502',
  '504',
  'DEADLINE_EXCEEDED',
  'fetch failed',
  'timed out',
];

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Upstream request timed out')), ms);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function isRetryableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return RETRYABLE_ERROR_PATTERNS.some((pattern) =>
    msg.toLowerCase().includes(pattern.toLowerCase())
  );
}

function formatReadableError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : 'Unexpected error while classifying image.';

  let extracted = raw;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.error?.message) {
      extracted = String(parsed.error.message);
    }
  } catch {
    // Raw message is plain text
  }

  if (extracted.includes('API_KEY_INVALID') || extracted.includes('PERMISSION_DENIED')) {
    return {
      status: 403,
      message: 'API key is missing or invalid. Please verify GEMINI_API_KEY in Settings > Secrets.',
    };
  }
  if (extracted.includes('RESOURCE_EXHAUSTED') || extracted.includes('429')) {
    return {
      status: 429,
      message: 'Classification rate limit reached temporarily. Please wait a moment and try again.',
    };
  }
  if (
    extracted.includes('503') ||
    extracted.includes('UNAVAILABLE') ||
    extracted.toLowerCase().includes('high demand')
  ) {
    return {
      status: 503,
      message: 'The vision service is temporarily busy. Please click Try Again in a few seconds.',
    };
  }

  return { status: 500, message: extracted };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

app.post('/api/classify', async (req, res) => {
  const startedAt = Date.now();
  try {
    const { imageBase64, mimeType } = req.body ?? {};

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      res.status(400).json({ error: 'Missing image data. Please upload a valid waste image.' });
      return;
    }

    const cleanBase64 = imageBase64.includes(',')
      ? imageBase64.split(',')[1]
      : imageBase64;

    const safeMimeType =
      typeof mimeType === 'string' && mimeType.startsWith('image/')
        ? mimeType
        : 'image/jpeg';

    const ai = getGeminiClient();

    const prompt = `Analyze this image deeply and classify the primary waste item shown into one of: Plastic, Paper, Metal, Glass, Organic, or Other.
Make every field genuinely practical, specific to the exact item visible, and immediately useful to an everyday person.

Provide:
1. category: Exact match from ["Plastic", "Paper", "Metal", "Glass", "Organic", "Other"].
2. confidence: Integer confidence score from 0 to 100 reflecting visual certainty.
3. itemDetected: Concise name of the specific waste object (e.g., "Clear PET Plastic Water Bottle", "Corrugated Cardboard Shipping Box").
4. binType: Specific collection bin name (e.g., "Recyclable Plastic Waste Bin", "Organic / Compost Bin").
5. disposalRecommendation: Practical 1-2 sentence disposal instruction tailored to this exact item.
6. environmentalImpact: Concise 1-2 sentence explanation of the environmental protection impact of sorting this item properly.
7. contaminationTip: Practical 1-sentence tip to prevent contaminating the recycling or compost stream.
8. materialGrade: Specific material or polymer grade (e.g., "PET #1 (Polyethylene Terephthalate)", "3004 Aluminum Alloy", "Uncoated Kraft Cellulose", "Soda-Lime Silicate Glass", "Nitrogen-Rich Plant Organics").
9. landfillDecompTime: Short realistic decomposition duration if landfilled (e.g., "~450 years", "2-6 weeks", "200-500 years", "1 million+ years").
10. recoveryTurnaround: Realistic closed-loop turnaround time when recycled/composted (e.g., "30-60 days back to shelf", "60 days can-to-can", "6-12 weeks into compost").
11. energySavingsNote: Concise resource savings metric (e.g., "Saves ~76% energy vs. virgin resin", "Saves 95% smelting energy").
12. humanActionSteps: Array of 4 short, clear step-by-step actions a person should take right now before binning or reusing this item.
13. humanSafetyAndValue: Practical 1-2 sentence human-focused tip covering health/safety (such as microplastic leaching, sharp edges, or compost odors) and potential reuse or deposit value.
14. recycledProducts: Array of 4 concrete industrial products manufactured from this item after recycling or composting.
15. realWorldUses: Clear 1-2 sentence explanation of how the recycled or composted output is practically used in everyday human life, clothing, packaging, construction, or agriculture.
16. circularProcessNote: Concise 1-sentence explanation of how the collected item is physically/chemically processed into reusable feedstock.
17. diyIdeas: Array of 3 practical DIY upcycling or home reuse ideas a person can make directly from this item, each with:
    - title: Short project title (e.g., "Self-Watering Herb Planter")
    - effort: Short label like "Quick · 5 min" or "Easy · 15 min"
    - whatYouMake: 1 sentence explaining what it creates and why it is useful at home
    - howToMake: 1-2 clear step-by-step sentences a human can follow safely
18. recyclable: Boolean indicating whether the material is typically recyclable.
19. compostable: Boolean indicating whether the material is biodegradable/compostable.
20. categoryScores: Array containing exactly 5 objects for ["Plastic", "Paper", "Metal", "Glass", "Organic"], each with a calibrated integer score (0-100) summing to 100.`;

    const modelAttempts: Array<{ model: string; thinkingLevel: ThinkingLevel }> = [
      { model: 'gemini-4-hydrogen', thinkingLevel: ThinkingLevel.LOW },
      { model: 'gemini-3.1-flash-lite', thinkingLevel: ThinkingLevel.MINIMAL },
      { model: 'gemini-4-hydrogen', thinkingLevel: ThinkingLevel.LOW },
      { model: 'gemini-3.1-flash-lite', thinkingLevel: ThinkingLevel.MINIMAL },
    ];

    let lastError: unknown = null;
    let rawText = '';

    for (let i = 0; i < modelAttempts.length; i += 1) {
      const attempt = modelAttempts[i];
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model: attempt.model,
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: safeMimeType,
                    data: cleanBase64,
                  },
                },
                { text: prompt },
              ],
            },
            config: {
              systemInstruction:
                'You are WasteWise AI, a precision computer-vision waste sorting and circular-economy advisor. Always deliver deeply practical, human-useful material analysis, safety guidance, post-recycling product outcomes, and home DIY reuse ideas in strict JSON.',
              responseMimeType: 'application/json',
              thinkingConfig: { thinkingLevel: attempt.thinkingLevel },
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  confidence: { type: Type.INTEGER },
                  itemDetected: { type: Type.STRING },
                  binType: { type: Type.STRING },
                  disposalRecommendation: { type: Type.STRING },
                  environmentalImpact: { type: Type.STRING },
                  contaminationTip: { type: Type.STRING },
                  materialGrade: { type: Type.STRING },
                  landfillDecompTime: { type: Type.STRING },
                  recoveryTurnaround: { type: Type.STRING },
                  energySavingsNote: { type: Type.STRING },
                  humanActionSteps: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  humanSafetyAndValue: { type: Type.STRING },
                  recycledProducts: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  realWorldUses: { type: Type.STRING },
                  circularProcessNote: { type: Type.STRING },
                  diyIdeas: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        effort: { type: Type.STRING },
                        whatYouMake: { type: Type.STRING },
                        howToMake: { type: Type.STRING },
                      },
                      required: ['title', 'effort', 'whatYouMake', 'howToMake'],
                    },
                  },
                  recyclable: { type: Type.BOOLEAN },
                  compostable: { type: Type.BOOLEAN },
                  categoryScores: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        category: { type: Type.STRING },
                        score: { type: Type.INTEGER },
                      },
                      required: ['category', 'score'],
                    },
                  },
                },
                required: [
                  'category',
                  'confidence',
                  'itemDetected',
                  'binType',
                  'disposalRecommendation',
                  'environmentalImpact',
                  'contaminationTip',
                  'materialGrade',
                  'landfillDecompTime',
                  'recoveryTurnaround',
                  'energySavingsNote',
                  'humanActionSteps',
                  'humanSafetyAndValue',
                  'recycledProducts',
                  'realWorldUses',
                  'circularProcessNote',
                  'diyIdeas',
                  'recyclable',
                  'compostable',
                  'categoryScores',
                ],
              },
            },
          }),
          14000
        );

        rawText = (response.text ?? '').trim();
        if (rawText) {
          break;
        }
      } catch (err: unknown) {
        lastError = err;
        if (!isRetryableError(err) || i === modelAttempts.length - 1) {
          throw err;
        }
        await sleep(300 * (i + 1));
      }
    }

    if (!rawText) {
      if (lastError) throw lastError;
      res.status(502).json({ error: 'Model returned an empty response. Please try another image.' });
      return;
    }

    const parsed = JSON.parse(rawText);
    res.json({
      ...parsed,
      analysisMs: Date.now() - startedAt,
    });
  } catch (err: unknown) {
    const formatted = formatReadableError(err);
    res.status(formatted.status).json({ error: formatted.message });
  }
});

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WasteWise AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
