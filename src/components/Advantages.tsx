import { Reveal } from "./Reveal";
import { ClockFastIcon, MapPinIcon, ShieldIcon, ToolIcon, WheelIcon, CheckIcon } from "./Icons";

interface AdvantagesProps {
  /** Короткие преимущества из настроек компании (site.advantages). */
  advantages: string[];
  city: string;
}

const ICONS = [ToolIcon, ClockFastIcon, ShieldIcon, MapPinIcon, WheelIcon, CheckIcon];

/** Дополнительные пояснения к преимуществам — общие для отрасли, без данных компании. */
const DETAILS = [
  "Мастера с опытом работы на шиномонтаже и профильном оборудовании.",
  "Работаем по записи — вы приезжаете к своему времени, без очереди.",
  "Если после работы возникнет вопрос — вернёмся к нему и разберёмся.",
  "Крытая площадка для работы в любую погоду и удобный заезд.",
  "Балансировочные стенды и подъёмники для колёс любого диаметра.",
];

export function Advantages({ advantages, city }: AdvantagesProps) {
  if (advantages.length === 0) return null;

  return (
    <section className="section" id="advantages">
      <div className="container">
        <div className="section__head">
          <span className="section__eyebrow">Преимущества</span>
          <h2 className="section__title">Почему выбирают нас в {city}</h2>
          <p className="section__subtitle">
            Мы делаем простую вещь: аккуратно и в срок приводим колёса в порядок.
          </p>
        </div>

        <div className="advantages__grid">
          {advantages.map((advantage, index) => {
            const Icon = ICONS[index % ICONS.length]!;
            const detail = DETAILS[index % DETAILS.length]!;

            return (
              <Reveal key={advantage} delay={Math.min(index * 60, 240)}>
                <article className="advantage-card" style={{ height: "100%" }}>
                  <span className="advantage-card__icon">
                    <Icon size={21} />
                  </span>
                  <div>
                    <h3 className="advantage-card__title">{advantage}</h3>
                    <p className="advantage-card__text">{detail}</p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
