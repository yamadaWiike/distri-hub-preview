import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  try {
    // Be tolerant of raw string or improperly parsed bodies
    let body = req.body;
    if (!body && typeof req.rawBody === 'string') {
      try { body = JSON.parse(req.rawBody); } catch { body = { url: req.rawBody }; }
    }
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = { url: body }; }
    }
    const url: string | null = body && typeof body.url === 'string' ? body.url : null;
    if (!url) {
      res.status(400).json({ error: 'Missing url in body' });
      return;
    }

    const region = process.env.VITE_AWS_DEFAULT_REGION || process.env.AWS_REGION;
    const bucket = process.env.VITE_AWS_BUCKET || '';
    const expires = parseInt(process.env.VITE_S3_PRESIGN_EXPIRES || '900', 10);
    const accessKeyId = process.env.VITE_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.VITE_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

    if (!region || !bucket) {
      res.status(500).json({ error: 'Missing AWS region/bucket' });
      return;
    }

    const creds = accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined;
    const s3 = new S3Client({ region, credentials: creds });

    // Robust key extraction (virtual-hosted or path-style). Always presign against ENV bucket.
    let Key = url;
    if (/^https?:\/\//i.test(url)) {
      try {
        const u = new URL(url);
        const path = u.pathname.replace(/^\/+/, '');
        if (path && bucket && path.startsWith(`${bucket}/`)) {
          Key = path.substring(bucket.length + 1);
        } else {
          Key = path || url;
        }
      } catch {
        const m = url.match(/^https?:\/\/[^/]+\/(.+)$/);
        if (m && m[1]) Key = m[1];
      }
    }

    const cmd = new GetObjectCommand({ Bucket: bucket, Key });
    const signedUrl = await getSignedUrl(s3, cmd, { expiresIn: expires });
    const hasSignature = /X-Amz-Signature/i.test(signedUrl);

    res.status(200).json({ url: signedUrl, hasSignature, bucket, region });
  } catch (e: any) {
    console.error('[api/presign] error', e);
    res.status(500).json({ error: e?.message || 'Presign failed' });
  }
}
