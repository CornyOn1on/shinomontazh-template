import type { Service } from "../types/content";
import { Reveal } from "./Reveal";

interface ServicesProps {
  services: Service[];
  /** Записаться на конкретную услугу — подставляет услугу в форму. */
  onBookService: (serviceTitle: string) => void;
}

export function formatPrice(service: Service): string {
  if (service.price === null) return service.priceUnit || "по запросу";
  const price = new Intl.NumberFormat("ru-RU").format(service.price);
  return `${service.priceFrom ? "от " : ""}${price} ₽`;
}

export function Services({ services, onBookService }: ServicesProps) {
  return (
    <section className="section" id="services">
      <div className="container">
        <div className="section__head">
          <span className="section__eyebrow">Услуги</span>
          <h2 className="section__title">Что мы делаем</h2>
          <p className="section__subtitle">
            Полный цикл работ с колёсами: от сезонной переобувки до ремонта сложных повреждений.
          </p>
        </div>

        {services.length === 0 ? (
          <p className="empty">Список услуг пока пуст. Добавьте услуги через панель управления.</p>
        ) : (
          <div className="services__grid">
            {services.map((service, index) => (
              <Reveal key={service.id} as="div" delay={Math.min(index * 45, 220)}>
                <article className="service-card" style={{ height: "100%" }}>
                  <h3 className="service-card__title">{service.title}</h3>
                  <p className="service-card__description">{service.description}</p>

                  <div className="service-card__footer">
                    <div
                      className={`service-card__price ${
                        service.price === null ? "service-card__price--request" : ""
                      }`}
                    >
                      <span className="service-card__price-value">{formatPrice(service)}</span>
                      {service.price !== null && service.priceUnit ? (
                        <span className="service-card__price-unit">{service.priceUnit}</span>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      className="btn btn--navy"
                      onClick={() => onBookService(service.title)}
                    >
                      Записаться
                    </button>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
