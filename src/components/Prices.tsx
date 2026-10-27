import type { Service } from "../types/content";
import { formatPrice } from "./Services";
import { Reveal } from "./Reveal";

interface PricesProps {
  services: Service[];
  priceNote: string;
}

export function Prices({ services, priceNote }: PricesProps) {
  return (
    <section className="section section--warm" id="prices">
      <div className="container">
        <div className="section__head">
          <span className="section__eyebrow">Цены</span>
          <h2 className="section__title">Стоимость работ</h2>
          <p className="section__subtitle">
            Честные цены без скрытых доплат. Итоговую стоимость мастер подтверждает до начала работ.
          </p>
        </div>

        {services.length === 0 ? (
          <p className="empty">Прайс пока не заполнен.</p>
        ) : (
          <Reveal>
            <table className="prices__table">
              <caption>{priceNote}</caption>
              <thead className="visually-hidden">
                <tr>
                  <th scope="col">Услуга</th>
                  <th scope="col">Цена</th>
                  <th scope="col">Единица измерения</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr className="prices__row" key={service.id}>
                    <td className="prices__cell">
                      <span className="prices__name">{service.title}</span>
                      <span className="prices__desc">{service.description}</span>
                    </td>
                    <td className="prices__cell prices__cell--price">{formatPrice(service)}</td>
                    <td className="prices__cell prices__cell--unit">
                      {service.price !== null ? service.priceUnit : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        )}

        <p className="prices__note">
          Стоимость может отличаться в зависимости от диаметра колеса, типа диска и состояния шины.
          Точную цену назовём после осмотра.
        </p>
      </div>
    </section>
  );
}
