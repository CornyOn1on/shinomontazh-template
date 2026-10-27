/**
 * =============================================================================
 * Генератор данных компаний из таблицы
 * =============================================================================
 *
 * Читает CSV (или TSV, как копирует Excel) со строками компаний и раскладывает
 * данные по папкам сайтов: content/site.json, services.json, gallery.json,
 * reviews.json.
 *
 * ЗАЧЕМ: чтобы не заполнять 15 сайтов руками. Одна таблица -> 15 готовых сайтов.
 *
 * -----------------------------------------------------------------------------
 * КАК ПОЛЬЗОВАТЬСЯ
 * -----------------------------------------------------------------------------
 *
 * 1. Заполните таблицу (Excel / Google Sheets) — одна строка = одна компания.
 * 2. Сохраните как CSV (разделитель — запятая) или TSV (Excel копирует в буфер
 *    именно в TSV). Образец — data/companies.example.csv.
 * 3. Запустите:
 *
 *      node tools/apply-companies.mjs data/companies.csv
 *      node tools/apply-companies.mjs data/companies.tsv --dry-run
 *      node tools/apply-companies.mjs data/companies.csv --site site-01,site-02
 *
 * 4. Скрипт покажет, что изменит, и запишет данные.
 *
 * -----------------------------------------------------------------------------
 * ФОРМАТ ТАБЛИЦЫ
 * -----------------------------------------------------------------------------
 *
 * Первая строка — заголовки. Поддерживаются русские и английские названия:
 *
 *   site             | папка        | Папка сайта (site-01). Если пусто — по порядку
 *   companyName      | название     | Название компании
 *   city             | город        | Город
 *   region           | регион       | Регион (Тульская область)
 *   address          | адрес        | Адрес
 *   phone            | телефон      | Телефон
 *   workingHours     | режим        | Режим работы
 *   telegramUsername | телеграм     | Telegram без @
 *   yandexMapsUrl    | карты        | Ссылка на Яндекс Карты
 *   latitude         | широта       | Координата
 *   longitude        | долгота      | Координата
 *   rating           | рейтинг      | Рейтинг (4.3)
 *   reviewCount      | отзывов      | Кол-во отзывов
 *   heroTitle        | заголовок    | Заголовок первого экрана
 *   heroDescription  | описание     | Описание
 *   advantages       | преимущества | Пункты через «;»
 *   services         | услуги       | Услуги через «;» в формате «Название=Цена»
 *   priceUnit        | единица      | Единица измерения цен (за колесо)
 *   reviews          | отзывы       | Отзывы через «;» в формате «Имя|Дата|Текст»
 *   photos           | фото         | Имена файлов через «;» (лежат в public/images/company)
 *   maxEnabled       | max          | true/false
 *   maxProfileUrl    | max-ссылка   | Ссылка на профиль MAX
 *   seoTitle         | seo-заголовок  | SEO заголовок
 *   seoDescription   | seo-описание   | SEO описание
 *
 * Услуги: если не указаны, подставится стандартный набор с ценой по умолчанию.
 * =============================================================================
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PARENT = path.resolve(ROOT, "..");

/** Стандартный набор услуг, если в таблице колонка «услуги» пустая. */
const DEFAULT_SERVICES = [
  { id: "tire-service", title: "Шиномонтаж", description: "Монтаж и демонтаж шин, сезонная переобувка комплекта колёс." },
  { id: "wheel-balancing", title: "Балансировка колёс", description: "Балансировка на стенде — убирает вибрацию руля и кузова на скорости." },
  { id: "puncture-repair", title: "Ремонт проколов", description: "Надёжный ремонт прокола с проверкой колеса на герметичность." },
  { id: "side-cut-repair", title: "Ремонт боковых порезов", description: "Восстановление бокового пореза — когда шину ещё можно спасти." },
];

