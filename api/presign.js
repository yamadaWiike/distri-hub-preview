const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  try {
    const url = req.body && typeof req.body.url === 'string' ? req.body.url : null;
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

    let Key = url;
    const m = url.match(/https?:\/\/[^/]+\/(.+)$/);
    if (m) Key = m[1];

    const cmd = new GetObjectCommand({ Bucket: bucket, Key });
    const signedUrl = await getSignedUrl(s3, cmd, { expiresIn: expires });
    const hasSignature = /X-Amz-Signature/i.test(signedUrl);

    res.status(200).json({ url: signedUrl, hasSignature, bucket, region });
  } catch (e) {
    console.error('[api/presign] error', e);
    res.status(500).json({ error: e && e.message ? e.message : 'Presign failed' });
  }
};
