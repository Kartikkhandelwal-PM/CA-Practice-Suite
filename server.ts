import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // AI Summary Endpoints
  app.post('/api/ai/generate', async (req, res) => {
    const { prompt, type } = req.body;
    
    // Simulate delay
    await new Promise(r => setTimeout(r, 1500));

    let resultText = "";
    if (type === 'summary' || prompt.includes('summary')) {
      resultText = JSON.stringify({
        title: "GSTR-3B Filing & Reconciliation",
        overview: "This task involves the monthly GSTR-3B filing. It requires reconciliation of GSTR-2B data and verification of tax liability.",
        steps: [
          "Download GSTR-2B for the current month",
          "Reconcile ITC with purchase register",
          "Verify tax liability from GSTR-1",
          "File GSTR-3B before the 20th"
        ],
        suggestedReply: "<p>Dear Client,</p><p>We have received your documents for GSTR-3B filing. We are currently reconciling the data and will update you shortly.</p><p>Best regards,<br>KDK Practice Suite</p>"
      });
    } else if (type === 'email' || prompt.includes('professional')) {
      resultText = JSON.stringify({
        subject: "Update on your Tax Compliance",
        body: "<p>Dear Client,</p><p>This is a follow-up regarding your tax compliance status. We have processed the initial documents and everything looks in order.</p><p>Best regards,<br>KDK Practice Suite</p>"
      });
    } else {
      resultText = "AI processing completed successfully (Mock Mode).";
    }

    res.json({ text: resultText });
  });

  app.get('/api/ai/status', (req, res) => {
    res.json({ configured: true, model: "gemini-1.5-flash (Mock)" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
