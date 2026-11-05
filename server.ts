import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Shared Gemini AI client with telemetry user-agent
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

interface MetricDriver {
  name: string;
  q2Revenue: number;
  q3Revenue: number;
  diff: number;
  pctChange: number;
}

interface RegionAnalysisPayload {
  mostChangedRegion: string;
  changeType: 'increase' | 'decrease';
  q2Revenue: number;
  q3Revenue: number;
  diff: number;
  absDiff: number;
  pctChange: number;
  q2Units: number;
  q3Units: number;
  unitsDiff: number;
  unitsPctChange: number;
  q2AvgDiscountPct: number;
  q3AvgDiscountPct: number;
  discountDiffPctPoints: number;
  productDrivers: MetricDriver[];
  channelDrivers: MetricDriver[];
  allRegions: Array<{
    region: string;
    q1Revenue: number;
    q2Revenue: number;
    q3Revenue: number;
    totalRevenue: number;
    diff: number;
    pctChange: number;
  }>;
}

function buildDeterministicSummary(data: RegionAnalysisPayload): string {
  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const pct = (n: number) => `${Math.abs(n).toFixed(2)}%`;

  const topProductDown = data.productDrivers.slice().sort((a, b) => a.diff - b.diff)[0];
  const secondProductDown = data.productDrivers.slice().sort((a, b) => a.diff - b.diff)[1];
  const topProductUp = data.productDrivers.slice().sort((a, b) => b.diff - a.diff)[0];

  const topChannelChange = data.channelDrivers.slice().sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))[0];

  const dirVerb = data.diff < 0 ? 'declined by' : 'increased by';
  const s1 = `Between Q2 and Q3, the ${data.mostChangedRegion} region experienced the greatest variance, as revenue ${dirVerb} ${fmt(Math.abs(data.diff))} (${pct(data.pctChange)}), shifting from ${fmt(data.q2Revenue)} in Q2 to ${fmt(data.q3Revenue)} in Q3.`;

  let s2 = '';
  if (data.diff < 0 && topProductDown) {
    const p1Text = `${topProductDown.name} revenue fell by ${fmt(Math.abs(topProductDown.diff))} (from ${fmt(topProductDown.q2Revenue)} to ${fmt(topProductDown.q3Revenue)})`;
    const p2Text = secondProductDown && secondProductDown.diff < 0 
      ? `, alongside a ${fmt(Math.abs(secondProductDown.diff))} contraction in ${secondProductDown.name}`
      : topProductUp && topProductUp.diff > 0
      ? `, which overshadowed a ${fmt(topProductUp.diff)} gain in ${topProductUp.name}`
      : '';
    s2 = `This downturn was primarily driven by product sales, where ${p1Text}${p2Text}.`;
  } else if (topProductUp) {
    s2 = `This growth was spearheaded by product sales, led by ${topProductUp.name} which surged by ${fmt(topProductUp.diff)} (from ${fmt(topProductUp.q2Revenue)} in Q2 to ${fmt(topProductUp.q3Revenue)} in Q3).`;
  } else {
    s2 = `The revenue movement was reflected across product categories, with key shifts observed in ${data.productDrivers[0]?.name || 'core items'}.`;
  }

  const unitDir = data.unitsDiff < 0 ? 'contracted by' : 'expanded by';
  const discDir = data.discountDiffPctPoints > 0 ? 'rose by' : 'dropped by';
  let chanText = '';
  if (topChannelChange) {
    const cVerb = topChannelChange.diff < 0 ? 'contracted by' : 'grew by';
    chanText = `, while ${topChannelChange.name} channel revenue ${cVerb} ${fmt(Math.abs(topChannelChange.diff))} (from ${fmt(topChannelChange.q2Revenue)} to ${fmt(topChannelChange.q3Revenue)})`;
  }
  const s3 = `From an operational perspective, sales volume ${unitDir} ${Math.abs(data.unitsDiff)} units (from ${data.q2Units} to ${data.q3Units}) and the average discount rate ${discDir} ${Math.abs(data.discountDiffPctPoints).toFixed(2)} percentage points (from ${data.q2AvgDiscountPct.toFixed(2)}% to ${data.q3AvgDiscountPct.toFixed(2)}%)${chanText}.`;

  return `${s1} ${s2} ${s3}`;
}

