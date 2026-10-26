import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini Client
  const apiKey = process.env.GEMINI_API_KEY || '';
  const ai = new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(apiKey),
      timestamp: new Date().toISOString(),
    });
  });

  // Chat API endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      const {
        messages,
        model = 'gemini-3.5-flash',
        systemInstruction,
        contextData,
      } = req.body;

      if (!apiKey) {
        return res.status(503).json({
          error:
            'GEMINI_API_KEY is not configured on the server. Please check your environment configuration.',
        });
      }

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required.' });
      }

      // Format multi-turn conversation for @google/genai
      const contents = messages.map((m: { role: 'user' | 'model'; text: string }) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

      // Enrich system instruction with optional business snapshot context
      let enrichedInstruction = systemInstruction || 'You are an intelligent ERP & Inventory assistant.';
      if (contextData) {
        enrichedInstruction += `\n\n--- CURRENT ERP REAL-TIME CONTEXT ---\n${JSON.stringify(
          contextData,
          null,
          2
        )}\nUse this real-time ERP catalog, order, and inventory data to give precise, actionable answers.`;
      }

      // Allowed models as specified by skill
      const validModels = [
        'gemini-3.5-flash',
        'gemini-3.1-flash-lite',
        'gemini-3.1-pro-preview',
        'gemini-3.8-flash',
      ];
      const selectedModel = validModels.includes(model) ? model : 'gemini-3.5-flash';

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents,
        config: {
          systemInstruction: enrichedInstruction,
        },
      });

      const reply = response.text || 'I apologize, but I could not generate a response at this time.';

      return res.json({
        reply,
        modelUsed: selectedModel,
      });
    } catch (err: any) {
      console.error('Gemini API chat error:', err);
      return res.status(500).json({
        error: err?.message || 'Failed to generate response from Gemini API',
      });
    }
  });

  // Mount Vite or serve static assets
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ERP Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
