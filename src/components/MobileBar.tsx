import type { SiteConfig } from "../types/content";
import { buildTelUrl } from "../lib/maps";
import { PhoneIcon } from "./Icons";

interface MobileBarProps {
  site: SiteConfig;
  onBook: () => void;
}

/**
 * Фиксированная нижняя панель на мобильных:
 * крупная кнопка «Записаться» и кнопка звонка.
 * На десктопе скрыта (см. .mobile-bar в components.css).
 */
export function MobileBar({ site, onBook }: MobileBarProps) {
  const telUrl = buildTelUrl(site.phone);

  return (
    <div className="mobile-bar">
      <div className="mobile-bar__inner">
        {telUrl ? (
          <a className="mobile-bar__call" href={telUrl} aria-label={`Позвонить: ${site.phone}`}>
            <PhoneIcon size={20} />
          </a>
        ) : (
          <span />
        )}

        <button type="button" className="btn btn--accent btn--lg" onClick={onBook}>
          Записаться
        </button>
      </div>
    </div>
  );
}
