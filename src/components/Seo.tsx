import { useEffect } from "react";
import type { Service, SiteConfig } from "../types/content";
import { fullAddress } from "../lib/maps";
import { assetPath } from "../lib/paths";

interface SeoProps {
  site: SiteConfig;
  services: Service[];
}

/**
 * Заголовок, meta-теги, Open Graph, favicon и JSON-LD LocalBusiness.
 *
 * index.html содержит базовые теги для случая, когда JavaScript ещё не
 * выполнился. После монтирования значения берутся из content/site.json,
 * поэтому владелец может менять SEO-поля через Pages CMS.
 */
export function Seo({ site, services }: SeoProps) {
  useEffect(() => {
    const title =
      site.seoTitle || `${site.companyName} — шиномонтаж в ${site.city}, ${site.region}`;
    document.title = title;

    setMeta("name", "description", site.seoDescription || site.shortDescription);

    const keywords = [
      `шиномонтаж ${site.city}`,
      `шиномонтаж в ${site.city}`,
      `балансировка колёс ${site.city}`,
      `ремонт шин ${site.city}`,
      `замена шин ${site.city}`,
      site.region,
    ].join(", ");
    setMeta("name", "keywords", keywords);

    setMeta("name", "geo.region", site.region);
    setMeta("name", "geo.placename", site.city);

    setMeta("property", "og:type", "website");
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", site.seoDescription || site.shortDescription);
    setMeta("property", "og:locale", "ru_RU");
    setMeta("property", "og:site_name", site.companyName);
    setMeta("property", "og:url", window.location.href);

    if (site.ogImage) {
      setMeta("property", "og:image", new URL(assetPath(site.ogImage), window.location.href).href);
    }

    setMeta("name", "twitter:card", site.ogImage ? "summary_large_image" : "summary");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", site.seoDescription || site.shortDescription);

    if (site.favicon) {
      setLink("icon", assetPath(site.favicon));
    }

    const jsonLd = buildLocalBusinessJsonLd(site, services);
    setJsonLd(jsonLd);
  }, [site, services]);

  return null;
}

function setMeta(attribute: "name" | "property", key: string, value: string): void {
  if (!value) return;

  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", value);
}

function setLink(rel: string, href: string): void {
  if (!href) return;

  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

function setJsonLd(data: Record<string, unknown>): void {
  const id = "local-business-jsonld";
  let element = document.getElementById(id) as HTMLScriptElement | null;

  if (!element) {
    element = document.createElement("script");
    element.id = id;
    element.type = "application/ld+json";
    document.head.appendChild(element);
  }

  element.textContent = JSON.stringify(data);
}

/**
 * JSON-LD LocalBusiness для локального SEO.
 * Домен подставляется во время выполнения, чтобы данные не были привязаны
 * к конкретному адресу сайта.
 */
function buildLocalBusinessJsonLd(
  site: SiteConfig,
  services: Service[],
): Record<string, unknown> {
  const origin = window.location.origin;
  const base = import.meta.env.BASE_URL || "/";
  const url = new URL(base, origin).href;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    name: site.companyName,
    description: site.seoDescription || site.shortDescription,
    url,
    telephone: site.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address,
      addressLocality: site.city,
      addressRegion: site.region,
      addressCountry: "RU",
    },
    areaServed: {
      "@type": "City",
      name: site.city,
    },
    openingHours: site.workingHours,
    priceRange: "₽₽",
    image: site.ogImage ? new URL(assetPath(site.ogImage), origin).href : undefined,
    makesOffer: services.map((service) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: service.title,
        description: service.description,
      },
      ...(service.price !== null
        ? {
            priceSpecification: {
              "@type": "PriceSpecification",
              price: service.price,
              priceCurrency: "RUB",
            },
          }
        : {}),
    })),
  };

  if (site.latitude !== null && site.longitude !== null) {
    data.geo = {
      "@type": "GeoCoordinates",
      latitude: site.latitude,
      longitude: site.longitude,
    };
  }

  if (site.reviewCount > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: site.rating,
      reviewCount: site.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // Пустые значения в JSON-LD не нужны.
  Object.keys(data).forEach((key) => {
    if (data[key] === undefined || data[key] === "") delete data[key];
  });

  return data;
}

/** Полный адрес для отладки/вывода — экспортируется для переиспользования. */
export const __fullAddress = fullAddress;
