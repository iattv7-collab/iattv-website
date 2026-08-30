// ======================================================
// FILE: /js/modules/live-service/public-live-service.js
// PROJECT: IATTV Website
// PURPOSE:
// Text invitation or flyer in the same card.
// Tap flyer = full screen. Watch Live = stream.
// ======================================================

import { getLiveServiceSettings } from "/js/services/live-service-service.js";

const headerLiveButton = document.querySelector(".button-live");
const heroLiveButton = document.querySelector(
  ".hero-buttons .button-secondary",
);
const cardLiveButton = document.querySelector(".live-card-text .live-card-link");
const flyerLiveButton = document.querySelector("[data-live='flyerCta']");
const inviteLabelEl = document.querySelector(
  "[data-live='inviteLabel'], .live-label",
);
const titleEl = document.querySelector("[data-live='title'], .live-card h2");
const dayEl = document.querySelector("[data-live='day'], .live-day");
const timeEl = document.querySelector("[data-live='time'], .live-time");
const featuresEl = document.querySelector(
  "[data-live='features'], .live-features",
);
const textModeEl = document.querySelector("[data-live-mode='text']");
const flyerModeEl = document.querySelector("[data-live-mode='flyer']");
const flyerThumb = document.querySelector(".live-flyer-thumb");
const flyerOpen = document.querySelector(".live-flyer-open");
const lightbox = document.getElementById("flyerLightbox");
const lightboxImage = document.querySelector(".flyer-lightbox-image");
const lightboxLive = document.querySelector(".flyer-lightbox-live");
const lightboxClose = document.querySelector(".flyer-lightbox-close");

const DEFAULTS = {
  titleEn: "Saturdays of Wonders and Miracles",
  titleEs: "Sábados de Maravillas y Milagros",
  title: "Sábados de Maravillas y Milagros",
  inviteLabelEn: "You’re Invited",
  inviteLabelEs: "Estás invitado",
  dayLineEn: "Saturdays",
  dayLineEs: "Sábados",
  serviceTime: "7:00 PM",
  timeZone: "EST",
  featuresEn: "Faith • Word • Power",
  featuresEs: "Fe • Palabra • Poder",
  ctaEn: "Join us this Saturday",
  ctaEs: "Entra este sábado",
  headerButtonEn: "Watch Live",
  headerButtonEs: "En vivo",
  cardStyle: "text",
};

let cachedSettings = null;

function currentLanguage() {
  return localStorage.getItem("iattv_language") === "es" ? "es" : "en";
}

function formatFeatures(value) {
  if (!value) {
    return "";
  }
  if (value.includes("<span")) {
    return value;
  }
  return value
    .split("•")
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" <span>•</span> ");
}

function applyLiveLink(link, settings) {
  if (!link) {
    return;
  }

  if (settings.enabled === true && settings.liveUrl) {
    link.href = settings.liveUrl;
    link.target = "_blank";
    link.rel = "noopener";
    link.classList.remove("live-service-disabled");
    link.setAttribute("aria-disabled", "false");
    return;
  }

  link.href = "#";
  link.removeAttribute("target");
  link.removeAttribute("rel");
  link.classList.add("live-service-disabled");
  link.setAttribute("aria-disabled", "true");
}

function openLightbox(src, alt) {
  if (!lightbox || !lightboxImage || !src) {
    return;
  }
  lightboxImage.src = src;
  lightboxImage.alt = alt || "";
  lightbox.hidden = false;
  document.body.classList.add("flyer-lightbox-open");
}

function closeLightbox() {
  if (!lightbox) {
    return;
  }
  lightbox.hidden = true;
  document.body.classList.remove("flyer-lightbox-open");
}

function applyInvitation(settings) {
  if (!settings) {
    return;
  }

  const lang = currentLanguage();
  const title =
    lang === "es"
      ? settings.titleEs ||
        settings.title ||
        settings.serviceTitle ||
        DEFAULTS.titleEs
      : settings.titleEn || DEFAULTS.titleEn;
  const label =
    lang === "es"
      ? settings.inviteLabelEs || DEFAULTS.inviteLabelEs
      : settings.inviteLabelEn || DEFAULTS.inviteLabelEn;
  const day =
    lang === "es"
      ? settings.dayLineEs || DEFAULTS.dayLineEs
      : settings.dayLineEn || settings.serviceDay || DEFAULTS.dayLineEn;
  const features =
    lang === "es"
      ? settings.featuresEs || DEFAULTS.featuresEs
      : settings.featuresEn || DEFAULTS.featuresEn;
  const cta =
    lang === "es"
      ? settings.ctaEs || DEFAULTS.ctaEs
      : settings.ctaEn || DEFAULTS.ctaEn;
  const header =
    lang === "es"
      ? settings.headerButtonEs || DEFAULTS.headerButtonEs
      : settings.headerButtonEn || DEFAULTS.headerButtonEn;
  const time = `${settings.serviceTime || DEFAULTS.serviceTime} ${
    settings.timeZone || DEFAULTS.timeZone
  }`.trim();

  if (inviteLabelEl) inviteLabelEl.textContent = label;
  if (titleEl) titleEl.textContent = title;
  if (dayEl) dayEl.textContent = day;
  if (timeEl) timeEl.textContent = time;
  if (featuresEl) featuresEl.innerHTML = formatFeatures(features);
  if (cardLiveButton) cardLiveButton.textContent = cta;
  if (headerLiveButton) headerLiveButton.textContent = header;
  if (heroLiveButton) heroLiveButton.textContent = header;
  if (flyerLiveButton) flyerLiveButton.textContent = header;
  if (lightboxLive) lightboxLive.textContent = header;

  applyLiveLink(headerLiveButton, settings);
  applyLiveLink(heroLiveButton, settings);
  applyLiveLink(cardLiveButton, settings);
  applyLiveLink(flyerLiveButton, settings);
  applyLiveLink(lightboxLive, settings);

  const flyerUrl = settings.flyerUrl || "";
  const useFlyer = settings.cardStyle === "flyer" && flyerUrl;

  if (textModeEl) textModeEl.hidden = useFlyer;
  if (flyerModeEl) flyerModeEl.hidden = !useFlyer;

  if (flyerThumb && flyerUrl) {
    flyerThumb.src = flyerUrl;
    flyerThumb.alt = title;
  }
}

function watchLanguageSwitch() {
  document.querySelectorAll("[data-language]").forEach((button) => {
    button.addEventListener("click", () => {
      window.setTimeout(() => applyInvitation(cachedSettings || DEFAULTS), 0);
    });
  });
}

function watchFlyer() {
  if (flyerOpen) {
    flyerOpen.addEventListener("click", () => {
      const src = flyerThumb && flyerThumb.src;
      const alt = flyerThumb && flyerThumb.alt;
      openLightbox(src, alt);
    });
  }

  if (lightboxClose) {
    lightboxClose.addEventListener("click", closeLightbox);
  }

  if (lightbox) {
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeLightbox();
    }
  });
}

async function loadLiveService() {
  try {
    const settings = await getLiveServiceSettings();
    cachedSettings = settings || DEFAULTS;
    applyInvitation(cachedSettings);
  } catch (error) {
    console.error("Unable to load public live invitation:", error);
    applyInvitation(DEFAULTS);
  }
}

watchLanguageSwitch();
watchFlyer();
loadLiveService();