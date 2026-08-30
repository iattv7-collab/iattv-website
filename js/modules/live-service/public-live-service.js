// ======================================================
// FILE: /js/modules/live-service/public-live-service.js
// PROJECT: IATTV Website
// PURPOSE:
// Loads the editable invitation card from Firestore
// and applies English / Spanish copy.
// ======================================================

import { getLiveServiceSettings } from "/js/services/live-service-service.js";

const headerLiveButton = document.querySelector(".button-live");
const heroLiveButton = document.querySelector(
  ".hero-buttons .button-secondary",
);
const cardLiveButton = document.querySelector(".live-card-link");
const inviteLabelEl = document.querySelector(
  "[data-live='inviteLabel'], .live-label",
);
const titleEl = document.querySelector("[data-live='title'], .live-card h2");
const dayEl = document.querySelector("[data-live='day'], .live-day");
const timeEl = document.querySelector("[data-live='time'], .live-time");
const featuresEl = document.querySelector(
  "[data-live='features'], .live-features",
);

const DEFAULTS = {
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

function applyInvitation(settings) {
  if (!settings) {
    return;
  }

  const lang = currentLanguage();
  const title = settings.title || settings.serviceTitle || DEFAULTS.title;
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

  applyLiveLink(headerLiveButton, settings);
  applyLiveLink(heroLiveButton, settings);
  applyLiveLink(cardLiveButton, settings);
}

function watchLanguageSwitch() {
  document.querySelectorAll("[data-language]").forEach((button) => {
    button.addEventListener("click", () => {
      window.setTimeout(() => applyInvitation(cachedSettings || DEFAULTS), 0);
    });
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
loadLiveService();