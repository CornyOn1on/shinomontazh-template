/**
 * Клонирование шаблона сайта шиномонтажа в N отдельных папок.
 *
 * Зачем: каждый шиномонтаж — это отдельный GitHub-репозиторий, отдельный
 * домен и отдельный набор данных. Скрипт делает из шаблона готовые заготовки,
 * чтобы не копировать папки вручную.
 *
 * Запуск:
 *   node tools/clone-template.mjs 15
 *   node tools/clone-template.mjs 15 --prefix tire-
 *   node tools/clone-template.mjs 5 --from 11        # продолжить с 11-й
 *
 * Что копируется: весь проект, кроме node_modules, dist, .git и служебных файлов.
 * Что НЕ копируется: данные конкретной компании остаются в content/ как есть —
 *   их заменит скрипт деплоя данных (tools/apply-company.mjs).
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PARENT = path.resolve(ROOT, "..");
const TEMPLATE_NAME = path.basename(ROOT);

/** Папки и файлы, которые не нужно копировать в клоны. */
const EXCLUDE_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  ".vite",
  ".cache",
  "tire-service-shchekino",
]);

/** Файлы, которые не нужно копировать (кэш сборки, служебное). */
const EXCLUDE_FILES = new Set([
  "tsconfig.app.tsbuildinfo",
  "tsconfig.node.tsbuildinfo",
  "SITE-TODO.md",
]);

/** Расширения, которые не копируем. */
const EXCLUDE_EXT = new Set([".tsbuildinfo", ".log"]);

const args = process.argv.slice(2);
const count = Number(args.find((a) => /^\d+$/.test(a)) ?? 15);
const prefixArg = args.indexOf("--prefix");
const prefix = prefixArg !== -1 ? args[prefixArg + 1] : "site-";
const fromArg = args.indexOf("--from");
const from = fromArg !== -1 ? Number(args[fromArg + 1]) : 1;

if (!Number.isFinite(count) || count <= 0) {
  console.error("Укажите количество копий: node tools/clone-template.mjs 15");
  process.exit(1);
}

/** Рекурсивное копирование с исключениями. */
async function copyDir(src, dest) {
  const entries = await fs.readdir(src, { withFileTypes: true });
  await fs.mkdir(dest, { recursive: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (EXCLUDE_DIRS.has(entry.name)) continue;
    if (EXCLUDE_FILES.has(entry.name)) continue;
    if (EXCLUDE_EXT.has(path.extname(entry.name))) continue;

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

/** Создать README-заготовку с инструкцией по конкретной копии. */
async function writePlaceholderReadme(destDir, index) {
  const content = `# Сайт шиномонтажа № ${index}

Это отдельная копия шаблона. Здесь будет сайт одной конкретной компании.

## Что нужно сделать

1. Заполнить данные компании в \`content/site.json\`
   (название, адрес, телефон, Telegram, ссылка на Яндекс Карты, координаты).
2. Заполнить услуги и цены в \`content/services.json\`.
3. Положить фотографии в \`public/images/company/\`
   и прописать их в \`content/gallery.json\`.
4. Заполнить отзывы в \`content/reviews.json\`.
5. Создать отдельный GitHub-репозиторий для этой компании.
6. Подключить домен (см. \`public/CNAME.example\`).
7. Установить Pages CMS GitHub App и пригласить владельца по email.

Подробные инструкции — в \`README.md\` в корне этой папки.

## Проверка перед публикацией

\`\`\`bash
npm install
npm run typecheck
npm run build
npm run dev
\`\`\`
`;

  await fs.writeFile(path.join(destDir, "SITE-TODO.md"), content, "utf8");
}

async function main() {
  console.log(`Шаблон: ${ROOT}`);
  console.log(`Папка назначения: ${PARENT}`);
  console.log(`Создаю копии: ${from}–${from + count - 1}, префикс «${prefix}»\n`);

  const created = [];

  for (let i = from; i < from + count; i++) {
    const name = `${prefix}${String(i).padStart(2, "0")}`;
    const dest = path.join(PARENT, name);

    try {
      await fs.access(dest);
      console.log(`  ${name} — уже есть, пропускаю`);
      continue;
    } catch {
      // Папки нет — создаём.
    }

    await copyDir(ROOT, dest);
    await writePlaceholderReadme(dest, i);
    created.push(name);
    console.log(`  ${name} — создана`);
  }

  console.log(`\nГотово. Создано папок: ${created.length}`);
  if (created.length > 0) {
    console.log("\nДальше для каждой папки:");
    console.log("  cd " + created[0]);
    console.log("  npm install");
    console.log("  npm run dev");
  }
}

main().catch((error) => {
  console.error("Ошибка:", error.message);
  process.exit(1);
});
