import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Базовый путь.
 *
 * На GitHub Pages проект обычно живёт по адресу
 * https://<user>.github.io/<repo>/ — тогда нужен base "/<repo>/".
 * Если подключён собственный домен (файл public/CNAME), сайт живёт
 * в корне домена и base должен быть "/".
 *
 * Значение берётся из переменной окружения VITE_BASE_PATH, которую
 * подставляет GitHub Actions (см. .github/workflows/deploy.yml).
 * Локально base = "/".
 */
declare const process: { env: Record<string, string | undefined> };

const base = process.env.VITE_BASE_PATH || "/";

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    target: "es2020",
  },
  server: {
    port: 5173,
    open: false,
  },
  preview: {
    port: 4173,
  },
});
