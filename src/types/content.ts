/**
 * Типы данных сайта.
 *
 * Единственный источник контента — JSON-файлы в папке /content.
 * Эти файлы редактируются владельцем через Pages CMS (см. .pages.yml).
 * Компоненты React НЕ должны содержать захардкоженных данных компании.
 */

/** Общие настройки компании. Соответствует content/site.json. */
export interface SiteConfig {
  companyName: string;
  shortDescription: string;
  city: string;
  region: string;
  address: string;
  phone: string;
  workingHours: string;
  /** Путь к логотипу, например /images/company/logo.png. Пустая строка = логотипа нет. */
  logo: string;
  /** Ник Telegram без @, например "my_tire_service". Пустая строка = не указан. */
  telegramUsername: string;
  /** Телефон для Telegram, международный формат, например "+79990000000". */
  telegramPhone: string;
  /** Прямая ссылка на профиль владельца в MAX. */
  maxProfileUrl: string;
  /** Share-ссылка MAX, к которой можно добавить текст заявки. */
  maxShareUrl: string;
  /** Включён ли канал MAX в интерфейсе. */
  maxEnabled: boolean;
  /** Готовая ссылка на организацию в Яндекс Картах. */
  yandexMapsUrl: string;
  latitude: number | null;
  longitude: number | null;
  rating: number;
  reviewCount: number;
  heroTitle: string;
  heroDescription: string;
  advantages: string[];
  /**
   * Режим отображения первого экрана и блока «как у нас выглядит».
   *
   *   "photos"     — обычная вариация: большое фото на первом экране + галерея.
   *   "no-photos"  — вариация без фотографий: на первом экране графический
   *                  блок, вместо галереи — блоки с цифрами и иконками.
   *
   * Нужен для компаний, у которых нет фотографий. Поле необязательное:
   * если его нет, считается "photos".
   */
  displayMode?: "photos" | "no-photos";

  /**
   * Цифры и факты для вариации без фотографий.
   * Показываются на первом экране и в блоке вместо галереи.
   */
  facts?: Fact[];
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
  favicon: string;
}

/** Показатель компании: цифра и короткое пояснение. */
export interface Fact {
  /** Крупное значение, например «12 лет» или «8 мин». */
  value: string;
  /** Пояснение под цифрой. */
  label: string;
  /** Название иконки из набора src/components/Icons.tsx. */
  icon?: string;
  sortOrder?: number;
  isVisible?: boolean;
}

/** Услуга. Соответствует элементу массива в content/services.json. */
export interface Service {
  id: string;
  title: string;
  description: string;
  /** Цена в рублях. null = цена не указана (см. priceUnit, например "по запросу"). */
  price: number | null;
  /** true = показывать цену как "от N ₽". */
  priceFrom: boolean;
  /** Единица измерения: "за колесо", "за комплект", "по запросу". */
  priceUnit: string;
  isVisible: boolean;
  sortOrder: number;
}

/** Файл услуг целиком. */
export interface ServicesFile {
  priceNote: string;
  services: Service[];
}

/** Отзыв. Соответствует элементу массива в content/reviews.json. */
export interface Review {
  id: string;
  name: string;
  /** Оценка от 1 до 5. */
  rating: number;
  text: string;
  /** Дата в формате YYYY-MM-DD. */
  date: string;
  /** Ссылка на конкретный отзыв в Яндекс Картах. Пустая строка = нет ссылки. */
  yandexReviewUrl: string;
  isVisible: boolean;
  /** true = отзыв добавлен в шаблон как демонстрационный. */
  isDemo: boolean;
  sortOrder: number;
}

/** Файл отзывов целиком. */
export interface ReviewsFile {
  reviewsNote: string;
  reviews: Review[];
}

/** Фотография галереи. Соответствует элементу массива в content/gallery.json. */
export interface Photo {
  id: string;
  /** Путь к файлу от корня сайта, например /images/company/photo-1.jpg. */
  src: string;
  alt: string;
  caption: string;
  isVisible: boolean;
  sortOrder: number;
  /** true = это нейтральная заглушка, а не фото конкретной компании. */
  isPlaceholder: boolean;
}

/** Файл галереи целиком. */
export interface GalleryFile {
  galleryNote: string;
  photos: Photo[];
}

/** Данные для формирования текста заявки. */
export interface BookingFormValues {
  name: string;
  phone: string;
  service: string;
  comment: string;
  /** Honeypot. Должно остаться пустым. */
  website: string;
  consent: boolean;
}