/** Сопоставление заголовков таблицы с внутренними полями. */
const FIELD_ALIASES = {
  site: "site", папка: "site",
  companyName: "companyName", название: "companyName", компания: "companyName",
  city: "city", город: "city",
  region: "region", регион: "region", область: "region",
  address: "address", адрес: "address",
  phone: "phone", телефон: "phone",
  workingHours: "workingHours", режим: "workingHours", "режим работы": "workingHours",
  telegramUsername: "telegramUsername", телеграм: "telegramUsername",
  yandexMapsUrl: "yandexMapsUrl", карты: "yandexMapsUrl", "яндекс карты": "yandexMapsUrl",
  latitude: "latitude", широта: "latitude",
  longitude: "longitude", долгота: "longitude",
  rating: "rating", рейтинг: "rating",
  reviewCount: "reviewCount", отзывов: "reviewCount", "кол-во отзывов": "reviewCount",
  heroTitle: "heroTitle", заголовок: "heroTitle",
  heroDescription: "heroDescription", описание: "heroDescription",
  shortDescription: "shortDescription", "короткое описание": "shortDescription",
  advantages: "advantages", преимущества: "advantages",
  services: "services", услуги: "services",
  priceUnit: "priceUnit", единица: "priceUnit",
  reviews: "reviews", отзывы: "reviews",
  photos: "photos", фото: "photos",
  maxEnabled: "maxEnabled", max: "maxEnabled",
  maxProfileUrl: "maxProfileUrl", "max-ссылка": "maxProfileUrl",
  seoTitle: "seoTitle", "seo-заголовок": "seoTitle",
  seoDescription: "seoDescription", "seo-описание": "seoDescription",
};

// -----------------------------------------------------------------------------

function parseArgs(argv) {
  const opts = { file: null, dryRun: false, sites: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--site") opts.sites = (argv[++i] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    else if (!a.startsWith("--")) opts.file = a;
  }
  return opts;
}

/** Разбор CSV с учётом кавычек. */
function parseCsv(text, delimiter) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') { field += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field); field = "";
    } else if (ch === "\n") {
      row.push(field); rows.push(row); row = []; field = "";
    } else if (ch === "\r") {
      // пропускаем
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ""));
}

