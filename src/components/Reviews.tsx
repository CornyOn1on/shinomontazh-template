import type { Review, SiteConfig } from "../types/content";
import { pluralizeReviews } from "./Hero";
import { Reveal } from "./Reveal";
import { StarIcon, ArrowRightIcon } from "./Icons";
import { companyInitials } from "../lib/paths";

interface ReviewsProps {
  reviews: Review[];
  site: SiteConfig;
  /** Пояснение из content/reviews.json (например, что отзывы демонстрационные). */
  reviewsNote: string;
  hasDemoReviews: boolean;
}

function formatReviewDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function Stars({ rating }: { rating: number }) {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <span className="review-card__stars" aria-label={`Оценка ${rounded} из 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <StarIcon key={index} size={16} filled={index < rounded} />
      ))}
    </span>
  );
}

export function Reviews({ reviews, site, reviewsNote, hasDemoReviews }: ReviewsProps) {
  if (reviews.length === 0) return null;

  return (
    <section className="section" id="reviews">
      <div className="container">
        <div className="section__head">
          <span className="section__eyebrow">Отзывы</span>
          <h2 className="section__title">Что говорят клиенты</h2>
        </div>

        <div className="reviews__summary">
          <div className="reviews__score">
            <span className="reviews__score-value">{site.rating.toFixed(1)}</span>
            <div className="reviews__score-meta">
              <Stars rating={site.rating} />
              <span>
                {site.reviewCount > 0
                  ? `${site.reviewCount} ${pluralizeReviews(site.reviewCount)} на Яндекс Картах`
                  : "Средняя оценка компании"}
              </span>
            </div>
          </div>

          {site.yandexMapsUrl ? (
            <a
              className="btn btn--outline"
              href={site.yandexMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Все отзывы на Яндекс Картах
              <ArrowRightIcon size={18} />
            </a>
          ) : null}
        </div>

        {hasDemoReviews && reviewsNote ? <p className="reviews__note">{reviewsNote}</p> : null}

        <div className="reviews__grid">
          {reviews.map((review, index) => {
            const cardContent = (
              <>
                <div className="review-card__head">
                  <div className="review-card__author">
                    <span className="review-card__avatar" aria-hidden="true">
                      {companyInitials(review.name)}
                    </span>
                    <span>
                      <span className="review-card__name">{review.name}</span>
                      <span className="review-card__date">{formatReviewDate(review.date)}</span>
                    </span>
                  </div>
                  <Stars rating={review.rating} />
                </div>

                <p className="review-card__text">{review.text}</p>

                {review.isDemo ? <span className="review-card__demo">Демонстрационный отзыв</span> : null}

                {review.yandexReviewUrl ? (
                  <span className="review-card__footer">
                    Читать отзыв на Яндекс Картах
                    <ArrowRightIcon size={16} />
                  </span>
                ) : null}
              </>
            );

            return (
              <Reveal key={review.id} delay={Math.min(index * 60, 240)}>
                {review.yandexReviewUrl ? (
                  <a
                    className="review-card review-card--link"
                    href={review.yandexReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ height: "100%" }}
                  >
                    {cardContent}
                  </a>
                ) : (
                  <article className="review-card" style={{ height: "100%" }}>
                    {cardContent}
                  </article>
                )}
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
