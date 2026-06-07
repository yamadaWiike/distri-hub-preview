import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Plugin } from "vite";

type EnvMap = Record<string, string>;

const bridgeAwsEnv = (env: EnvMap) => {
  process.env.VITE_AWS_DEFAULT_REGION =
    process.env.VITE_AWS_DEFAULT_REGION || env.VITE_AWS_DEFAULT_REGION;
  process.env.VITE_AWS_BUCKET =
    process.env.VITE_AWS_BUCKET || env.VITE_AWS_BUCKET;
  process.env.VITE_S3_PRESIGN_EXPIRES =
    process.env.VITE_S3_PRESIGN_EXPIRES || env.VITE_S3_PRESIGN_EXPIRES;
  process.env.VITE_AWS_ACCESS_KEY_ID =
    process.env.VITE_AWS_ACCESS_KEY_ID || env.VITE_AWS_ACCESS_KEY_ID;
  process.env.VITE_AWS_SECRET_ACCESS_KEY =
    process.env.VITE_AWS_SECRET_ACCESS_KEY || env.VITE_AWS_SECRET_ACCESS_KEY;
};

const sendJson = (
  res: { statusCode: number; setHeader: (name: string, value: string) => void; end: (body: string) => void },
  statusCode: number,
  body: Record<string, unknown>
) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
};

const readRequestBody = async (req: AsyncIterable<Uint8Array>) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf-8");
};

const extractS3Key = (rawUrl: string, bucket: string) => {
  if (!/^https?:\/\//i.test(rawUrl)) return rawUrl;

  try {
    const url = new URL(rawUrl);
    const pathname = url.pathname.replace(/^\/+/, "");

    if (pathname && bucket && pathname.startsWith(`${bucket}/`)) {
      return pathname.substring(bucket.length + 1);
    }

    return pathname || rawUrl;
  } catch {
    const match = rawUrl.match(/https?:\/\/[^/]+\/(.+)$/);
    return match?.[1] || rawUrl;
  }
};

export const createPresignMiddleware = (env: EnvMap): Plugin => {
  bridgeAwsEnv(env);

  return {
    name: "presign-middleware",
    configureServer(server) {
      server.middlewares.use("/api/presign", async (req, res) => {
        if (req.method !== "POST") {
          sendJson(res, 405, { error: "Method Not Allowed" });
          return;
        }

        try {
          const bodyStr = await readRequestBody(req);
          const payload = JSON.parse(bodyStr || "{}");
          const rawUrl: string = payload?.url || "";

          if (!rawUrl) {
            sendJson(res, 400, { error: "Missing URL in request body" });
            return;
          }

          const region = process.env.VITE_AWS_DEFAULT_REGION || process.env.AWS_REGION;
          const bucket = process.env.VITE_AWS_BUCKET || "";
          const expires = parseInt(process.env.VITE_S3_PRESIGN_EXPIRES || "900", 10);
          const accessKeyId = process.env.VITE_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
          const secretAccessKey =
            process.env.VITE_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

          if (!region) {
            console.error("[presign] Missing AWS_DEFAULT_REGION");
            sendJson(res, 500, { error: "Server misconfiguration: missing region" });
            return;
          }

          if (!bucket) {
            console.error("[presign] Missing AWS_BUCKET");
            sendJson(res, 500, { error: "Server misconfiguration: missing bucket" });
            return;
          }

          if (!accessKeyId || !secretAccessKey) {
            console.warn("[presign] AWS credentials not found. Presigning may fail for private buckets.");
          }

          const s3ClientConfig: ConstructorParameters<typeof S3Client>[0] = { region };
          if (accessKeyId && secretAccessKey) {
            s3ClientConfig.credentials = { accessKeyId, secretAccessKey };
          }

          const s3 = new S3Client(s3ClientConfig);
          const key = extractS3Key(rawUrl, bucket);

          if (!key) {
            sendJson(res, 400, { error: "Could not extract key from URL" });
            return;
          }

          const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
          const signedUrl = await getSignedUrl(s3, cmd, { expiresIn: expires });

          sendJson(res, 200, {
            url: signedUrl,
            hasSignature: /X-Amz-Signature/i.test(signedUrl),
            bucket,
            region,
          });
        } catch (error) {
          console.error("[presign] error", error);
          const errorMsg =
            error && typeof error === "object" && "message" in error
              ? String(error.message)
              : "Presign failed";
          sendJson(res, 500, { error: errorMsg });
        }
      });
    },
  };
};