/** Определить разделитель: TSV из Excel или CSV. */
function detectDelimiter(text, ext) {
  if (ext === ".tsv") return "\t";
  const firstLine = text.split(/\r?\n/)[0] ?? "";
  const tabs = (firstLine.match(/\t/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  return tabs > commas ? "\t" : ",";
}

function normalizeHeader(h) {
  return String(h).trim().toLowerCase().replace(/\s+/g, " ");
}

/** Разбор строки «Название=Цена» в услугу. */
function parseService(raw, unit, sortOrder) {
  const [titlePart, pricePart] = String(raw).split("=").map((s) => s.trim());
  const title = titlePart || "Услуга";
  const numeric = pricePart ? Number(pricePart.replace(/[^\d.]/g, "")) : NaN;
  const hasPrice = Number.isFinite(numeric) && numeric > 0;

  return {
    id: title.toLowerCase()
      .replace(/[^a-zа-я0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || `service-${sortOrder}`,
    title,
    description: "",
    price: hasPrice ? numeric : null,
    priceFrom: hasPrice,
    priceUnit: hasPrice ? (unit || "за услугу") : "по запросу",
    isVisible: true,
    sortOrder,
  };
}

/** Разбор «Имя|Дата|Текст» в отзыв. */
function parseReview(raw, sortOrder) {
  const parts = String(raw).split("|").map((s) => s.trim());
  const [name, date, text] = parts;
  return {
    id: `review-${sortOrder}`,
    name: name || "Клиент",
    rating: 5,
    text: text || "",
    date: normalizeDate(date),
    yandexReviewUrl: "",
    isVisible: true,
    isDemo: false,
    sortOrder,
  };
}

/** Дата -> YYYY-MM-DD. Понимает «13.09.2025», «2025-09-13», «13 сентября». */
function normalizeDate(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const s = String(value).trim();

  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return s;

  m = s.match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;

  m = s.match(/^(\d{1,2})[.\/](\d{1,2})$/);
  if (m) return `${new Date().getFullYear()}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;

  const months = {
    января: "01", февраля: "02", марта: "03", апреля: "04", мая: "05", июня: "06",
    июля: "07", августа: "08", сентября: "09", октября: "10", ноября: "11", декабря: "12",
  };
  m = s.match(/^(\d{1,2})\s+([а-яё]+)(?:\s+(\d{4}))?$/i);
  if (m && months[m[2].toLowerCase()]) {
    const year = m[3] ?? String(new Date().getFullYear());
    return `${year}-${months[m[2].toLowerCase()]}-${m[1].padStart(2, "0")}`;
  }

  return new Date().toISOString().slice(0, 10);
}

function toBool(value) {
  const s = String(value ?? "").trim().toLowerCase();
  return ["true", "да", "1", "yes", "y", "вкл"].includes(s);
}

function toNum(value, fallback = null) {
  if (value === undefined || value === null || String(value).trim() === "") return fallback;
  const n = Number(String(value).replace(",", ".").replace(/[^\d.\-]/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

/** Сборка объекта company из строки таблицы. */
function buildCompany(row, index, serviceUnit) {
  const name = row.companyName?.trim() || `Шиномонтаж № ${index}`;
  const city = row.city?.trim() || "Щёкино";
  const region = row.region?.trim() || "Тульская область";

  const advantages = (row.advantages ?? "")
    .split(";").map((s) => s.trim()).filter(Boolean);

  const servicesRaw = (row.services ?? "")
    .split(";").map((s) => s.trim()).filter(Boolean);

  const services = servicesRaw.length > 0
    ? servicesRaw.map((s, i) => parseService(s, serviceUnit, i + 1))
    : DEFAULT_SERVICES.map((s, i) => ({
        ...s,
        price: 500, priceFrom: true,
        priceUnit: serviceUnit || "за услугу",
        isVisible: true, sortOrder: i + 1,
      }));

  const reviewsRaw = (row.reviews ?? "")
    .split(";").map((s) => s.trim()).filter(Boolean);
  const reviews = reviewsRaw
    .map((r, i) => parseReview(r, i + 1))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((r, i) => ({ ...r, sortOrder: i + 1 }));

  const photosRaw = (row.photos ?? "")
    .split(";").map((s) => s.trim()).filter(Boolean);
  const photos = photosRaw.map((src, i) => ({
    id: `photo-${i + 1}`,
    src: src.startsWith("/") ? src : `/images/company/${src}`,
    alt: `${name} — фотография ${i + 1}`,
    caption: "",
    isVisible: true,
    sortOrder: i + 1,
    isPlaceholder: false,
  }));

  return {
    site: {
      companyName: name,
      shortDescription: row.shortDescription?.trim() ||
        `Шиномонтаж и балансировка колёс в ${city} — работаем каждый день`,
      city,
      region,
      address: row.address?.trim() || "",
      phone: row.phone?.trim() || "",
      workingHours: row.workingHours?.trim() || "Каждый день с 9:00 до 19:00",
      logo: "",
      telegramUsername: (row.telegramUsername ?? "").replace(/^@/, "").trim(),
      telegramPhone: "",
      maxProfileUrl: row.maxProfileUrl?.trim() || "",
      maxShareUrl: "",
      maxEnabled: toBool(row.maxEnabled),
      yandexMapsUrl: row.yandexMapsUrl?.trim() || "",
      latitude: toNum(row.latitude),
      longitude: toNum(row.longitude),
      rating: toNum(row.rating, 5),
      reviewCount: toNum(row.reviewCount, reviews.length) ?? 0,
      heroTitle: row.heroTitle?.trim() || `Шиномонтаж в ${city}`,
      heroDescription: row.heroDescription?.trim() ||
        "Ремонт проколов и боковых порезов, балансировка, монтаж и демонтаж шин.",
      advantages,
      displayMode: photos.length > 0 ? "photos" : "no-photos",
      facts: [
        { value: "9:00–19:00", label: "Работаем каждый день", icon: "clock", sortOrder: 1, isVisible: true },
        { value: "500 ₽", label: "Шиномонтаж и балансировка", icon: "wheel", sortOrder: 2, isVisible: true },
        { value: "R13–R22", label: "Работаем с любым диаметром", icon: "tool", sortOrder: 3, isVisible: true },
        { value: "Рядом", label: "Удобный подъезд и парковка", icon: "map-pin", sortOrder: 4, isVisible: true },
      ],
      seoTitle: row.seoTitle?.trim() || `Шиномонтаж в ${city} — замена шин, балансировка колёс`,
      seoDescription: row.seoDescription?.trim() ||
        `Шиномонтаж в ${city}: ремонт проколов и боковых порезов, балансировка колёс, монтаж и демонтаж шин. ${region}.`,
      ogImage: photos[0]?.src ?? "",
      favicon: "/favicon.svg",
    },
    services,
    reviews,
    photos,
  };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (!opts.file) {
    console.error("Укажите файл с таблицей.");
    console.error("  node tools/apply-companies.mjs data/companies.csv");
    console.error("  node tools/apply-companies.mjs data/companies.tsv --dry-run");
    process.exit(1);
  }

  const filePath = path.isAbsolute(opts.file) ? opts.file : path.join(ROOT, opts.file);
  const text = await fs.readFile(filePath, "utf8");
  const ext = path.extname(filePath).toLowerCase();
  const delimiter = detectDelimiter(text, ext);
  const rows = parseCsv(text, delimiter);

  if (rows.length < 2) {
    console.error("В таблице нет строк с данными (нужна строка заголовков и хотя бы одна строка компании).");
    process.exit(1);
  }

  const headers = rows[0].map((h) => FIELD_ALIASES[normalizeHeader(h)] ?? normalizeHeader(h));
  console.log(`Файл: ${path.basename(filePath)}`);
  console.log(`Разделитель: ${delimiter === "\t" ? "TAB" : ","}`);
  console.log(`Колонки: ${headers.join(", ")}`);
  console.log(`Строк с компаниями: ${rows.length - 1}\n`);

  let applied = 0;
  const summary = [];

  for (let i = 1; i < rows.length; i++) {
    const raw = {};
    headers.forEach((h, idx) => { raw[h] = rows[i][idx]; });

    const targetSite = opts.sites?.[i - 1] ?? raw.site?.trim() ?? `site-${String(i).padStart(2, "0")}`;
    const siteDir = path.join(PARENT, targetSite);

    try {
      await fs.access(siteDir);
    } catch {
      console.log(`  ${targetSite} — папка не найдена, пропускаю`);
      continue;
    }

    const unit = raw.priceUnit?.trim() || "за услугу";
    const company = buildCompany(raw, i, unit);

    if (opts.dryRun) {
      console.log(`  ${targetSite}: ${company.site.companyName}`);
      console.log(`     адрес: ${company.site.address || "—"}`);
      console.log(`     телефон: ${company.site.phone || "—"}`);
      console.log(`     услуг: ${company.services.length}, отзывов: ${company.reviews.length}, фото: ${company.photos.length}`);
      console.log(`     режим: ${company.site.displayMode}`);
      continue;
    }

    await fs.writeFile(
      path.join(siteDir, "content", "site.json"),
      JSON.stringify(company.site, null, 2) + "\n",
      "utf8",
    );

    await fs.writeFile(
      path.join(siteDir, "content", "services.json"),
      JSON.stringify({
        priceNote: "Стоимость зависит от диаметра колеса и состояния шины. Точную цену мастер назовёт после осмотра — до начала работ.",
        services: company.services,
      }, null, 2) + "\n",
      "utf8",
    );

    await fs.writeFile(
      path.join(siteDir, "content", "gallery.json"),
      JSON.stringify({
        galleryNote: company.photos.length > 0
          ? `Все изображения — реальные фотографии ${company.site.companyName}.`
          : "Фотографии появятся после добавления в панели управления.",
        photos: company.photos,
      }, null, 2) + "\n",
      "utf8",
    );

    await fs.writeFile(
      path.join(siteDir, "content", "reviews.json"),
      JSON.stringify({
        reviewsNote: "Отзывы клиентов с Яндекс Карт.",
        reviews: company.reviews,
      }, null, 2) + "\n",
      "utf8",
    );

    applied++;
    summary.push({
      site: targetSite,
      name: company.site.companyName,
      services: company.services.length,
      reviews: company.reviews.length,
      photos: company.photos.length,
    });
    console.log(`  ${targetSite} — данные записаны (${company.site.companyName})`);
  }

  console.log("");
  if (opts.dryRun) {
    console.log("Это был предпросмотр. Уберите --dry-run, чтобы записать данные.");
  } else {
    console.log(`Готово. Обновлено сайтов: ${applied}`);
  }

  if (summary.length > 1) {
    console.log("\nИтого:");
    for (const s of summary) {
      console.log(`  ${s.site}: ${s.name} — услуг ${s.services}, отзывов ${s.reviews}, фото ${s.photos}`);
    }
  }
}

main().catch((error) => {
  console.error("Ошибка:", error.message);
  process.exit(1);
});
