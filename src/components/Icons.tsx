/**
 * Иконки интерфейса.
 *
 * Локальные SVG-компоненты вместо внешних библиотек: сайт остаётся
 * полностью статическим и не тянет сторонние запросы.
 */

interface IconProps {
  size?: number;
  className?: string;
}

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function PhoneIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.6a2 2 0 0 1-.5 2.1L8.1 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.8.3 1.7.6 2.6.7a2 2 0 0 1 1.9 2.1Z" />
    </svg>
  );
}

export function MapPinIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function ClockIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function CheckIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      <path d="m4 12.5 5 5L20 6.5" />
    </svg>
  );
}

export function StarIcon({ size = 18, className, filled = true }: IconProps & { filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 2}
      strokeLinejoin="round"
    >
      <path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.4l6.5-.9Z" />
    </svg>
  );
}

export function RouteIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      <circle cx="6" cy="19" r="3" />
      <circle cx="18" cy="5" r="3" />
      <path d="M9 19h6a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6" />
    </svg>
  );
}

export function TelegramIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M21.9 4.3 18.7 19c-.2 1-.9 1.3-1.7.8l-4.6-3.4-2.2 2.1c-.2.3-.5.5-1 .5l.3-4.7 8.6-7.8c.4-.3-.1-.5-.6-.2L6.9 12.7 2.4 11.3c-1-.3-1-1 .2-1.4l18-6.9c.8-.3 1.5.2 1.3 1.3Z" />
    </svg>
  );
}

export function ChatIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.4 9.4 0 0 1-3.4-.6L3 21l1.7-4.8A8.4 8.4 0 0 1 3.6 11.5a8.4 8.4 0 0 1 8.4-8.4h.5a8.4 8.4 0 0 1 8.5 8.4Z" />
    </svg>
  );
}

export function CopyIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function CloseIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function ArrowLeftIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function InfoIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 7.6v.1" />
    </svg>
  );
}

export function WarnIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      <path d="M10.3 3.9 2.1 18a2 2 0 0 0 1.7 3h16.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17v.1" />
    </svg>
  );
}

export function ShieldIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      <path d="M12 2.5 20 6v6c0 5-3.4 8.6-8 9.5-4.6-.9-8-4.5-8-9.5V6Z" />
      <path d="m8.6 12 2.3 2.3 4.5-4.6" />
    </svg>
  );
}

export function ToolIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      <path d="M14.5 6.5a3.8 3.8 0 0 0 5.1 5.1l-8.9 8.9a2.3 2.3 0 0 1-3.3-3.3l8.9-8.9a3.8 3.8 0 0 0-1.8-1.8Z" />
      <path d="m5.5 5.5 2 3.5" />
    </svg>
  );
}

export function ClockFastIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      <path d="M12 3a9 9 0 1 1-8.5 6" />
      <path d="M12 7.5V12l3 1.8" />
      <path d="M3 4v4h4" />
    </svg>
  );
}

export function WheelIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3v5.8M12 15.2V21M3 12h5.8M15.2 12H21" />
    </svg>
  );
}

/**
 * Набор иконок, доступных из контента по имени.
 *
 * В content/site.json в поле facts[].icon указывается короткое имя
 * (например "tool"), а не путь к файлу. Если имя неизвестно или не указано,
 * используется иконка по умолчанию — так контент никогда не сломает вёрстку.
 */
export const ICON_BY_NAME: Record<string, (props: IconProps) => JSX.Element> = {
  tool: ToolIcon,
  "clock-fast": ClockFastIcon,
  shield: ShieldIcon,
  wheel: WheelIcon,
  check: CheckIcon,
  "map-pin": MapPinIcon,
  phone: PhoneIcon,
  clock: ClockIcon,
  star: StarIcon,
  route: RouteIcon,
  telegram: TelegramIcon,
  chat: ChatIcon,
};

export const DEFAULT_FACT_ICON = "tool";

/** Получить компонент иконки по имени из контента. */
export function resolveIcon(name?: string) {
  if (name && ICON_BY_NAME[name]) return ICON_BY_NAME[name]!;
  return ICON_BY_NAME[DEFAULT_FACT_ICON]!;
}
