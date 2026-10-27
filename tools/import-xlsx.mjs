/**
 * =============================================================================
 * Генератор данных компаний из Excel-таблицы (парсер шиномонтажей)
 * =============================================================================
 *
 * Читает .xlsx того формата, что отдаёт парсер (столбцы «№», «Название»,
 * «Адрес (для маршрута)», «Телефон», отзывы в виде «дата • 5★ • Автор»),
 * и раскладывает данные по папкам сайтов.
 *
 * ЗАЧЕМ: одна таблица на сотни компаний -> готовые сайты без ручной работы.
 *
 * -----------------------------------------------------------------------------
 * ЗАПУСК
 * -----------------------------------------------------------------------------
 *
 *   # только эти номера из столбца «№», режим без фотографий
 *   node tools/import-xlsx.mjs "D:/таблица.xlsx" --rows 49,42,12,30,206
 *
 *   # предпросмотр, ничего не записывается
 *   node tools/import-xlsx.mjs "D:/таблица.xlsx" --rows 49,42 --dry-run
 *
 *   # начать с определённой папки (по умолчанию site-01, site-02, ...)
 *   node tools/import-xlsx.mjs "D:/таблица.xlsx" --rows 49,42 --from 3
 *
 *   # указать папки вручную, в порядке номеров
 *   node tools/import-xlsx.mjs "D:/таблица.xlsx" --rows 49,42 --sites site-05,site-07
 *
 *   # ограничить число отзывов на сайт (по умолчанию 5)
 *   node tools/import-xlsx.mjs "D:/таблица.xlsx" --rows 49 --reviews 3
 *
 * -----------------------------------------------------------------------------
 * ОСОБЕННОСТИ
 * -----------------------------------------------------------------------------
 *
 * - Фотографий нет -> displayMode автоматически станет "no-photos".
 * - Отзывы парсятся из текста и сортируются от новых к старым.
 * - Телефоны: берётся первый номер; остальные сохраняются в комментарий отзыва
 *   к заявке не нужны, поэтому просто отбрасываются, но первый — основной.
 * - Координаты «54.005097, 37.513068» разбираются в latitude / longitude.
 * - Ссылка на Яндекс.Карты подставляется как есть (карточка организации),
 *   координаты дают точный маршрут.
 * =============================================================================
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PARENT = path.resolve(ROOT, "..");

/** Стандартный набор услуг, если в таблице их нет. */
const DEFAULT_SERVICES = [
  { id: "tire-service", title: "Шиномонтаж", description: "Монтаж и демонтаж шин, сезонная переобувка комплекта колёс." },
  { id: "wheel-balancing", title: "Балансировка колёс", description: "Балансировка на стенде — убирает вибрацию руля и кузова на скорости." },
  { id: "puncture-repair", title: "Ремонт проколов", description: "Надёжный ремонт прокола с проверкой колеса на герметичность." },
  { id: "side-cut-repair", title: "Ремонт боковых порезов", description: "Восстановление бокового пореза — когда шину ещё можно спасти." },
];

/** Соответствие заголовков таблицы внутренним полям. */
const COLUMN = {
  num: "№",
  name: "Название",
  city: "Город/район",
  address: "Адрес (для маршрута)",
  phone: "Телефон",
  hours: "Режим работы",
  telegram: "Telegram (без @)",
  telegramUrl: "Telegram",
  mapsUrl: "Ссылка на Яндекс.Карты",
  coords: "Координаты",
  rating: "Рейтинг",
  reviewCount: "Всего отзывов",
  reviews: "5 последних хороших отзывов",
};

// -----------------------------------------------------------------------------

