// ======================================================
// FILE: /js/modules/live-service/public-live-service.js
// PROJECT: IATTV Website
// PURPOSE:
// Loads live-service settings from Firestore and applies
// them to the public IATTV homepage.
// ======================================================

import {
  getLiveServiceSettings,
} from "/js/services/live-service-service.js";

const headerLiveButton =
  document.querySelector(".button-live");

const heroLiveButton =
  document.querySelector(
    ".hero-buttons .button-secondary",
  );

const cardLiveButton =
  document.querySelector(".live-card-link");

const serviceDayEl =
  document.querySelector(".live-card h2");

const serviceTimeEl =
  document.querySelector(".live-time");


function applyLiveLink(link, settings) {
  if (!link) {
    return;
  }

  if (
    settings.enabled === true &&
    settings.liveUrl
  ) {
    link.href = settings.liveUrl;
    link.target = "_blank";
    link.rel = "noopener";

    link.classList.remove(
      "live-service-disabled",
    );

    link.setAttribute(
      "aria-disabled",
      "false",
    );

    return;
  }

  link.href = "#";
  link.removeAttribute("target");
  link.removeAttribute("rel");

  link.classList.add(
    "live-service-disabled",
  );

  link.setAttribute(
    "aria-disabled",
    "true",
  );
}


async function loadLiveService() {
  try {
    const settings =
      await getLiveServiceSettings();

    if (!settings) {
      return;
    }

    if (serviceDayEl) {
      serviceDayEl.textContent =
        settings.serviceDay ||
        "Every Sunday";
    }

    if (serviceTimeEl) {
      const time =
        settings.serviceTime || "";

      const zone =
        settings.timeZone || "";

      serviceTimeEl.textContent =
        `${time} ${zone}`.trim();
    }

    applyLiveLink(
      headerLiveButton,
      settings,
    );

    applyLiveLink(
      heroLiveButton,
      settings,
    );

    applyLiveLink(
      cardLiveButton,
      settings,
    );
  } catch (error) {
    console.error(
      "Unable to load public live-service settings:",
      error,
    );
  }
}


loadLiveService();