import { useCallback, useEffect, useRef, useState } from "react";

import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Services } from "./components/Services";
import { Prices } from "./components/Prices";
import { Advantages } from "./components/Advantages";
import { Gallery } from "./components/Gallery";
import { Reviews } from "./components/Reviews";
import { Booking } from "./components/Booking";
import { Contacts } from "./components/Contacts";
import { Footer } from "./components/Footer";
import { MobileBar } from "./components/MobileBar";
import { LegalPage } from "./components/LegalPage";
import { Seo } from "./components/Seo";

import {
  facts,
  galleryNote,
  hasDemoReviews,
  hasPlaceholderPhotos,
  isPhotoLess,
  photos,
  priceNote,
  reviews,
  reviewsNote,
  services,
  site,
} from "./data/content";

export default function App() {
  const [presetService, setPresetService] = useState("");
  const [showPrivacy, setShowPrivacy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  /** Прокрутка к форме записи. */
  const scrollToForm = useCallback(() => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  /** Запись на конкретную услугу: подставляем услугу и идём к форме. */
  const bookService = useCallback(
    (serviceTitle: string) => {
      setPresetService(serviceTitle);
      scrollToForm();
    },
    [scrollToForm],
  );

  const consumePreset = useCallback(() => setPresetService(""), []);

  /**
   * Простая «маршрутизация» по хэшу для страницы политики.
   * Серверной маршрутизации на GitHub Pages нет — используем якорь.
   */
  useEffect(() => {
    const syncFromHash = () => {
      const isPrivacy = window.location.hash === "#privacy";
      setShowPrivacy(isPrivacy);

      if (isPrivacy) {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  const closePrivacy = useCallback(() => {
    // Убираем #privacy без прыжка страницы.
    history.replaceState(null, "", window.location.pathname + window.location.search);
    setShowPrivacy(false);
  }, []);

  return (
    <>
      <Seo site={site} services={services} />

      {showPrivacy ? (
        <LegalPage site={site} onClose={closePrivacy} />
      ) : (
        <>
          <Header site={site} onBook={scrollToForm} />

          <main>
            <Hero
              site={site}
              heroPhoto={photos[0]}
              isPhotoLess={isPhotoLess}
              facts={facts}
              onBook={scrollToForm}
            />

            <Services services={services} onBookService={bookService} />

            <Prices services={services} priceNote={priceNote} />

            <Advantages advantages={site.advantages} city={site.city} />

            <Gallery
              photos={photos}
              galleryNote={galleryNote}
              hasPlaceholders={hasPlaceholderPhotos}
              isPhotoLess={isPhotoLess}
              facts={facts}
              services={services}
            />

            <Reviews
              reviews={reviews}
              site={site}
              reviewsNote={reviewsNote}
              hasDemoReviews={hasDemoReviews}
            />

            <Booking
              site={site}
              services={services}
              presetService={presetService}
              onPresetConsumed={consumePreset}
              formRef={formRef}
            />

            <Contacts site={site} />
          </main>

          <Footer site={site} onBook={scrollToForm} />
          <MobileBar site={site} onBook={scrollToForm} />
        </>
      )}
    </>
  );
}