// POST endpoint to generate 3-sentence summary using Gemini and calculated numbers
app.post('/api/generate-summary', async (req: Request, res: Response) => {
  try {
    const payload: RegionAnalysisPayload = req.body;
    if (!payload || !payload.mostChangedRegion) {
      res.status(400).json({ error: 'Missing calculation payload' });
      return;
    }

    const ai = getGeminiClient();
    const fallbackText = buildDeterministicSummary(payload);

    if (!ai) {
      res.json({
        summary: fallbackText,
        source: 'calculated_engine',
        note: 'Generated directly from verified calculations (Gemini API key not configured).',
      });
      return;
    }

    const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const prompt = `You are a financial analyst. Write a concise THREE-SENTENCE summary of which sales region changed the most in revenue from Q2 to Q3, and why.

CRITICAL RULES:
1. You must write EXACTLY THREE SENTENCES. Count them: 1, 2, 3. No more, no less.
2. Use ONLY the numbers provided in the calculated metrics below. DO NOT invent, guess, calculate, or cite any numbers that are not in this list.
3. Sentence 1 must identify which region changed most from Q2 to Q3 and provide its exact Q2 revenue, Q3 revenue, dollar change, and percentage change.
4. Sentence 2 must explain why by citing the exact product revenue changes for that region.
5. Sentence 3 must explain additional contributing factors by citing the exact channel revenue shifts, unit sales change, or discount percentage change.
6. Return only the raw text of the three sentences. No title, no bullets, no markdown.

CALCULATED METRICS:
- Most Changed Region: ${payload.mostChangedRegion}
- Q2 Revenue: ${fmt(payload.q2Revenue)}
- Q3 Revenue: ${fmt(payload.q3Revenue)}
- Net Revenue Variance: ${fmt(payload.diff)} (${payload.pctChange.toFixed(2)}%)
- Absolute Variance: ${fmt(payload.absDiff)}
- Order Volume: Q2 was ${payload.q2Units} units, Q3 was ${payload.q3Units} units (Variance: ${payload.unitsDiff > 0 ? '+' : ''}${payload.unitsDiff} units, ${payload.unitsPctChange.toFixed(2)}%)
- Average Discount: Q2 was ${payload.q2AvgDiscountPct.toFixed(2)}%, Q3 was ${payload.q3AvgDiscountPct.toFixed(2)}% (Shift: ${payload.discountDiffPctPoints > 0 ? '+' : ''}${payload.discountDiffPctPoints.toFixed(2)} percentage points)
- Product Revenue Shifts in ${payload.mostChangedRegion}:
${payload.productDrivers.map(p => `  * ${p.name}: Q2 was ${fmt(p.q2Revenue)}, Q3 was ${fmt(p.q3Revenue)}, Difference: ${p.diff >= 0 ? '+' : ''}${fmt(p.diff)} (${p.pctChange.toFixed(2)}%)`).join('\n')}
- Channel Revenue Shifts in ${payload.mostChangedRegion}:
${payload.channelDrivers.map(c => `  * ${c.name}: Q2 was ${fmt(c.q2Revenue)}, Q3 was ${fmt(c.q3Revenue)}, Difference: ${c.diff >= 0 ? '+' : ''}${fmt(c.diff)} (${c.pctChange.toFixed(2)}%)`).join('\n')}
- Other Regional Revenue Context:
${payload.allRegions.map(r => `  * ${r.region}: Q2 was ${fmt(r.q2Revenue)}, Q3 was ${fmt(r.q3Revenue)}, Diff: ${r.diff >= 0 ? '+' : ''}${fmt(r.diff)} (${r.pctChange.toFixed(2)}%)`).join('\n')}
`;

    const aiPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.2,
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API call timed out')), 3500)
    );

    const response = await Promise.race([aiPromise, timeoutPromise]);
    const aiText = response && 'text' in response && response.text ? response.text.trim() : '';

    // Verify sentences count roughly (splitting by punctuation)
    const sentences = aiText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);

    if (sentences.length === 3) {
      res.json({
        summary: aiText,
        source: 'gemini-3.8-flash',
      });
      return;
    }

    // If Gemini produced 2 or 4 sentences or failed formatting, we can either re-join or use the verified 3-sentence fallback
    if (aiText && sentences.length >= 2 && sentences.length <= 4) {
      res.json({
        summary: aiText,
        source: 'gemini-3.8-flash',
      });
      return;
    }

    res.json({
      summary: fallbackText,
      source: 'calculated_engine',
    });
  } catch (err: unknown) {
    console.error('Gemini API call failed:', err);
    // Graceful fallback to verified calculated numbers
    try {
      const payload: RegionAnalysisPayload = req.body;
      const fallbackText = buildDeterministicSummary(payload);
      res.json({
        summary: fallbackText,
        source: 'calculated_engine',
        warning: 'Summary generated with calculated engine due to model response.',
      });
    } catch {
      res.status(500).json({ error: 'Failed to generate summary' });
    }
  }
});

// GET endpoint to provide the default sample CSV file
app.get('/api/sample-csv', (_req: Request, res: Response) => {
  const filePath = path.resolve(process.cwd(), 'public/assets/aistudio/Lab_1_-_Regional_Sales__1__de1de499.csv');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'text/csv');
    res.sendFile(filePath);
  } else {
    res.status(404).send('Sample CSV not found');
  }
});

// Vite middleware integration for dev mode or static files for production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
