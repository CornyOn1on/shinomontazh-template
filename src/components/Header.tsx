import { useState } from "react";
import type { SiteConfig } from "../types/content";
import { Logo } from "./Logo";
import { PhoneIcon } from "./Icons";
import { buildTelUrl, displayPhone } from "../lib/maps";

interface HeaderProps {
  site: SiteConfig;
  /** Прокрутить к форме записи. */
  onBook: () => void;
}

export const NAV_LINKS = [
  { href: "#services", label: "Услуги" },
  { href: "#prices", label: "Цены" },
  { href: "#advantages", label: "Преимущества" },
  { href: "#gallery", label: "Фото" },
  { href: "#reviews", label: "Отзывы" },
  { href: "#contacts", label: "Контакты" },
] as const;

export function Header({ site, onBook }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const telUrl = buildTelUrl(site.phone);

  const closeMenu = () => setMenuOpen(false);

  const handleBook = () => {
    closeMenu();
    onBook();
  };

  return (
    <>
      <header className="header">
        <div className="container header__inner">
          <a href="#top" aria-label={`${site.companyName} — на главную`} onClick={closeMenu}>
            <Logo
              companyName={site.companyName}
              logo={site.logo}
              caption={`${site.city}, ${site.region}`}
            />
          </a>

          <nav className="header__nav" aria-label="Основная навигация">
            {NAV_LINKS.map((link) => (
              <a key={link.href} className="header__link" href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="header__actions">
            {telUrl ? (
              <a className="header__phone" href={telUrl}>
                <PhoneIcon size={17} />
                {displayPhone(site.phone)}
              </a>
            ) : null}

            <button type="button" className="btn btn--accent" onClick={handleBook}>
              Записаться
            </button>

            <button
              type="button"
              className={`header__burger ${menuOpen ? "header__burger--open" : ""}`}
              aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="header__burger-lines" />
            </button>
          </div>
        </div>
      </header>

      <div
        id="mobile-menu"
        className={`mobile-menu ${menuOpen ? "mobile-menu--open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <nav aria-label="Мобильная навигация">
          <ul className="mobile-menu__list">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a className="mobile-menu__link" href={link.href} onClick={closeMenu}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mobile-menu__contact">
          <strong>{site.companyName}</strong>
          <span>{site.address}</span>
          <span>{site.workingHours}</span>
        </div>

        <div className="mobile-menu__actions">
          <button type="button" className="btn btn--accent btn--lg btn--block" onClick={handleBook}>
            Записаться
          </button>
          {telUrl ? (
            <a className="btn btn--outline btn--lg btn--block" href={telUrl}>
              <PhoneIcon size={17} />
              Позвонить
            </a>
          ) : null}
        </div>
      </div>
    </>
  );
}
