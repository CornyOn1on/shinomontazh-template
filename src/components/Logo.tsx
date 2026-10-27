import { assetPath, companyInitials } from "../lib/paths";

interface LogoProps {
  /** Название компании — используется в текстовом логотипе и в alt. */
  companyName: string;
  /** Путь к логотипу. Пустая строка = логотипа нет. */
  logo: string;
  /** Подпись под названием (например, город). */
  caption?: string;
  /** Показывать ли подпись. */
  showCaption?: boolean;
}

/**
 * Логотип компании.
 *
 * Если файл логотипа указан и загрузился — показываем изображение
 * с сохранением пропорций и alt-текстом.
 * Если логотипа нет или файл не загрузился — показываем аккуратный
 * текстовый знак с инициалами. Битой картинки и пустого места не будет.
 */
export function Logo({ companyName, logo, caption, showCaption = true }: LogoProps) {
  if (logo) {
    return (
      <div className="logo">
        <img
          className="logo__image"
          src={assetPath(logo)}
          alt={`Логотип: ${companyName}`}
          loading="eager"
          decoding="async"
          onError={(event) => {
            // Если файл не найден — прячем картинку, чтобы не показывать
            // битое изображение. Остаётся текстовый знак.
            const img = event.currentTarget;
            img.style.display = "none";
            const fallback = img.nextElementSibling as HTMLElement | null;
            if (fallback) fallback.style.display = "flex";
          }}
        />
        <div className="logo" style={{ display: "none" }} aria-hidden="true">
          <span className="logo__mark">{companyInitials(companyName)}</span>
          <LogoText companyName={companyName} caption={caption} showCaption={showCaption} />
        </div>
      </div>
    );
  }

  return (
    <div className="logo">
      <span className="logo__mark" aria-hidden="true">
        {companyInitials(companyName)}
      </span>
      <LogoText companyName={companyName} caption={caption} showCaption={showCaption} />
    </div>
  );
}

function LogoText({
  companyName,
  caption,
  showCaption,
}: {
  companyName: string;
  caption?: string;
  showCaption: boolean;
}) {
  const captionText = caption ?? "";

  return (
    <span className="logo__text">
      <span className="logo__name">{companyName}</span>
      {showCaption && captionText ? <span className="logo__caption">{captionText}</span> : null}
    </span>
  );
}
