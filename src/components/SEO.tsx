import React from 'react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  twitterCard?: 'summary' | 'summary_large_image';
  jsonLd?: Record<string, any>;
  breadcrumbs?: BreadcrumbItem[];
}

export function SEO({
  title,
  description,
  canonical,
  noindex = false,
  ogImage,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  jsonLd,
  breadcrumbs
}: SEOProps) {
  const baseUrl = 'https://folio-ebook.vercel.app';

  const fullTitle = title ? `${title} | Folio E-Book Store` : 'Folio E-Book Store — Buy Affordable Digital Books Online';
  const fullDescription = description || 'Buy ebooks online at Folio — Affordable digital books, instant PDF downloads, lifetime library access. Self-help, technology, business & educational ebooks.';
  const fullCanonical = canonical ? (canonical.startsWith('http') ? canonical : `${baseUrl}${canonical}`) : baseUrl;
  const fullOgImage = ogImage ? (ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`) : `${baseUrl}/og-image.png`;

  const breadcrumbJsonLd = breadcrumbs && breadcrumbs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: item.href.startsWith('http') ? item.href : `${baseUrl}${item.href}` } : {})
    }))
  } : undefined;

  const combinedJsonLd = jsonLd && breadcrumbJsonLd
    ? { '@context': 'https://schema.org', ...jsonLd, ...breadcrumbJsonLd }
    : jsonLd || breadcrumbJsonLd;

  return null;
}

export function applySEO(props: SEOProps) {
  const baseUrl = 'https://folio-ebook.vercel.app';

  const fullTitle = props.title ? `${props.title} | Folio E-Book Store` : 'Folio E-Book Store — Buy Affordable Digital Books Online';
  const fullDescription = props.description || 'Buy ebooks online at Folio — Affordable digital books, instant PDF downloads, lifetime library access. Self-help, technology, business & educational ebooks.';
  const fullCanonical = props.canonical ? (props.canonical.startsWith('http') ? props.canonical : `${baseUrl}${props.canonical}`) : baseUrl;
  const fullOgImage = props.ogImage ? (props.ogImage.startsWith('http') ? props.ogImage : `${baseUrl}${props.ogImage}`) : `${baseUrl}/og-image.png`;

  if (typeof document === 'undefined') return;

  document.title = fullTitle;

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

  setMeta('description', fullDescription);
  setProp('og:description', fullDescription);
  setProp('twitter:description', fullDescription);

  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = fullCanonical;

  if (props.noindex) {
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

  setProp('og:image', fullOgImage);
  setProp('og:type', props.ogType || 'website');
  setProp('og:title', fullTitle);
  setProp('og:url', fullCanonical);
  setProp('twitter:image', fullOgImage);
  setProp('twitter:card', props.twitterCard || 'summary_large_image');
  setProp('twitter:title', fullTitle);

  const existing = document.getElementById('json-ld-seo');
  if (existing) existing.remove();

  if (props.jsonLd || (props.breadcrumbs && props.breadcrumbs.length > 0)) {
    const script = document.createElement('script');
    script.id = 'json-ld-seo';
    script.type = 'application/ld+json';

    const breadcrumbJsonLd = props.breadcrumbs && props.breadcrumbs.length > 0 ? {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: props.breadcrumbs.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.label,
        ...(item.href ? { item: item.href.startsWith('http') ? item.href : `${baseUrl}${item.href}` } : {})
      }))
    } : undefined;

    const combined = props.jsonLd && breadcrumbJsonLd
      ? { '@context': 'https://schema.org', ...props.jsonLd, ...breadcrumbJsonLd }
      : props.jsonLd || breadcrumbJsonLd;

    script.text = JSON.stringify(combined);
    document.head.appendChild(script);
  }
}

export function createProductJsonLd(ebook: {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  currency: string;
  coverImageUrl: string;
  slug: string;
  pageCount: number;
  publicationType?: string;
  comboItems?: Array<{ title: string; price?: number }>;
}) {
  const baseUrl = 'https://folio-ebook.vercel.app';
  const canonicalUrl = `${baseUrl}/ebooks/${ebook.slug}`;
  const sellingPrice = ebook.price;
  const originalPrice = ebook.originalPrice && ebook.originalPrice > ebook.price ? ebook.originalPrice : null;

  const offers: any = {
    '@type': 'Offer',
    price: sellingPrice.toString(),
    priceCurrency: ebook.currency,
    availability: 'https://schema.org/InStock',
    url: canonicalUrl,
    seller: {
      '@type': 'Organization',
      name: 'Folio E-Book Store'
    }
  };

  // Add original price as list price if there's a discount
  if (originalPrice) {
    offers.priceSpecification = {
      '@type': 'UnitPriceSpecification',
      price: originalPrice.toString(),
      priceCurrency: ebook.currency,
      priceType: 'https://schema.org/ListPrice'
    };
  }

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: ebook.title,
    description: ebook.description,
    image: ebook.coverImageUrl,
    sku: ebook.id,
    brand: {
      '@type': 'Brand',
      name: 'Folio E-Book Store'
    },
    category: ebook.category,
    offers,
    url: canonicalUrl
  };

  return productJsonLd;
}

export function createOrganizationJsonLd() {
  const baseUrl = 'https://folio-ebook.vercel.app';
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Folio E-Book Store',
    url: baseUrl,
    logo: `${baseUrl}/favicon.svg`,
    sameAs: []
  };
}

export function createWebSiteJsonLd() {
  const baseUrl = 'https://folio-ebook.vercel.app';
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Folio E-Book Store',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/ebooks?search={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };
}