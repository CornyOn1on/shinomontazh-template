/**
 * Работа с путями к статическим файлам.
 *
 * На GitHub Pages сайт может жить в подпапке (/<repo>/), а с собственным
 * доменом — в корне (/). Vite подставляет базовый путь в import.meta.env.BASE_URL
 * (см. base в vite.config.ts). Поэтому все пути из JSON-контента, начинающиеся
 * с "/", нужно приводить к реальному базовому пути.
 */

/**
 * Приводит путь из контента к корректному URL с учётом base.
 *
 * assetPath("/images/company/photo.jpg") → "/repo/images/company/photo.jpg"
 * assetPath("") → ""
 * assetPath("https://...") → "https://..." (внешние ссылки не трогаем)
 */
export function assetPath(path: string): string {
  if (!path) return "";
  if (/^(https?:)?\/\//i.test(path) || path.startsWith("data:")) return path;

  const base = import.meta.env.BASE_URL || "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;

  return `${normalizedBase}${normalizedPath}`;
}

/** Инициалы названия компании для текстового логотипа. */
export function companyInitials(name: string): string {
  const words = name
    .replace(/[«»"'()]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);

  if (words.length === 0) return "ШМ";
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return `${words[0]![0]}${words[1]![0]}`.toUpperCase();
}
