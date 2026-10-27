import { useEffect, useMemo, useState } from "react";
import type { Service, SiteConfig } from "../types/content";
import {
  buildBookingMessage,
  buildMaxTarget,
  buildTelegramTarget,
  copyToClipboard,
  normalizeTelegramUsername,
  MAX_FALLBACK_URL,
  openExternal,
} from "../lib/booking";
import {
  COMMENT_MAX_LENGTH,
  NAME_MAX_LENGTH,
  formatPhoneInput,
  hasErrors,
  validateForm,
  type ValidationErrors,
} from "../lib/validation";
import { buildTelUrl, displayPhone } from "../lib/maps";
import { CopyIcon, InfoIcon, PhoneIcon, TelegramIcon, ChatIcon, WarnIcon, CheckIcon } from "./Icons";
import { Reveal } from "./Reveal";

interface BookingProps {
  site: SiteConfig;
  services: Service[];
  /** Название услуги, которое нужно подставить в форму (нажатие «Записаться» в карточке). */
  presetService: string;
  /** Уведомить родителя об изменении предустановленной услуги. */
  onPresetConsumed: () => void;
  /** Ссылка на DOM-узел формы для прокрутки. */
  formRef: React.RefObject<HTMLFormElement>;
}

interface NoticeState {
  kind: "info" | "success" | "warning" | "error";
  text: string;
}

const EMPTY_FORM = {
  name: "",
  phone: "",
  service: "",
  comment: "",
  website: "",
  consent: false,
};

