import { useEffect, useState } from "react";
import { getImageUrlAsync, getImageUrl } from "@/lib/s3-upload";

type Props = {
  src: string;
  alt?: string;
  className?: string;
};

export default function PresignedImage({ src, alt = "", className }: Props) {
  const [resolved, setResolved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setError(null);
      setResolved(null);

      // Dev support: localStorage keys
      const devUrl = getImageUrl(src);
      if (devUrl && devUrl.startsWith("data:")) {
        setResolved(devUrl);
        return;
      }

      const url = await getImageUrlAsync(src);
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

  if (error) {
    return (
      <div className="flex items-center justify-center bg-gray-100 text-gray-500 text-xs">
        {error}
      </div>
    );
  }

  if (!resolved) {
    return (
      <div className="flex items-center justify-center bg-gray-100">
        <div className="h-6 w-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <img src={resolved} alt={alt} className={className} />;
}
