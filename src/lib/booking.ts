import type { BookingFormValues, Service, SiteConfig } from "../types/content";

/**
 * Формирование заявки и ссылок на мессенджеры.
 *
 * ВАЖНО (ограничение статического сайта):
 *   Автоматически отправить сообщение в личный чат Telegram или в MAX
 *   со статического сайта невозможно — для этого нужен бот с Bot API либо
 *   серверный backend, что запрещено требованиями проекта.
 *
 *   Поэтому сайт только ГОТОВИТ текст заявки и открывает чат. Отправку
 *   выполняет сам пользователь кнопкой в мессенджере. До этого момента
 *   заявка считается неотправленной, и сайт не должен утверждать обратное.
 */

const TELEGRAM_WEB_BASE = "https://t.me";

/** Нормализует username: убирает @, пробелы и ссылки. */
export function normalizeTelegramUsername(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\/(t\.me|telegram\.me)\//i, "")
    .replace(/^@/, "")
    .replace(/[^A-Za-z0-9_]/g, "");
}

/** Нормализует телефон для t.me/+7... */
export function normalizeTelegramPhone(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const digits = trimmed.replace(/[^\d]/g, "");
  return digits ? `+${digits}` : "";
}

/**
 * Текст заявки. Формат строго по требованиям проекта.
 */
export function buildBookingMessage(
  site: SiteConfig,
  serviceTitle: string,
  values: Pick<BookingFormValues, "name" | "phone" | "comment">,
): string {
  const comment = values.comment.trim() || "—";

  return [
    "Новая заявка с сайта",
    "",
    `Имя: ${values.name.trim()}`,
    `Телефон: ${values.phone.trim()}`,
    `Услуга: ${serviceTitle || "не выбрана"}`,
    `Комментарий: ${comment}`,
    `Компания: ${site.companyName}`,
  ].join("\n");
}

export interface TelegramTarget {
  /** Ссылка, которую нужно открыть. Пустая строка = открыть нельзя. */
  url: string;
  /** Способ: по username, по номеру телефона или недоступно. */
  mode: "username" | "phone" | "none";
}

/**
 * Ссылка Telegram с готовым текстом заявки.
 *
 * 1. Если указан username — https://t.me/{username}?text={encoded}
 * 2. Иначе, если указан телефон — https://t.me/{phone}?text={encoded}
 *    (совместимый переход к контакту по номеру)
 * 3. Иначе — открыть невозможно, сайт предложит позвонить и скопировать текст.
 */
export function buildTelegramTarget(site: SiteConfig, message: string): TelegramTarget {
  const encoded = encodeURIComponent(message);

  const username = normalizeTelegramUsername(site.telegramUsername);
  if (username) {
    return { url: `${TELEGRAM_WEB_BASE}/${username}?text=${encoded}`, mode: "username" };
  }

  const phone = normalizeTelegramPhone(site.telegramPhone);
  if (phone) {
    return { url: `${TELEGRAM_WEB_BASE}/${phone}?text=${encoded}`, mode: "phone" };
  }

  return { url: "", mode: "none" };
}

export interface MaxTarget {
  /** Ссылка на профиль в MAX (если задана). */
  profileUrl: string;
  /** Share-ссылка MAX с добавленным закодированным текстом (если задана). */
  shareUrl: string;
  /** Доступен ли канал MAX вообще. */
  enabled: boolean;
}

/**
 * Ссылки MAX.
 *
 * MAX — вторичный канал. Основной сценарий: скопировать текст заявки
 * в буфер обмена, открыть профиль владельца, попросить пользователя
 * вставить текст и отправить вручную.
 *
 * Для share-ссылки текст добавляется как параметр text= — корректно
 * закодированный через encodeURIComponent. Сообщение об успешной
 * отправке в этом случае также не показывается.
 */
export function buildMaxTarget(site: SiteConfig, message: string): MaxTarget {
  const enabled = Boolean(site.maxEnabled);
  const profileUrl = site.maxProfileUrl.trim();
  const shareBase = site.maxShareUrl.trim();

  if (!shareBase) {
    return { profileUrl, shareUrl: "", enabled };
  }

  const encoded = encodeURIComponent(message);
  const separator = shareBase.includes("?") ? "&" : "?";

  return {
    profileUrl,
    shareUrl: `${shareBase}${separator}text=${encoded}`,
    enabled,
  };
}

/** Публичная ссылка MAX, если владелец её не указал. */
export const MAX_FALLBACK_URL = "https://max.ru/";

/**
 * Копирование текста в буфер обмена.
 * Использует Clipboard API, с запасным вариантом через скрытый textarea
 * (нужен для http-окружений и старых браузеров).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Переходим к запасному способу.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-1000px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/** Открыть ссылку в новой вкладке. */
export function openExternal(url: string): void {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

/** Найти услугу по её названию (значение select в форме). */
export function findServiceByTitle(services: Service[], title: string): Service | undefined {
  return services.find((service) => service.title === title);
}
