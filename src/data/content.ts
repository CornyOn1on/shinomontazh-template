import type {
  GalleryFile,
  ReviewsFile,
  ServicesFile,
  SiteConfig,
  Photo,
  Review,
  Service,
  Fact,
} from "../types/content";

import siteJson from "../../content/site.json";
import servicesJson from "../../content/services.json";
import reviewsJson from "../../content/reviews.json";
import galleryJson from "../../content/gallery.json";

/**
 * Слой данных.
 *
 * JSON-файлы из /content импортируются на этапе сборки Vite — серверный код
 * не нужен. После правки контента через Pages CMS GitHub Actions пересобирает
 * сайт, и обновлённые данные попадают в статику.
 *
 * Статический импорт (а не fetch) гарантирует, что данные точно попадут в
 * бандл и будут работать на GitHub Pages без дополнительных запросов.
 */

export const site = siteJson as unknown as SiteConfig;
export const servicesFile = servicesJson as unknown as ServicesFile;
export const reviewsFile = reviewsJson as unknown as ReviewsFile;
export const galleryFile = galleryJson as unknown as GalleryFile;

/** Услуги, отфильтрованные по видимости и отсортированные по sortOrder. */
export const services: Service[] = [...servicesFile.services]
  .filter((s) => s.isVisible)
  .sort((a, b) => a.sortOrder - b.sortOrder);

/** Отзывы, отфильтрованные по видимости и отсортированные по sortOrder. */
export const reviews: Review[] = [...reviewsFile.reviews]
  .filter((r) => r.isVisible)
  .sort((a, b) => a.sortOrder - b.sortOrder);

/** Фотографии галереи, отфильтрованные по видимости и отсортированные. */
export const photos: Photo[] = [...galleryFile.photos]
  .filter((p) => p.isVisible)
  .sort((a, b) => a.sortOrder - b.sortOrder);

/** Есть ли среди видимых фотографий хотя бы одна заглушка. */
export const hasPlaceholderPhotos: boolean = photos.some((p) => p.isPlaceholder);

/** Есть ли среди видимых отзывов хотя бы один демонстрационный. */
export const hasDemoReviews: boolean = reviews.some((r) => r.isDemo);

export const priceNote: string = servicesFile.priceNote;
export const reviewsNote: string = reviewsFile.reviewsNote;
export const galleryNote: string = galleryFile.galleryNote;

/**
 * Режим отображения: с фотографиями или без.
 *
 * Если в настройках явно указан "no-photos" — сайт работает в вариации
 * без фотографий, независимо от содержимого галереи.
 *
 * Если режим "photos", но видимых фотографий нет вообще — автоматически
 * переключаемся на вариацию без фотографий, чтобы не показывать пустую галерею.
 * Значения по умолчанию (если поля нет) — с фотографиями.
 */
export const configuredDisplayMode: "photos" | "no-photos" =
  site.displayMode === "no-photos" ? "no-photos" : "photos";

export const displayMode: "photos" | "no-photos" =
  configuredDisplayMode === "photos" && photos.length === 0 ? "no-photos" : configuredDisplayMode;

/** Работает ли сайт без фотографий. */
export const isPhotoLess: boolean = displayMode === "no-photos";

/** Показатели компании для вариации без фотографий. */
export const facts: Fact[] = [...(site.facts ?? [])]
  .filter((fact) => fact.isVisible !== false)
  .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

/** Нужно ли показывать пояснение о заглушках (только в вариации с фото). */
export const showPlaceholderNote: boolean = !isPhotoLess && hasPlaceholderPhotos;
