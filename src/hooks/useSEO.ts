import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  twitterCard?: 'summary' | 'summary_large_image';
  jsonLd?: Record<string, any>;
}

export function useSEO({
  title,
  description,
  canonical,
  noindex = false,
  ogImage,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  jsonLd
}: SEOProps) {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (title) {
      document.title = title;
    }

    const setMeta = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.name = name;
        document.head.appendChild(tag);
      }
      tag.content = content;
    };

    const setProp = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.content = content;
    };

    if (description) {
      setMeta('description', description);
      setProp('og:description', description);
      setProp('twitter:description', description);
    }

    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = canonical;
    }

    if (noindex) {
      let tag = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.name = 'robots';
        document.head.appendChild(tag);
      }
      tag.content = 'noindex, nofollow';
    } else {
      let tag = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
      if (tag) {
        tag.content = 'index, follow';
      }
    }

    if (ogImage) {
      setProp('og:image', ogImage);
      setProp('twitter:image', ogImage);
    }

    setProp('og:type', ogType);
    setProp('og:title', title || document.title);
    setProp('twitter:card', twitterCard);

    if (jsonLd) {
      const existing = document.getElementById('json-ld-seo');
      if (existing) existing.remove();

      const script = document.createElement('script');
      script.id = 'json-ld-seo';
      script.type = 'application/ld+json';
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      const existing = document.getElementById('json-ld-seo');
      if (existing) existing.remove();
    };
  }, [title, description, canonical, noindex, ogImage, ogType, twitterCard, jsonLd]);
}
