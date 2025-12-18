import { useEffect, useRef, useState } from "react";
import { getImageUrlAsync, getImageUrl, normalizeS3ToEnvBucket } from "@/lib/s3-upload";

type Props = {
  src: string;
  alt?: string;
  className?: string;
  allowRawS3?: boolean; // When true, allow direct S3 URLs without presign
  fallbackToRaw?: boolean; // When true, fallback to raw S3 URL if presign fails (useful for dev)
};

export default function PresignedImage({ src, alt = "", className, allowRawS3 = false, fallbackToRaw = true }: Props) {
  const [resolved, setResolved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const triedFallbackRef = useRef(false);
  const isDevelopment = import.meta.env.MODE === 'development';

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

      // Try to presign the URL
      const url = await getImageUrlAsync(normalizedSrc);
      if (cancelled) return;
      
      if (!url) {
        // Presign failed - fallback to raw S3 URL in development or if fallback enabled
        if ((isDevelopment || fallbackToRaw) && /amazonaws\.com/i.test(normalizedSrc)) {
          console.warn('[PresignedImage] Presign failed, falling back to raw S3 URL for:', normalizedSrc);
          setResolved(normalizedSrc);
          return;
        }
        setError("Failed to resolve presigned URL");
        return;
      }

      // Allow data URLs (from localStorage in dev) without X-Amz-Signature
      if (url.startsWith("data:")) {
        setResolved(url);
        return;
      }

      // For S3 URLs, require X-Amz-Signature (unless fallback enabled and in dev)
      if (!/X-Amz-Signature/i.test(url)) {
        if ((isDevelopment || fallbackToRaw) && /amazonaws\.com/i.test(normalizedSrc)) {
          console.warn('[PresignedImage] Signature check failed, falling back to raw S3 URL for:', normalizedSrc);
          setResolved(normalizedSrc);
          return;
        }
        setError("Missing X-Amz-Signature in URL");
        return;
      }
      setResolved(url);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [src, isDevelopment, fallbackToRaw]);

  // On-error fallback: if presign failed or image load failed, try raw S3 or retry presign
  const handleError = async () => {
    if (triedFallbackRef.current) return;
    triedFallbackRef.current = true;
    if (!src) return;

    const looksLikeS3 = /amazonaws\.com/i.test(src);
    if (!looksLikeS3) return;

    // In development or if fallback enabled, try raw S3 first
    if (isDevelopment || fallbackToRaw) {
      const normalizedSrc = normalizeS3ToEnvBucket(src);
      console.warn('[PresignedImage] Image load error, trying raw S3 URL fallback for:', normalizedSrc);
      setResolved(normalizedSrc);
      setError(null);
      return;
    }

    // Otherwise, try presigning again as final fallback
    const url = await getImageUrlAsync(normalizeS3ToEnvBucket(src));
    if (url && /X-Amz-Signature/i.test(url)) {
      console.warn('[PresignedImage] Retrying presign URL after image load error');
      setResolved(url);
      setError(null);
      return;
    }
    setError("Failed to load image: all fallback attempts exhausted");
  };

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className || ''}`}>
        <div className="text-center">
          <div className="text-4xl mb-2">📄</div>
          <p className="text-xs text-gray-500">{alt}</p>
        </div>
      </div>
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
