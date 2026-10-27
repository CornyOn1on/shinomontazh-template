import type { BookingFormValues } from "../types/content";

/**
 * Валидация формы записи.
 *
 * Форма ничего никуда не отправляет: она только проверяет поля и готовит
 * текст заявки для Telegram или MAX.
 */

export type FieldName = "name" | "phone" | "service" | "comment" | "consent";

export type ValidationErrors = Partial<Record<FieldName, string>>;

export const COMMENT_MAX_LENGTH = 500;
export const NAME_MAX_LENGTH = 60;

/**
 * Поддерживаемые форматы телефона:
 *   +7 900 000-00-00, 8 (900) 000-00-00, 79000000000, +7 000 000 00 00
 * Достаточно 10–15 цифр. Скобки, пробелы, дефисы и точки допускаются.
 */
const PHONE_ALLOWED = /^[\d\s()+.-]+$/;

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidRussianPhone(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || !PHONE_ALLOWED.test(trimmed)) return false;

  const digits = digitsOnly(trimmed);
  // 10 цифр — городской/мобильный без кода страны,
  // 11 цифр — с 7 или 8, 12–15 — международный формат.
  return digits.length >= 10 && digits.length <= 15;
}

/** Аккуратное форматирование телефона по мере ввода: +7 900 000-00-00. */
export function formatPhoneInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  // Не мешаем пользователю, пока он вводит нестандартный формат.
  if (!PHONE_ALLOWED.test(trimmed)) return value;

  const hasPlus = trimmed.startsWith("+");
  const digits = digitsOnly(trimmed).slice(0, 11);
  if (digits.length === 0) return hasPlus ? "+" : "";

  // Российский формат: 7XXXXXXXXXX или 8XXXXXXXXXX.
  const isRussian = digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"));
  if (!isRussian && digits.length < 11) {
    // Пока неясно — оставляем как ввёл пользователь.
    return value;
  }
  if (!isRussian) return value;

  const local = digits.slice(1);
  const parts = [
    `+7 ${local.slice(0, 3)}`,
    local.slice(3, 6),
    local.slice(6, 8),
    local.slice(8, 10),
  ].filter(Boolean);

  let result = parts[0]!;
  if (parts[1]) result += ` ${parts[1]}`;
  if (parts[2]) result += `-${parts[2]}`;
  if (parts[3]) result += `-${parts[3]}`;

  return result;
}

export function validateForm(values: BookingFormValues): ValidationErrors {
  const errors: ValidationErrors = {};

  const name = values.name.trim();
  if (!name) {
    errors.name = "Укажите имя — так мастер будет знать, к кому обращаться.";
  } else if (name.length < 2) {
    errors.name = "Имя слишком короткое.";
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.name = `Имя не должно быть длиннее ${NAME_MAX_LENGTH} символов.`;
  }

  if (!values.phone.trim()) {
    errors.phone = "Укажите телефон для связи.";
  } else if (!isValidRussianPhone(values.phone)) {
    errors.phone = "Проверьте номер телефона. Пример: +7 900 000-00-00";
  }

  if (!values.service.trim()) {
    errors.service = "Выберите услугу из списка.";
  }

  if (values.comment.length > COMMENT_MAX_LENGTH) {
    errors.comment = `Комментарий не должен быть длиннее ${COMMENT_MAX_LENGTH} символов.`;
  }

  if (!values.consent) {
    errors.consent = "Без согласия на обработку персональных данных мы не можем принять заявку.";
  }

  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
