import type { Fact, Photo, Service } from "../types/content";
import { assetPath } from "../lib/paths";
import { Reveal } from "./Reveal";
import { ArrowLeftIcon, ArrowRightIcon, CloseIcon, resolveIcon } from "./Icons";
import { useCallback, useEffect, useState } from "react";

interface GalleryProps {
  photos: Photo[];
  /** Пояснение из content/gallery.json (например, что это заглушки). */
  galleryNote: string;
  hasPlaceholders: boolean;
  /** Работает ли сайт без фотографий. */
  isPhotoLess: boolean;
  /** Показатели компании для вариации без фотографий. */
  facts: Fact[];
  /** Услуги — используются для блока «что входит в работу». */
  services: Service[];
}

export function Gallery({
  photos,
  galleryNote,
  hasPlaceholders,
  isPhotoLess,
  facts,
  services,
}: GalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);

  const showPrev = useCallback(() => {
    setOpenIndex((current) => {
      if (current === null) return current;
      return (current - 1 + photos.length) % photos.length;
    });
  }, [photos.length]);

  const showNext = useCallback(() => {
    setOpenIndex((current) => {
      if (current === null) return current;
      return (current + 1) % photos.length;
    });
  }, [photos.length]);

  // Управление клавиатурой и блокировка прокрутки, пока открыт просмотрщик.
  useEffect(() => {
    if (openIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") showPrev();
      if (event.key === "ArrowRight") showNext();
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [openIndex, close, showPrev, showNext]);

  // ---------------------------------------------------------------------------
  // Вариация без фотографий: вместо галереи — блоки с цифрами и этапами работы.
  // Сайт выглядит завершённым, даже если снимков компании нет вообще.
  // ---------------------------------------------------------------------------
  if (isPhotoLess) {
    const steps = services.slice(0, 6);

    return (
      <section className="section section--soft" id="gallery">
        <div className="container">
          <div className="section__head">
            <span className="section__eyebrow">Как мы работаем</span>
            <h2 className="section__title">Что происходит с вашими колёсами</h2>
            <p className="section__subtitle">
              Понятный порядок работ: вы видите, за что платите и сколько это занимает.
            </p>
          </div>

          {facts.length > 0 ? (
            <div className="facts__grid">
              {facts.map((fact, index) => {
                const Icon = resolveIcon(fact.icon);
                return (
                  <Reveal key={`${fact.value}-${fact.label}`} delay={Math.min(index * 45, 200)}>
                    <article className="fact-card" style={{ height: "100%" }}>
                      <span className="fact-card__icon">
                        <Icon size={22} />
                      </span>
                      <p className="fact-card__value">{fact.value}</p>
                      <p className="fact-card__label">{fact.label}</p>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          ) : null}

          {steps.length > 0 ? (
            <ol className="steps">
              {steps.map((service, index) => (
                <Reveal as="li" key={service.id} delay={Math.min(index * 45, 220)}>
                  <div className="steps__item">
                    <span className="steps__number" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="steps__title">{service.title}</h3>
                      <p className="steps__text">{service.description}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </ol>
          ) : null}
        </div>
      </section>
    );
  }

  // ---------------------------------------------------------------------------
  // Вариация с фотографиями: обычная галерея с просмотром.
  // ---------------------------------------------------------------------------
  const active = openIndex === null ? null : photos[openIndex] ?? null;

  return (
    <section className="section section--soft" id="gallery">
      <div className="container">
        <div className="section__head">
          <span className="section__eyebrow">Фотографии</span>
          <h2 className="section__title">Как у нас выглядит</h2>
          <p className="section__subtitle">
            Рабочая зона, оборудование и подъезд — чтобы вы знали, куда приедете.
          </p>
        </div>

        {photos.length === 0 ? (
          <p className="empty">Фотографии появятся после добавления в панели управления.</p>
        ) : (
          <div className="gallery__grid">
            {photos.map((photo, index) => (
              <Reveal key={photo.id} delay={Math.min(index * 45, 200)}>
                <button
                  type="button"
                  className="gallery__item"
                  onClick={() => setOpenIndex(index)}
                  aria-label={`Открыть фотографию: ${photo.caption || photo.alt}`}
                >
                  <img src={assetPath(photo.src)} alt={photo.alt} loading="lazy" decoding="async" />
                  {photo.isPlaceholder ? (
                    <span className="gallery__flag">Заглушка</span>
                  ) : null}
                  {photo.caption ? <span className="gallery__caption">{photo.caption}</span> : null}
                </button>
              </Reveal>
            ))}
          </div>
        )}

        {hasPlaceholders && galleryNote ? (
          <p className="gallery__note">{galleryNote}</p>
        ) : null}
      </div>

      {active ? (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Просмотр фотографий"
          onClick={close}
        >
          <button type="button" className="lightbox__button lightbox__close" onClick={close} aria-label="Закрыть">
            <CloseIcon size={22} />
          </button>

          <figure className="lightbox__figure" onClick={(event) => event.stopPropagation()}>
            <img className="lightbox__image" src={assetPath(active.src)} alt={active.alt} />

            <figcaption className="lightbox__caption">
              {active.caption || active.alt}
              {active.isPlaceholder ? " (изображение-заглушка)" : ""}
            </figcaption>

            {photos.length > 1 ? (
              <div className="lightbox__controls">
                <button
                  type="button"
                  className="lightbox__button"
                  onClick={showPrev}
                  aria-label="Предыдущая фотография"
                >
                  <ArrowLeftIcon size={20} />
                </button>
                <span className="lightbox__caption">
                  {(openIndex ?? 0) + 1} из {photos.length}
                </span>
                <button
                  type="button"
                  className="lightbox__button"
                  onClick={showNext}
                  aria-label="Следующая фотография"
                >
                  <ArrowRightIcon size={20} />
                </button>
              </div>
            ) : null}
          </figure>
        </div>
      ) : null}
    </section>
  );
}
