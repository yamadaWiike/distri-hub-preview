const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  try {
    // Support both parsed JSON and raw string body
    let body = req.body;
    if (!body && typeof req.rawBody === 'string') {
      try { body = JSON.parse(req.rawBody); } catch (_) {}
    }
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (_) { body = { url: body }; }
    }
    const url = body && typeof body.url === 'string' ? body.url : null;
    if (!url) {
      res.status(400).json({ error: 'Missing url in body' });
      return;
    }

    const region = process.env.AWS_REGION || process.env.VITE_AWS_DEFAULT_REGION || process.env.AWS_DEFAULT_REGION;
    const bucket = process.env.AWS_S3_BUCKET || process.env.S3_BUCKET || process.env.S3_BUCKET_NAME || process.env.VITE_AWS_BUCKET || '';
    const expires = parseInt(process.env.VITE_S3_PRESIGN_EXPIRES || '900', 10);
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.VITE_AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.VITE_AWS_SECRET_ACCESS_KEY;

    if (!region || !bucket) {
      res.status(500).json({ error: 'Missing AWS region/bucket' });
      return;
    }

    const creds = accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined;
    const s3 = new S3Client({ region, credentials: creds });

    // Derive object key from URL styles (virtual-hosted or path-style)
    // Examples we handle:
    // - https://<bucket>.s3.<region>.amazonaws.com/<key>
    // - https://s3.<region>.amazonaws.com/<bucket>/<key>
    // - https://<bucket>.s3.amazonaws.com/<key>
    // If a raw key is provided (no http), use as-is
    let Key = url;
    if (/^https?:\/\//i.test(url)) {
      try {
        const u = new URL(url);
        const path = u.pathname.replace(/^\/+/, ''); // strip leading '/'
        // If path-style (starts with bucket/...), drop the leading bucket segment
        if (path && bucket && path.startsWith(`${bucket}/`)) {
          Key = path.substring(bucket.length + 1);
        } else {
          Key = path || url; // virtual-hosted style already only contains the key
        }
      } catch (_) {
        // Fallback to previous regex extraction if URL parsing fails
        const m = url.match(/^https?:\/\/[^/]+\/(.+)$/);
        if (m && m[1]) Key = m[1];
      }
    }

    const cmd = new GetObjectCommand({ Bucket: bucket, Key });
    const signedUrl = await getSignedUrl(s3, cmd, { expiresIn: expires });
    const hasSignature = /X-Amz-Signature/i.test(signedUrl);

    res.status(200).json({ url: signedUrl, hasSignature });
  } catch (e) {
    console.error('[api/presign] error', e);
    res.status(500).json({ error: e && e.message ? e.message : 'Presign failed' });
  }
};
