import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import type { Plugin } from "vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Bridge VITE_* to process.env for dev middleware
  process.env.VITE_AWS_DEFAULT_REGION = process.env.VITE_AWS_DEFAULT_REGION || env.VITE_AWS_DEFAULT_REGION;
  process.env.VITE_AWS_BUCKET = process.env.VITE_AWS_BUCKET || env.VITE_AWS_BUCKET;
  process.env.VITE_S3_PRESIGN_EXPIRES = process.env.VITE_S3_PRESIGN_EXPIRES || env.VITE_S3_PRESIGN_EXPIRES;
  process.env.VITE_AWS_ACCESS_KEY_ID = process.env.VITE_AWS_ACCESS_KEY_ID || env.VITE_AWS_ACCESS_KEY_ID;
  process.env.VITE_AWS_SECRET_ACCESS_KEY = process.env.VITE_AWS_SECRET_ACCESS_KEY || env.VITE_AWS_SECRET_ACCESS_KEY;

  return ({
  server: {
    host: "::",
    port: 8080,
    strictPort: false,
    // Enable history API fallback for SPA client-side routing
    historyApiFallback: true,
  },
  plugins: [
    react(),
    // Dev-only presign middleware to ensure URLs include X-Amz-Signature
    (function presignMiddleware(): Plugin {
      return {
        name: 'presign-middleware',
        configureServer(server) {
          server.middlewares.use('/api/presign', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
              return;
            }
            try {
              const chunks: Buffer[] = [];
              for await (const chunk of req) chunks.push(Buffer.from(chunk));
              const bodyStr = Buffer.concat(chunks).toString('utf-8');
              const payload = JSON.parse(bodyStr || '{}');
              const rawUrl: string = payload?.url || '';

              // Validate input
              if (!rawUrl) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Missing URL in request body' }));
                return;
              }

              // Lazy import AWS SDK only in dev server
              const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
              const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

              const region = process.env.VITE_AWS_DEFAULT_REGION || process.env.AWS_REGION;
              const bucket = process.env.VITE_AWS_BUCKET || '';
              const expires = parseInt(process.env.VITE_S3_PRESIGN_EXPIRES || '900', 10);
              const accessKeyId = process.env.VITE_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
              const secretAccessKey = process.env.VITE_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

              // Validate required configuration
              if (!region) {
                console.error('[presign] Missing AWS_DEFAULT_REGION');
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Server misconfiguration: missing region' }));
                return;
              }

              if (!bucket) {
                console.error('[presign] Missing AWS_BUCKET');
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Server misconfiguration: missing bucket' }));
                return;
              }

              // AWS credentials are optional for some scenarios, but warn if missing in production
              if (!accessKeyId || !secretAccessKey) {
                console.warn('[presign] AWS credentials not found. Presigning may fail for private buckets.');
              }

              // Create S3 client with proper credential handling
              const s3ClientConfig: any = { region };
              if (accessKeyId && secretAccessKey) {
                s3ClientConfig.credentials = { accessKeyId, secretAccessKey };
              }
              const s3 = new S3Client(s3ClientConfig);

              // Derive Key from full S3 URL (virtual-hosted or path-style) or accept raw key
              let Key = rawUrl;
              if (/^https?:\/\//i.test(rawUrl)) {
                try {
                  const u = new URL(rawUrl);
                  const path = u.pathname.replace(/^\/+/, '');
                  if (path && bucket && path.startsWith(`${bucket}/`)) {
                    // Path-style URL: s3.<region>.amazonaws.com/<bucket>/<key>
                    Key = path.substring(bucket.length + 1);
                  } else {
                    // Virtual-hosted style already yields the key-only path
                    Key = path || rawUrl;
                  }
                } catch (urlError) {
                  console.error('[presign] URL parsing error:', urlError, 'rawUrl:', rawUrl);
                  const m = rawUrl.match(/https?:\/\/[^/]+\/(.+)$/);
                  if (m) Key = m[1];
                }
              }

              if (!Key) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Could not extract key from URL' }));
                return;
              }

              const cmd = new GetObjectCommand({ Bucket: bucket, Key });
              const signedUrl = await getSignedUrl(s3, cmd, { expiresIn: expires });
              const hasSignature = /X-Amz-Signature/i.test(signedUrl);

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ url: signedUrl, hasSignature, bucket, region }));
            } catch (e) {
              console.error('[presign] error', e);
              const errorMsg = (e && typeof e === 'object' && 'message' in e) ? (e as any).message : 'Presign failed';
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: errorMsg }));
            }
          });
        },
      };
    })(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: mode === "development",
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-label', 
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            'lucide-react'
          ],
          'supabase-vendor': ['@supabase/supabase-js'],
          'chart-vendor': ['recharts'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
  },
  });
});
