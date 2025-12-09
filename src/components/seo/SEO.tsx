// External Libraries
import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description?: string;
  canonical?: string;
}

export default function SEO({ title, description, canonical }: SEOProps) {
  const fullTitle = `${title}`;
  const canonicalUrl = canonical || (typeof window !== 'undefined' ? window.location.href : '/');
  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content="website" />
    </Helmet>
  );
}
