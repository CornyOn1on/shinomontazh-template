import type { Fact, Photo, SiteConfig } from "../types/content";
import { RouteIcon, PhoneIcon, CheckIcon, StarIcon, resolveIcon } from "./Icons";
import { buildTelUrl, getRouteLinks } from "../lib/maps";
import { assetPath } from "../lib/paths";

interface HeroProps {
  site: SiteConfig;
  /** Первое видимое фото — используется как главное изображение первого экрана. */
  heroPhoto: Photo | undefined;
  /** Работает ли сайт без фотографий. */
  isPhotoLess: boolean;
  /** Показатели компании для вариации без фотографий. */
  facts: Fact[];
  onBook: () => void;
}

export function Hero({ site, heroPhoto, isPhotoLess, facts, onBook }: HeroProps) {
  const { routeUrl, hasRoute } = getRouteLinks(site);
  const telUrl = buildTelUrl(site.phone);
  const advantages = site.advantages.slice(0, 4);

  const openRoute = () => {
    if (!routeUrl) return;
    window.open(routeUrl, "_blank", "noopener,noreferrer");
  };

  const showRating = site.reviewCount > 0;

  return (
    <section className="hero" id="top">
      <div className="container hero__grid">
        <div>
          <p className="hero__location">
            <span aria-hidden="true">📍</span>
            {site.city}, {site.region}
          </p>

          <h1 className="hero__title">{site.heroTitle}</h1>
          <p className="hero__description">{site.heroDescription}</p>

          <div className="hero__actions">
            <button type="button" className="btn btn--accent btn--lg" onClick={onBook}>
              Записаться
            </button>

            {telUrl ? (
              <a className="btn btn--outline btn--lg" href={telUrl}>
                <PhoneIcon size={18} />
                Позвонить
              </a>
            ) : null}

            {hasRoute ? (
              <button type="button" className="btn btn--outline btn--lg" onClick={openRoute}>
                <RouteIcon size={18} />
                Построить маршрут
              </button>
            ) : null}
          </div>

          {advantages.length > 0 ? (
            <ul className="hero__advantages">
              {advantages.map((advantage) => (
                <li className="hero__advantage" key={advantage}>
                  <CheckIcon size={17} />
                  {advantage}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {/* Вариация с фотографией: главный снимок компании. */}
        {!isPhotoLess ? (
          <div className="hero__media">
            {heroPhoto ? (
              <img
                src={assetPath(heroPhoto.src)}
                alt={heroPhoto.alt}
                loading="eager"
                decoding="async"
              />
            ) : (
              <div className="contacts__map-fallback">
                <span>Фотография появится после добавления в CMS</span>
              </div>
            )}

            {heroPhoto?.isPlaceholder ? (
              <span className="hero__badge">Изображение-заглушка</span>
            ) : null}

            {showRating ? (
              <span className="hero__rating">
                <StarIcon size={15} />
                {site.rating.toFixed(1)} · {site.reviewCount} {pluralizeReviews(site.reviewCount)}
              </span>
            ) : null}
          </div>
        ) : (
          /* Вариация без фотографий: графическая панель с показателями. */
          <div className="hero__panel">
            <div className="hero__panel-head">
              <span className="hero__panel-mark" aria-hidden="true">
                <WheelMark />
              </span>
              <div>
                <p className="hero__panel-title">{site.companyName}</p>
                <p className="hero__panel-subtitle">{site.workingHours}</p>
              </div>
            </div>

            {facts.length > 0 ? (
              <ul className="hero__facts">
                {facts.slice(0, 4).map((fact) => {
                  const Icon = resolveIcon(fact.icon);
                  return (
                    <li className="hero__fact" key={`${fact.value}-${fact.label}`}>
                      <span className="hero__fact-icon">
                        <Icon size={20} />
                      </span>
                      <span className="hero__fact-text">
                        <span className="hero__fact-value">{fact.value}</span>
                        <span className="hero__fact-label">{fact.label}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : null}

            {showRating ? (
              <p className="hero__panel-rating">
                <StarIcon size={16} />
                {site.rating.toFixed(1)} · {site.reviewCount} {pluralizeReviews(site.reviewCount)}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

/** Крупный графический знак колеса для панели без фотографий. */
function WheelMark() {
  return (
    <svg viewBox="0 0 64 64" width="44" height="44" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="24" fill="none" stroke="currentColor" strokeWidth="5" />
      <circle cx="32" cy="32" r="8" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="5" strokeLinecap="round">
        <path d="M32 8v10" />
        <path d="M32 46v10" />
        <path d="M8 32h10" />
        <path d="M46 32h10" />
      </g>
    </svg>
  );
}

export function pluralizeReviews(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) return "отзыв";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "отзыва";
  return "отзывов";
}