function parseArgs(argv) {
  const opts = { file: null, rows: [], dryRun: false, from: 1, sites: null, reviews: 5 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--rows") opts.rows = (argv[++i] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    else if (a === "--from") opts.from = Number(argv[++i] ?? 1);
    else if (a === "--sites") opts.sites = (argv[++i] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    else if (a === "--reviews") opts.reviews = Number(argv[++i] ?? 5);
    else if (!a.startsWith("--")) opts.file = a;
  }
  return opts;
}

/** Разбор координат «54.481419, 38.171931». */
function parseCoords(value) {
  const m = String(value ?? "").match(/(-?\d+[.,]\d+)\s*[,;]\s*(-?\d+[.,]\d+)/);
  if (!m) return { latitude: null, longitude: null };
  return {
    latitude: Number(m[1].replace(",", ".")),
    longitude: Number(m[2].replace(",", ".")),
  };
}

/** Основной телефон: первый из списка, нормализованный. */
function primaryPhone(value) {
  const first = String(value ?? "").split(/[;\n]/)[0]?.trim() ?? "";
  return first;
}

/**
 * Разбор блока отзывов.
 *
 * Формат в ячейке:
 *   ДД.ММ.ГГГГ • 5★ • Автор
 *   Текст отзыва (может быть в несколько строк)
 *   ДД.ММ.ГГГГ • 4★ • Другой автор
 *   Ещё текст
 */
function parseReviews(raw, limit) {
  const text = String(raw ?? "").replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  // Заголовок отзыва начинается с даты.
  const headerRe = /^(\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4})\s*•\s*(\d)\s*★\s*•\s*(.+)$/;
  const lines = text.split("\n");

  const items = [];
  let current = null;

  for (const line of lines) {
    const m = line.trim().match(headerRe);
    if (m) {
      if (current) items.push(current);
      current = { date: normalizeDate(m[1]), rating: Number(m[2]), name: m[3].trim(), textLines: [] };
    } else if (current && line.trim()) {
      current.textLines.push(line.trim());
    }
  }
  if (current) items.push(current);

  return items
    .map((r) => ({
      date: r.date,
      rating: r.rating,
      name: r.name,
      text: r.textLines.join(" ").trim(),
    }))
    .filter((r) => r.text)
    .sort((a, b) => (a.date < b.date ? 1 : -1)) // от новых к старым
    .slice(0, limit);
}

