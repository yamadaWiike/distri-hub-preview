import { useEffect, useRef, useState } from "react";
import { getImageUrlAsync, getImageUrl, normalizeS3ToEnvBucket } from "@/lib/s3-upload";

type Props = {
  src: string;
  alt?: string;
  className?: string;
  allowRawS3?: boolean; // When true, allow direct S3 URLs without presign
};

export default function PresignedImage({ src, alt = "", className, allowRawS3 = false }: Props) {
  const [resolved, setResolved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const triedFallbackRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setError(null);
      setResolved(null);
      triedFallbackRef.current = false;

      // Normalize S3 URLs to ENV bucket
      const normalizedSrc = normalizeS3ToEnvBucket(src);

      // Dev support: localStorage keys
      const devUrl = getImageUrl(normalizedSrc);
      if (devUrl && devUrl.startsWith("data:")) {
        setResolved(devUrl);
        return;
      }

      // Skip presigning for local/static assets or non-S3 external URLs
      if (!normalizedSrc) {
        setError("Missing source");
        return;
      }
      if (
        normalizedSrc.startsWith("/") ||
        normalizedSrc.startsWith("blob:") ||
        (normalizedSrc.startsWith("http") && !/amazonaws\.com/i.test(normalizedSrc))
      ) {
        setResolved(normalizedSrc);
        return;
      }

      // If explicitly allowed, use raw S3 URL as-is (no signature enforcement)
      if (allowRawS3 && /^https?:/i.test(normalizedSrc)) {
        setResolved(normalizedSrc);
        return;
      }

      // If already signed URL, use directly
      if (/X-Amz-Signature/i.test(normalizedSrc)) {
        setResolved(normalizedSrc);
        return;
      }

      const url = await getImageUrlAsync(normalizedSrc);
      if (cancelled) return;
      if (!url) {
        setError("Failed to resolve presigned URL");
        return;
      }
      if (!/X-Amz-Signature/i.test(url)) {
        setError("Missing X-Amz-Signature in URL");
        return;
      }
      setResolved(url);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [src]);

  // On-error fallback: if using raw S3 and it fails, try presigning
  const handleError = async () => {
    if (triedFallbackRef.current) return;
    triedFallbackRef.current = true;
    if (!src) return;
    // Only attempt fallback if raw S3 was allowed or URL looks like S3
    const looksLikeS3 = /amazonaws\.com/i.test(src);
    if (allowRawS3 || looksLikeS3) {
      const url = await getImageUrlAsync(normalizeS3ToEnvBucket(src));
      if (url && /X-Amz-Signature/i.test(url)) {
        setResolved(url);
        setError(null);
        return;
      }
      setError("Failed to resolve presigned URL after error");
    }
  };

  if (error) {
    return (
      <img
        src="/placeholder.svg"
        alt={alt}
        className={className}
      />
    );
  }

  if (!resolved) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className || ''}`}>
        <div className="h-6 w-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <img src={resolved} alt={alt} className={className} onError={handleError} />;
}
