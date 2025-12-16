import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import presignHandler from "./api/presign.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || "8081", 10);
const HOST = process.env.HOST || "localhost";

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API endpoint for presign
app.post("/api/presign", async (req: Request, res: Response) => {
  try {
    await presignHandler(req, res);
  } catch (error) {
    console.error("[server] presign error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// Serve static files from dist directory
app.use(
  express.static(path.join(__dirname, "dist"), {
    maxAge: "1y",
    etag: true,
    lastModified: true,
    setHeaders: (res: Response, filepath: string) => {
      // Cache static assets
      if (filepath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  })
);

// SPA fallback - serve index.html for all other routes
app.get("*", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("[server] error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, HOST, () => {
  console.log("================================================");
  console.log("🚀 Baskit Distributor Hub Server");
  console.log("================================================");
  console.log(`📍 Server running on: http://${HOST}:${PORT}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, "dist")}`);
  console.log(`🔐 API endpoint: POST http://${HOST}:${PORT}/api/presign`);
  console.log(`💚 Health check: GET http://${HOST}:${PORT}/health`);
  console.log("================================================");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  process.exit(0);
});
