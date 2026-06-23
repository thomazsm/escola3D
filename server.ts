import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { VertexAI } from '@google-cloud/vertexai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Vertex AI Endpoint
  app.post("/api/magic-trace", async (req, res) => {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: "Image is required" });
    }

    try {
      const vertexAI = new VertexAI({
        project: process.env.VERTEX_AI_PROJECT_ID || 'gen-lang-client-0087218759',
        location: process.env.VERTEX_AI_LOCATION || 'us-central1'
      });
      
      const model = vertexAI.getGenerativeModel({
        model: "gemini-1.5-pro-002",
        generationConfig: {
          responseMimeType: "application/json",
        }
      });
      
      const mimeType = image.split(';')[0].split(':')[1] || 'image/png';
      const base64Data = image.split(',')[1];
      
      const prompt = `Analyze this school floor plan image in detail. 
      Your task is to convert this floor plan into a simplified and faithful 3D model.
      
      Return ONLY a JSON array of objects with these properties: name (string), type (string: classroom, admin, sports, service, common, library, cafeteria, laboratory, playground), x (number, -50 to 50), y (number, -50 to 50), width (number), height (number), color (string, hex).
      Important: Coordinates x=0,y=0 is center. Image is 100x100m.`;

      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inlineData: { data: base64Data, mimeType: mimeType } }
            ]
          }
        ]
      });

      const response = await result.response;
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
      res.json(JSON.parse(text));
    } catch (error) {
      console.error("Vertex AI Error:", error);
      res.status(500).json({ error: "Failed to process image" });
    }
  });

  // Vite middle-ware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