export function Booking({
  site,
  services,
  presetService,
  onPresetConsumed,
  formRef,
}: BookingProps) {
  const [values, setValues] = useState({ ...EMPTY_FORM, service: presetService });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Подстановка услуги при нажатии «Записаться» в карточке услуги.
  useEffect(() => {
    if (!presetService) return;
    setValues((current) => ({ ...current, service: presetService }));
    onPresetConsumed();
  }, [presetService, onPresetConsumed]);

  // Сброс индикатора копирования через пару секунд.
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const telegramUsername = normalizeTelegramUsername(site.telegramUsername);
  const telUrl = buildTelUrl(site.phone);
  const maxEnabled = Boolean(site.maxEnabled);

  const message = useMemo(
    () =>
      buildBookingMessage(site, values.service, {
        name: values.name,
        phone: values.phone,
        comment: values.comment,
      }),
    [site, values.service, values.name, values.phone, values.comment],
  );

  const updateField = <K extends keyof typeof values>(field: K, value: (typeof values)[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field as keyof ValidationErrors]) return current;
      const next = { ...current };
      delete next[field as keyof ValidationErrors];
      return next;
    });
  };

  /**
   * Проверка перед любым действием с заявкой.
   * Возвращает true, если можно продолжать.
   *
   * Honeypot: если скрытое поле заполнено — это бот. Заявка не готовится.
   */
  const prepare = (): boolean => {
    if (values.website.trim() !== "") {
      setNotice({
        kind: "error",
        text: "Не удалось подготовить заявку. Обновите страницу и попробуйте ещё раз.",
      });
      return false;
    }

    const nextErrors = validateForm(values);
    setErrors(nextErrors);

    if (hasErrors(nextErrors)) {
      setNotice({
        kind: "error",
        text: "Проверьте выделенные поля — в них есть ошибки.",
      });
      return false;
    }

    setNotice(null);
    return true;
  };

  /**
   * Кнопка «Скопировать заявку».
   * Копирует подготовленный текст в буфер обмена. Отправку выполняет
   * пользователь вручную в любом мессенджере.
   */
  const handleCopy = async () => {
    if (!prepare()) return;

    const ok = await copyToClipboard(message);
    if (ok) {
      setCopied(true);
      setShowPreview(true);
      setNotice({
        kind: "success",
        text: "Текст заявки скопирован. Вставьте его в чат с владельцем — в Telegram, MAX или другом мессенджере — и отправьте.",
      });
    } else {
      setShowPreview(true);
      setNotice({
        kind: "warning",
        text: "Не удалось скопировать автоматически. Текст заявки показан ниже — выделите и скопируйте его вручную.",
      });
    }
  };

  /**
   * Кнопка «Открыть Telegram с заявкой».
   *
   * Сообщение об отправке НЕ показывается: сайт только открывает чат
   * с готовым текстом. Отправку выполняет пользователь в Telegram.
   */
  const handleTelegram = () => {
    if (submitting) return;
    if (!prepare()) return;

    const target = buildTelegramTarget(site, message);

    if (!target.url) {
      setShowPreview(true);
      setNotice({
        kind: "warning",
        text:
          "В настройках компании не указан Telegram. Заявку можно скопировать и отправить владельцу любым удобным способом, а также позвонить по телефону.",
      });
      return;
    }

    setSubmitting(true);
    setShowPreview(true);
    openExternal(target.url);

    setNotice({
      kind: "info",
      text: "Telegram открыт с готовым текстом заявки. Нажмите кнопку отправки в Telegram, чтобы передать заявку владельцу.",
    });

    window.setTimeout(() => setSubmitting(false), 900);
  };

  /**
   * Кнопка «Написать в MAX».
   *
   * MAX — вторичный канал. Сайт копирует текст заявки в буфер обмена,
   * затем открывает профиль владельца. Пользователь вставляет текст
   * в чат и отправляет его сам.
   */
  const handleMax = async () => {
    if (submitting) return;
    if (!prepare()) return;

    const target = buildMaxTarget(site, message);
    const copiedOk = await copyToClipboard(message);
    setShowPreview(true);

    const urlToOpen = target.shareUrl || target.profileUrl || MAX_FALLBACK_URL;
    openExternal(urlToOpen);

    if (copiedOk) {
      setNotice({
        kind: "info",
        text: "Текст заявки скопирован. Вставьте его в открывшийся чат MAX и отправьте владельцу.",
      });
    } else {
      setNotice({
        kind: "warning",
        text: "Текст заявки показан ниже. Скопируйте его и вставьте в открывшийся чат MAX, чтобы отправить владельцу.",
      });
    }

    window.setTimeout(() => setSubmitting(false), 900);
  };

  const nameCounter = `${values.name.length}/${NAME_MAX_LENGTH}`;
  const commentCounter = `${values.comment.length}/${COMMENT_MAX_LENGTH}`;

  return (
    <section className="booking section" id="booking">
      <div className="container booking__grid">
        <Reveal>
          <div>
            <span className="section__eyebrow" style={{ color: "#ffb37a" }}>
              Запись
            </span>
            <h2 className="section__title">Записаться на шиномонтаж</h2>
            <p className="booking__intro">
              Заполните короткую форму — сайт подготовит текст заявки. Отправить её нужно кнопкой
              отправки в мессенджере: так вы точно будете знать, что владелец получил сообщение.
            </p>

            <div className="booking__steps">
              <p className="booking__step">
                <span className="booking__step-number">1</span>
                Заполните имя, телефон и выберите услугу.
              </p>
              <p className="booking__step">
                <span className="booking__step-number">2</span>
                Нажмите «Открыть Telegram с заявкой» или «Написать в MAX».
              </p>
              <p className="booking__step">
                <span className="booking__step-number">3</span>
                В мессенджере нажмите кнопку отправки — только тогда заявка уйдёт владельцу.
              </p>
              <p className="booking__step">
                <span className="booking__step-number">4</span>
                Дата и время согласуются напрямую с мастером в переписке.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <form
            ref={formRef}
            className="booking__form"
            noValidate
            onSubmit={(event) => {
              // У формы нет серверной отправки: Enter не должен перезагружать страницу.
              event.preventDefault();
              handleTelegram();
            }}
          >
            <div className="field">
              <label className="field__label" htmlFor="booking-name">
                Имя<span className="field__required">*</span>
              </label>
              <input
                id="booking-name"
                className={`field__input ${errors.name ? "field__input--error" : ""}`}
                name="name"
                type="text"
                autoComplete="name"
                maxLength={NAME_MAX_LENGTH}
                placeholder="Как к вам обращаться"
                value={values.name}
                onChange={(event) => updateField("name", event.target.value)}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "booking-name-error" : undefined}
              />
              {errors.name ? (
                <span className="field__error" id="booking-name-error" role="alert">
                  {errors.name}
                </span>
              ) : (
                <span className="field__hint">Например: Алексей</span>
              )}
              <span className="field__counter">{nameCounter}</span>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="booking-phone">
                Телефон<span className="field__required">*</span>
              </label>
              <input
                id="booking-phone"
                className={`field__input ${errors.phone ? "field__input--error" : ""}`}
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+7 900 000-00-00"
                value={values.phone}
                onChange={(event) => updateField("phone", formatPhoneInput(event.target.value))}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "booking-phone-error" : undefined}
              />
              {errors.phone ? (
                <span className="field__error" id="booking-phone-error" role="alert">
                  {errors.phone}
                </span>
              ) : (
                <span className="field__hint">
                  Нужен, чтобы мастер знал, куда перезвонить.
                </span>
              )}
            </div>

            <div className="field">
              <label className="field__label" htmlFor="booking-service">
                Услуга<span className="field__required">*</span>
              </label>
              <select
                id="booking-service"
                className={`field__select ${errors.service ? "field__select--error" : ""}`}
                name="service"
                value={values.service}
                onChange={(event) => updateField("service", event.target.value)}
                aria-invalid={Boolean(errors.service)}
                aria-describedby={errors.service ? "booking-service-error" : undefined}
              >
                <option value="">Выберите услугу</option>
                {services.map((service) => (
                  <option key={service.id} value={service.title}>
                    {service.title}
                  </option>
                ))}
                <option value="Другое">Другое — уточню в комментарии</option>
              </select>
              {errors.service ? (
                <span className="field__error" id="booking-service-error" role="alert">
                  {errors.service}
                </span>
              ) : null}
            </div>

            <div className="field">
              <label className="field__label" htmlFor="booking-comment">
                Комментарий
              </label>
              <textarea
                id="booking-comment"
                className={`field__textarea ${errors.comment ? "field__textarea--error" : ""}`}
                name="comment"
                maxLength={COMMENT_MAX_LENGTH + 50}
                placeholder="Опишите ситуацию: марка авто, какие колёса, что случилось"
                value={values.comment}
                onChange={(event) => updateField("comment", event.target.value)}
                aria-invalid={Boolean(errors.comment)}
                aria-describedby={errors.comment ? "booking-comment-error" : undefined}
              />
              {errors.comment ? (
                <span className="field__error" id="booking-comment-error" role="alert">
                  {errors.comment}
                </span>
              ) : null}
              <span className="field__counter">{commentCounter}</span>
            </div>

            {/* Honeypot: скрытое поле. Люди его не видят и не заполняют. */}
            <div className="field__honeypot" aria-hidden="true">
              <label htmlFor="booking-website">Website</label>
              <input
                id="booking-website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={values.website}
                onChange={(event) => updateField("website", event.target.value)}
              />
            </div>

            <div className="field">
              <label className="checkbox" htmlFor="booking-consent">
                <input
                  id="booking-consent"
                  type="checkbox"
                  checked={values.consent}
                  onChange={(event) => updateField("consent", event.target.checked)}
                  aria-invalid={Boolean(errors.consent)}
                  aria-describedby={errors.consent ? "booking-consent-error" : undefined}
                />
                <span>
                  Согласен на обработку персональных данных для связи по заявке. Подробнее —{" "}
                  <a href="#privacy" onClick={(event) => event.stopPropagation()}>
                    политика конфиденциальности
                  </a>
                  .
                </span>
              </label>
              {errors.consent ? (
                <span className="field__error" id="booking-consent-error" role="alert">
                  {errors.consent}
                </span>
              ) : null}
            </div>

            <div className="booking__buttons">
              <button
                type="button"
                className="btn btn--accent btn--lg btn--block"
                onClick={handleTelegram}
                disabled={submitting}
              >
                <TelegramIcon size={18} />
                Открыть Telegram с заявкой
              </button>

              <div className="booking__buttons-row">
                {maxEnabled ? (
                  <button
                    type="button"
                    className="btn btn--navy btn--block"
                    onClick={handleMax}
                    disabled={submitting}
                  >
                    <ChatIcon size={18} />
                    Написать в MAX
                  </button>
                ) : null}

                <button
                  type="button"
                  className="btn btn--outline btn--block"
                  onClick={handleCopy}
                  disabled={submitting}
                >
                  {copied ? <CheckIcon size={18} /> : <CopyIcon size={18} />}
                  {copied ? "Скопировано" : "Скопировать заявку"}
                </button>
              </div>
            </div>

            {notice ? (
              <div className={`notice notice--${notice.kind}`} role="status">
                <span className="notice__icon">
                  {notice.kind === "warning" || notice.kind === "error" ? (
                    <WarnIcon size={18} />
                  ) : (
                    <InfoIcon size={18} />
                  )}
                </span>
                <span>{notice.text}</span>
              </div>
            ) : null}

            {showPreview ? (
              <div className="booking__preview">
                <p className="field__hint">
                  Текст заявки, который будет отправлен:
                </p>
                <pre className="booking__preview-text">{message}</pre>
              </div>
            ) : null}

            <div className="notice notice--warning" style={{ marginTop: 20 }}>
              <span className="notice__icon">
                <WarnIcon size={18} />
              </span>
              <span>
                Сайт не отправляет заявку автоматически. Сообщение уйдёт владельцу только после того,
                как вы нажмёте кнопку отправки в мессенджере.
              </span>
            </div>

            <div className="notice notice--info">
              <span className="notice__icon">
                <InfoIcon size={18} />
              </span>
              <span>
                {telegramUsername
                  ? `Telegram владельца: @${telegramUsername}.`
                  : "Telegram компании пока не подключён — заявку можно скопировать или позвонить."}
                {telUrl ? (
                  <>
                    {" "}
                    Телефон:{" "}
                    <a href={telUrl} style={{ fontWeight: 700 }}>
                      <PhoneIcon size={14} /> {displayPhone(site.phone)}
                    </a>
                  </>
                ) : null}
              </span>
            </div>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
