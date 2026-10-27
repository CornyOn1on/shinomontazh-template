import type { SiteConfig } from "../types/content";
import { buildMapUrl, buildTelUrl, displayPhone, fullAddress, getRouteLinks } from "../lib/maps";
import { normalizeTelegramUsername } from "../lib/booking";
import { MAX_FALLBACK_URL } from "../lib/booking";
import { MapPinIcon, PhoneIcon, ClockIcon, RouteIcon, TelegramIcon, ChatIcon } from "./Icons";
import { Reveal } from "./Reveal";

interface ContactsProps {
  site: SiteConfig;
}

export function Contacts({ site }: ContactsProps) {
  const telUrl = buildTelUrl(site.phone);
  const { routeUrl, hasRoute } = getRouteLinks(site);
  const mapUrl = buildMapUrl(site);

  const telegramUsername = normalizeTelegramUsername(site.telegramUsername);
  const telegramUrl = telegramUsername ? `https://t.me/${telegramUsername}` : "";

  const maxUrl = site.maxEnabled
    ? site.maxProfileUrl.trim() || MAX_FALLBACK_URL
    : "";

  const open = (url: string) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="section section--warm" id="contacts">
      <div className="container">
        <div className="section__head">
          <span className="section__eyebrow">Контакты</span>
          <h2 className="section__title">Где нас найти</h2>
          <p className="section__subtitle">
            {site.city}, {site.region} — заезжайте по записи или свяжитесь удобным способом.
          </p>
        </div>

        <div className="contacts__grid">
          <Reveal>
            <div className="contacts__list">
              <div className="contact-row">
                <span className="contact-row__icon">
                  <MapPinIcon size={20} />
                </span>
                <div>
                  <p className="contact-row__label">Адрес</p>
                  <p className="contact-row__value">{fullAddress(site)}</p>
                  <p className="contact-row__hint">
                    Точную схему проезда покажет маршрут в Яндекс Картах.
                  </p>
                </div>
              </div>

              <div className="contact-row">
                <span className="contact-row__icon">
                  <PhoneIcon size={20} />
                </span>
                <div>
                  <p className="contact-row__label">Телефон</p>
                  <p className="contact-row__value">
                    {telUrl ? <a href={telUrl}>{displayPhone(site.phone)}</a> : "не указан"}
                  </p>
                  <p className="contact-row__hint">
                    Звоните — подскажем свободное время и цену.
                  </p>
                </div>
              </div>

              <div className="contact-row">
                <span className="contact-row__icon">
                  <ClockIcon size={20} />
                </span>
                <div>
                  <p className="contact-row__label">Режим работы</p>
                  <p className="contact-row__value">{site.workingHours}</p>
                </div>
              </div>

              {telegramUrl || (site.maxEnabled && maxUrl) ? (
                <div className="contact-row">
                  <span className="contact-row__icon">
                    <ChatIcon size={20} />
                  </span>
                  <div>
                    <p className="contact-row__label">Мессенджеры</p>
                    <div className="contacts__actions">
                      {telegramUrl ? (
                        <a
                          className="btn btn--outline"
                          href={telegramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <TelegramIcon size={17} />
                          Telegram
                        </a>
                      ) : null}

                      {site.maxEnabled && maxUrl ? (
                        <a
                          className="btn btn--outline"
                          href={maxUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ChatIcon size={17} />
                          MAX
                        </a>
                      ) : null}
                    </div>
                    <p className="contact-row__hint">
                      Сначала напишите суть вопроса, чтобы мастер подготовился.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="contacts__actions">
                {telUrl ? (
                  <a className="btn btn--accent" href={telUrl}>
                    <PhoneIcon size={17} />
                    Позвонить
                  </a>
                ) : null}

                {hasRoute ? (
                  <button type="button" className="btn btn--navy" onClick={() => open(routeUrl)}>
                    <RouteIcon size={17} />
                    Построить маршрут
                  </button>
                ) : null}

                {mapUrl ? (
                  <button type="button" className="btn btn--outline" onClick={() => open(mapUrl)}>
                    <MapPinIcon size={17} />
                    Открыть адрес на карте
                  </button>
                ) : null}
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="contacts__map">
              {mapUrl ? (
                <iframe
                  className="contacts__map-frame"
                  src={buildMapEmbedUrl(site)}
                  title={`Карта: ${fullAddress(site)}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              ) : (
                <div className="contacts__map-fallback">
                  <MapPinIcon size={28} />
                  <p>
                    Карта появится, когда в настройках будет указан адрес или ссылка на Яндекс Карты.
                  </p>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/**
 * Встроенная карта Яндекс.Конструктора.
 *
 * Формируется только при наличии адреса или координат — главную страницу
 * Яндекс Карт без адреса в iframe не встраиваем.
 */
function buildMapEmbedUrl(site: SiteConfig): string {
  const query =
    site.latitude !== null && site.longitude !== null
      ? `${site.latitude},${site.longitude}`
      : fullAddress(site);

  return `https://yandex.ru/map-widget/v1/?text=${encodeURIComponent(query)}&z=17`;
}
