import type { SiteConfig } from "../types/content";

/**
 * Ссылки на карты и маршрут.
 *
 * Приоритет построения маршрута:
 *   1. Готовая ссылка yandexMapsUrl из настроек компании.
 *   2. Поиск по точному адресу (адрес + город + регион).
 *   3. Координаты — если они указаны, ссылка строится по ним (то есть
 *      координатам отдаётся приоритет над текстовым адресом, когда
 *      готовой ссылки нет).
 *
 * Главную страницу Яндекс Карт без адреса не открываем никогда.
 */

export interface RouteLinks {
  /** Ссылка "Построить маршрут" → маршрут до конкретного адреса. */
  routeUrl: string;
  /** Ссылка "Открыть адрес на карте" → показ точки на карте. */
  mapUrl: string;
  /** Есть ли достаточно данных, чтобы построить маршрут. */
  hasRoute: boolean;
}

const YANDEX_MAPS_BASE = "https://yandex.ru/maps/";

function coordinatesText(site: SiteConfig): string {
  if (site.latitude === null || site.longitude === null) return "";
  if (!Number.isFinite(site.latitude) || !Number.isFinite(site.longitude)) return "";
  return `${site.latitude},${site.longitude}`;
}

/** Полный адрес одной строкой: "Тульская область, г. Щёкино, ул. …, д. …". */
export function fullAddress(site: SiteConfig): string {
  return [site.address, site.city, site.region]
    .map((part) => (part || "").trim())
    .filter(Boolean)
    .filter((part, index, arr) => arr.findIndex((p) => p.toLowerCase() === part.toLowerCase()) === index)
    .join(", ");
}

/** Ссылка "Открыть адрес на карте" — точка без построения маршрута. */
export function buildMapUrl(site: SiteConfig): string {
  if (site.yandexMapsUrl.trim()) return site.yandexMapsUrl.trim();

  const coords = coordinatesText(site);
  if (coords) {
    return `${YANDEX_MAPS_BASE}?ll=${encodeURIComponent(coords)}&z=17&pt=${encodeURIComponent(coords)}`;
  }

  const address = fullAddress(site);
  if (address) {
    return `${YANDEX_MAPS_BASE}?text=${encodeURIComponent(address)}&z=17`;
  }

  return "";
}

/**
 * Ссылка "Построить маршрут".
 *
 * Яндекс Карты строят маршрут по параметру rtext в формате
 * "откуда~куда". Первую часть оставляем пустой — Яндекс подставит
 * текущее местоположение пользователя.
 */
export function buildRouteUrl(site: SiteConfig): string {
  const destination = coordinatesText(site) || fullAddress(site);

  if (!destination) {
    // Данных нет — отдаём готовую ссылку, если она всё-таки заполнена.
    return site.yandexMapsUrl.trim();
  }

  return `${YANDEX_MAPS_BASE}?rtext=~${encodeURIComponent(destination)}&rtt=auto`;
}

export function getRouteLinks(site: SiteConfig): RouteLinks {
  const routeUrl = buildRouteUrl(site);
  const mapUrl = buildMapUrl(site);

  return {
    routeUrl,
    mapUrl,
    hasRoute: routeUrl.length > 0,
  };
}

/** Ссылка для звонка: tel:+7... */
export function buildTelUrl(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : "";
}

/** Человекочитаемый телефон "показывать" — просто исходная строка из настроек. */
export function displayPhone(phone: string): string {
  return phone.trim();
}
