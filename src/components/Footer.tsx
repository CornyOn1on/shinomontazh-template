import type { SiteConfig } from "../types/content";
import { NAV_LINKS } from "./Header";
import { Logo } from "./Logo";
import { buildTelUrl, displayPhone, fullAddress } from "../lib/maps";
import { normalizeTelegramUsername } from "../lib/booking";
import { PhoneIcon, MapPinIcon } from "./Icons";

interface FooterProps {
  site: SiteConfig;
  onBook: () => void;
}

export function Footer({ site, onBook }: FooterProps) {
  const telUrl = buildTelUrl(site.phone);
  const telegramUsername = normalizeTelegramUsername(site.telegramUsername);
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <Logo
              companyName={site.companyName}
              logo={site.logo}
              caption={`${site.city}, ${site.region}`}
              showCaption={false}
            />
            <p style={{ marginTop: 16, maxWidth: 320 }}>{site.shortDescription}</p>

            <div style={{ marginTop: 18 }}>
              <button type="button" className="btn btn--accent" onClick={onBook}>
                Записаться
              </button>
            </div>
          </div>

          <div>
            <h3 className="footer__title">Контакты</h3>
            <ul className="footer__list">
              {telUrl ? (
                <li>
                  <a className="footer__link" href={telUrl}>
                    <PhoneIcon size={15} /> {displayPhone(site.phone)}
                  </a>
                </li>
              ) : null}
              <li>
                <span>
                  <MapPinIcon size={15} /> {fullAddress(site)}
                </span>
              </li>
              <li>{site.workingHours}</li>
              {telegramUsername ? (
                <li>
                  <a
                    className="footer__link"
                    href={`https://t.me/${telegramUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Telegram: @{telegramUsername}
                  </a>
                </li>
              ) : null}
            </ul>
          </div>

          <div>
            <h3 className="footer__title">Разделы</h3>
            <ul className="footer__list">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a className="footer__link" href={link.href}>
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <a className="footer__link" href="#booking">
                  Записаться
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <span>
            © {year} {site.companyName}. {site.city}, {site.region}.
          </span>

          <div className="footer__legal">
            <a href="#privacy">Политика конфиденциальности</a>
            <a href="#privacy">Обработка персональных данных</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
