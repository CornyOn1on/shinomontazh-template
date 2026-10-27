import type { ReactNode } from "react";
import { useRevealOnScroll } from "../hooks/useRevealOnScroll";

interface RevealProps {
  children: ReactNode;
  /** Задержка появления в миллисекундах. */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}

/**
 * Обёртка для появления блока при прокрутке.
 * При prefers-reduced-motion анимация отключается (см. useRevealOnScroll).
 */
export function Reveal({ children, delay = 0, className, as = "div" }: RevealProps) {
  const { ref, isVisible } = useRevealOnScroll<HTMLDivElement>();
  const Tag = as as "div";

  const classes = ["reveal", isVisible ? "reveal--visible" : "", className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag
      ref={ref}
      className={classes}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