/** ДД.ММ.ГГГГ -> YYYY-MM-DD */
function normalizeDate(value) {
  const s = String(value ?? "").trim();
  let m = s.match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{2})$/);
  if (m) return `20${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return new Date().toISOString().slice(0, 10);
}

/** Человеческое название города: «деревня Кухтинка» -> «Кухтинка». */
function cleanCity(value) {
  return String(value ?? "")
    .replace(/^(город|деревня|село|посёлок|поселок|рабочий посёлок|городское поселение)\s+/i, "")
    .trim();
}

function toNum(value, fallback = null) {
  if (value === undefined || value === null || String(value).trim() === "") return fallback;
  const n = Number(String(value).replace(",", ".").replace(/[^\d.\-]/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

/** Сборка данных компании из строки таблицы. */
function buildCompany(row, index, reviewLimit) {
  const name = String(row[COLUMN.name] ?? "").trim() || `Шиномонтаж № ${index}`;
  const city = cleanCity(row[COLUMN.city]) || "Тула";
  const region = "Тульская область";
  const address = String(row[COLUMN.address] ?? "").trim();
  const coords = parseCoords(row[COLUMN.coords]);
  const rating = toNum(row[COLUMN.rating], 5) ?? 5;
  const reviewCount = toNum(row[COLUMN.reviewCount], 0) ?? 0;
  const telegram = String(row[COLUMN.telegram] ?? "").trim().replace(/^@/, "");

  const reviews = parseReviews(row[COLUMN.reviews], reviewLimit).map((r, i) => ({
    id: `review-${i + 1}`,
    name: r.name,
    rating: r.rating,
    text: r.text,
    date: r.date,
    yandexReviewUrl: "",
    isVisible: true,
    isDemo: false,
    sortOrder: i + 1,
  }));

  const services = DEFAULT_SERVICES.map((s, i) => ({
    ...s,
    price: null,
    priceFrom: false,
    priceUnit: "по запросу",
    isVisible: true,
    sortOrder: i + 1,
  }));

  return {
    site: {
      companyName: name,
      shortDescription: `Шиномонтаж и балансировка колёс в ${city} — работаем по записи`,
      city,
      region,
      address,
      phone: primaryPhone(row[COLUMN.phone]),
      workingHours: String(row[COLUMN.hours] ?? "").trim() || "Уточняйте по телефону",
      logo: "",
      telegramUsername: telegram,
      telegramPhone: "",
      maxProfileUrl: "",
      maxShareUrl: "",
      maxEnabled: false,
      yandexMapsUrl: String(row[COLUMN.mapsUrl] ?? "").trim(),
      latitude: coords.latitude,
      longitude: coords.longitude,
      rating,
      reviewCount,
      heroTitle: `Шиномонтаж в ${city}`,
      heroDescription: "Ремонт проколов и боковых порезов, балансировка колёс, монтаж и демонтаж шин. Уточните услуги и цены по телефону.",
      advantages: [
        String(row[COLUMN.hours] ?? "").trim() || "Уточняйте режим работы по телефону",
        "Ремонт проколов и боковых порезов",
        "Балансировка колёс на стенде",
        `Работаем в ${city}`,
      ].filter(Boolean),
      displayMode: "no-photos",
      facts: [
        {
          value: coords.latitude !== null ? city : "Рядом",
          label: "Работаем в этом районе",
          icon: "map-pin",
          sortOrder: 1,
          isVisible: true,
        },
        {
          value: rating > 0 ? String(rating).replace(".", ",") : "—",
          label: reviewCount > 0 ? `Средняя оценка, ${reviewCount} отзывов` : "Оценка клиентов",
          icon: "star",
          sortOrder: 2,
          isVisible: true,
        },
        { value: "R13–R22", label: "Работаем с любым диаметром", icon: "tool", sortOrder: 3, isVisible: true },
        { value: "По записи", label: "Уточните время по телефону", icon: "clock", sortOrder: 4, isVisible: true },
      ],
      seoTitle: `Шиномонтаж в ${city} — ${name}`,
      seoDescription: `Шиномонтаж в ${city}, ${region}. Ремонт проколов и боковых порезов, балансировка колёс, монтаж и демонтаж шин. ${address}.`,
      ogImage: "",
      favicon: "/favicon.svg",
    },
    services,
    reviews,
  };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (!opts.file) {
    console.error("Укажите файл Excel.");
    console.error('  node tools/import-xlsx.mjs "D:/таблица.xlsx" --rows 49,42,12,30,206');
    process.exit(1);
  }
  if (opts.rows.length === 0) {
    console.error("Укажите номера строк из столбца «№»: --rows 49,42,12,30,206");
    process.exit(1);
  }

  const wb = XLSX.readFile(opts.file);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  const headers = rows[0];
  const dataRows = rows.slice(1).filter((r) => r.some((c) => String(c).trim() !== ""));

  console.log(`Файл: ${path.basename(opts.file)}`);
  console.log(`Лист: ${wb.SheetNames[0]}, строк с данными: ${dataRows.length}`);
  console.log(`Выбрано номеров: ${opts.rows.join(", ")}`);
  console.log(`Отзывов на сайт: ${opts.reviews}`);
  console.log("");

  let applied = 0;

  for (let i = 0; i < opts.rows.length; i++) {
    const num = opts.rows[i];
    const row = dataRows.find((r) => String(r[0]).trim() === String(num).trim());

    if (!row) {
      console.log(`  № ${num} — НЕ НАЙДЕН в таблице, пропускаю`);
      continue;
    }

    const obj = {};
    headers.forEach((h, idx) => { obj[h] = row[idx]; });

    const targetSite = opts.sites?.[i] ?? `site-${String(opts.from + i).padStart(2, "0")}`;
    const siteDir = path.join(PARENT, targetSite);

    try {
      await fs.access(siteDir);
    } catch {
      console.log(`  № ${num} -> ${targetSite} — папка не найдена, пропускаю`);
      continue;
    }

    const company = buildCompany(obj, num, opts.reviews);

    if (opts.dryRun) {
      console.log(`  № ${num} -> ${targetSite}: ${company.site.companyName}`);
      console.log(`     город: ${company.site.city}`);
      console.log(`     адрес: ${company.site.address || "—"}`);
      console.log(`     телефон: ${company.site.phone || "—"}`);
      console.log(`     координаты: ${company.site.latitude ?? "—"}, ${company.site.longitude ?? "—"}`);
      console.log(`     рейтинг: ${company.site.rating} (отзывов ${company.site.reviewCount})`);
      console.log(`     telegram: ${company.site.telegramUsername || "—"}`);
      console.log(`     отзывов на сайте: ${company.reviews.length}`);
      console.log(`     режим: ${company.site.displayMode}`);
      console.log("");
      continue;
    }

    await fs.writeFile(
      path.join(siteDir, "content", "site.json"),
      JSON.stringify(company.site, null, 2) + "\n", "utf8",
    );
    await fs.writeFile(
      path.join(siteDir, "content", "services.json"),
      JSON.stringify({
        priceNote: "Стоимость зависит от диаметра колеса и состояния шины. Точную цену уточняйте по телефону — мастер назовёт её до начала работ.",
        services: company.services,
      }, null, 2) + "\n", "utf8",
    );
    await fs.writeFile(
      path.join(siteDir, "content", "gallery.json"),
      JSON.stringify({
        galleryNote: "Фотографии компании пока не добавлены. Их можно загрузить через панель управления.",
        photos: [],
      }, null, 2) + "\n", "utf8",
    );
    await fs.writeFile(
      path.join(siteDir, "content", "reviews.json"),
      JSON.stringify({
        reviewsNote: "Отзывы клиентов с Яндекс Карт.",
        reviews: company.reviews,
      }, null, 2) + "\n", "utf8",
    );

    applied++;
    console.log(`  № ${num} -> ${targetSite}: ${company.site.companyName} (отзывов ${company.reviews.length})`);
  }

  console.log("");
  if (opts.dryRun) {
    console.log("Это был предпросмотр. Уберите --dry-run, чтобы записать данные.");
  } else {
    console.log(`Готово. Обновлено сайтов: ${applied}`);
  }
}

main().catch((error) => {
  console.error("Ошибка:", error.message);
  process.exit(1);
});
