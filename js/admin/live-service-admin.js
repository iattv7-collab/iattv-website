// ======================================================
// FILE: /js/admin/live-service-admin.js
// PROJECT: IATTV Website
// PURPOSE:
// Edit the public live invitation card in Firestore.
// Upload or paste a flyer. Switch text / flyer.
// Remove flyer deletes the file from Storage.
// ======================================================

import { auth, storage } from "/js/services/firebase-config.js";
import { requireAdmin } from "/js/admin/admin-guard.js";
import {
  getLiveServiceSettings,
  saveLiveServiceSettings,
} from "/js/services/live-service-service.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";

const loadingEl = document.getElementById("adminLoading");
const appEl = document.getElementById("adminApp");
const adminNameEl = document.getElementById("adminName");
const signOutButton = document.getElementById("signOutButton");
const form = document.getElementById("liveServiceForm");
const saveButton = document.getElementById("saveButton");
const formStatus = document.getElementById("formStatus");
const savedPreview = document.getElementById("savedPreview");
const savedPreviewContent = document.getElementById("savedPreviewContent");
const flyerFileInput = document.getElementById("flyerFile");
const flyerPreview = document.getElementById("flyerPreview");
const flyerPicker = document.getElementById("flyerPicker");
const removeFlyerButton = document.getElementById("removeFlyerButton");
const cardStyleText = document.getElementById("cardStyleText");
const cardStyleFlyer = document.getElementById("cardStyleFlyer");

const fields = {
  enabled: document.getElementById("enabled"),
  titleEn: document.getElementById("titleEn"),
  titleEs: document.getElementById("titleEs"),
  inviteLabelEn: document.getElementById("inviteLabelEn"),
  inviteLabelEs: document.getElementById("inviteLabelEs"),
  dayLineEn: document.getElementById("dayLineEn"),
  dayLineEs: document.getElementById("dayLineEs"),
  serviceTime: document.getElementById("serviceTime"),
  timeZone: document.getElementById("timeZone"),
  featuresEn: document.getElementById("featuresEn"),
  featuresEs: document.getElementById("featuresEs"),
  ctaEn: document.getElementById("ctaEn"),
  ctaEs: document.getElementById("ctaEs"),
  headerButtonEn: document.getElementById("headerButtonEn"),
  headerButtonEs: document.getElementById("headerButtonEs"),
  liveUrl: document.getElementById("liveUrl"),
  note: document.getElementById("note"),
};

let currentAdmin = null;
let savedSettings = null;
let pendingFlyerFile = null;
let currentFlyerUrl = "";
let currentFlyerPath = "";

function clean(value) {
  return String(value || "").trim();
}

function selectedCardStyle() {
  return cardStyleFlyer && cardStyleFlyer.checked ? "flyer" : "text";
}

function setStatus(message = "", type = "") {
  formStatus.textContent = message;
  formStatus.className = "login-message";
  if (type) {
    formStatus.classList.add(type);
  }
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]);
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function showFlyerPreview(src) {
  if (!flyerPreview || !src) {
    return;
  }
  flyerPreview.src = src;
  flyerPreview.hidden = false;
}

function hideFlyerPreview() {
  if (flyerPreview) {
    flyerPreview.removeAttribute("src");
    flyerPreview.hidden = true;
  }
}

function acceptFlyerFile(file) {
  if (!file || !file.type || !file.type.startsWith("image/")) {
    setStatus("Please choose an image file.", "error");
    return;
  }
  pendingFlyerFile = file;
  showFlyerPreview(URL.createObjectURL(file));
  setStatus("Flyer ready. Save invitation to publish it.");
  updateSaveState();
}

function getFormData() {
  const titleEn = clean(fields.titleEn.value);
  const titleEs = clean(fields.titleEs.value);

  return {
    enabled: fields.enabled.checked,
    cardStyle: selectedCardStyle(),
    flyerUrl: currentFlyerUrl,
    flyerPath: currentFlyerPath,
    titleEn,
    titleEs,
    title: titleEs || titleEn,
    inviteLabelEn: clean(fields.inviteLabelEn.value),
    inviteLabelEs: clean(fields.inviteLabelEs.value),
    dayLineEn: clean(fields.dayLineEn.value),
    dayLineEs: clean(fields.dayLineEs.value),
    serviceTime: clean(fields.serviceTime.value),
    timeZone: clean(fields.timeZone.value),
    featuresEn: clean(fields.featuresEn.value),
    featuresEs: clean(fields.featuresEs.value),
    ctaEn: clean(fields.ctaEn.value),
    ctaEs: clean(fields.ctaEs.value),
    headerButtonEn: clean(fields.headerButtonEn.value),
    headerButtonEs: clean(fields.headerButtonEs.value),
    liveUrl: clean(fields.liveUrl.value),
    note: clean(fields.note.value),
    serviceTitle: titleEs || titleEn,
    serviceDay: clean(fields.dayLineEn.value),
  };
}

function validateForm() {
  const settings = getFormData();
  const required = [
    "titleEn",
    "titleEs",
    "inviteLabelEn",
    "inviteLabelEs",
    "dayLineEn",
    "dayLineEs",
    "serviceTime",
    "timeZone",
    "featuresEn",
    "featuresEs",
    "ctaEn",
    "ctaEs",
    "headerButtonEn",
    "headerButtonEs",
  ];

  const filled = required.every((key) => settings[key].length > 0);
  const flyerOk =
    settings.cardStyle !== "flyer" ||
    pendingFlyerFile !== null ||
    currentFlyerUrl.length > 0;
  const isValid = filled && isValidUrl(settings.liveUrl) && flyerOk;
  saveButton.disabled = !isValid;
  return isValid;
}

function sameSettings(a, b) {
  if (!a || !b) {
    return false;
  }
  return JSON.stringify(a) === JSON.stringify(b) && !pendingFlyerFile;
}

function updateSaveState() {
  if (!validateForm()) {
    return;
  }
  saveButton.disabled = sameSettings(getFormData(), savedSettings);
}

function fillForm(settings) {
  fields.enabled.checked = settings.enabled === true;
  if (settings.cardStyle === "flyer") {
    cardStyleFlyer.checked = true;
  } else {
    cardStyleText.checked = true;
  }
  currentFlyerUrl = settings.flyerUrl || "";
  currentFlyerPath = settings.flyerPath || "";
  if (currentFlyerUrl) {
    showFlyerPreview(currentFlyerUrl);
  } else {
    hideFlyerPreview();
  }
  fields.titleEn.value =
    settings.titleEn || "Saturdays of Wonders and Miracles";
  fields.titleEs.value =
    settings.titleEs || settings.title || settings.serviceTitle || "";
  fields.inviteLabelEn.value = settings.inviteLabelEn || "You’re Invited";
  fields.inviteLabelEs.value = settings.inviteLabelEs || "Estás invitado";
  fields.dayLineEn.value = settings.dayLineEn || settings.serviceDay || "";
  fields.dayLineEs.value = settings.dayLineEs || "";
  fields.serviceTime.value = settings.serviceTime || "";
  fields.timeZone.value = settings.timeZone || "";
  fields.featuresEn.value = settings.featuresEn || "";
  fields.featuresEs.value = settings.featuresEs || "";
  fields.ctaEn.value = settings.ctaEn || "";
  fields.ctaEs.value = settings.ctaEs || "";
  fields.headerButtonEn.value = settings.headerButtonEn || "Watch Live";
  fields.headerButtonEs.value = settings.headerButtonEs || "En vivo";
  fields.liveUrl.value = settings.liveUrl || "";
  fields.note.value = settings.note || "";
}

function renderPreview(settings) {
  if (!settings) {
    savedPreview.hidden = true;
    return;
  }

  savedPreviewContent.innerHTML = `
    <p><strong>Card:</strong> ${settings.cardStyle === "flyer" ? "Flyer" : "Text invitation"}</p>
    <p><strong>Status:</strong> ${settings.enabled ? "Live link on" : "Live link off"}</p>
    <p><strong>Title EN:</strong> ${escapeHtml(settings.titleEn)}</p>
    <p><strong>Title ES:</strong> ${escapeHtml(settings.titleEs)}</p>
    <p><strong>When:</strong> ${escapeHtml(settings.serviceTime)} ${escapeHtml(settings.timeZone)}</p>
    <p>
      <strong>Live link:</strong>
      <a href="${escapeHtml(settings.liveUrl)}" target="_blank" rel="noopener">Open</a>
    </p>
  `;
  savedPreview.hidden = false;
}

async function uploadFlyer(file) {
  const safeName = file.name.replace(/[^\w.\-]+/g, "-") || "flyer.jpg";
  const path = `live-invitation/flyer-${Date.now()}-${safeName}`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file, { contentType: file.type || "image/jpeg" });
  const url = await getDownloadURL(fileRef);
  return { url, path };
}

async function loadSettings() {
  try {
    const settings = await getLiveServiceSettings();
    if (!settings) {
      validateForm();
      return;
    }
    fillForm(settings);
    savedSettings = getFormData();
    renderPreview(savedSettings);
    updateSaveState();
  } catch (error) {
    console.error("Unable to load live invitation settings:", error);
    setStatus("Unable to load current settings.", "error");
  }
}

if (flyerFileInput) {
  flyerFileInput.addEventListener("change", () => {
    const file = flyerFileInput.files && flyerFileInput.files[0];
    if (file) {
      acceptFlyerFile(file);
    }
  });
}

if (flyerPicker) {
  flyerPicker.addEventListener("paste", (event) => {
    const items = event.clipboardData && event.clipboardData.items;
    if (!items) {
      return;
    }
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        event.preventDefault();
        acceptFlyerFile(item.getAsFile());
        break;
      }
    }
  });
}

if (removeFlyerButton) {
  removeFlyerButton.addEventListener("click", async () => {
    setStatus("Removing flyer...");
    try {
      if (currentFlyerPath) {
        await deleteObject(ref(storage, currentFlyerPath));
      }
    } catch (error) {
      console.error("Unable to delete flyer file:", error);
    }

    pendingFlyerFile = null;
    currentFlyerUrl = "";
    currentFlyerPath = "";
    hideFlyerPreview();
    if (flyerFileInput) flyerFileInput.value = "";
    cardStyleText.checked = true;

    try {
      const settings = getFormData();
      await saveLiveServiceSettings(settings, currentAdmin.uid);
      savedSettings = { ...settings };
      renderPreview(savedSettings);
      setStatus("Flyer removed. Homepage is back to the text invitation.", "success");
      updateSaveState();
    } catch (error) {
      console.error("Unable to save after removing flyer:", error);
      setStatus("Flyer file may be gone, but settings did not save.", "error");
    }
  });
}

form.addEventListener("input", () => {
  setStatus();
  updateSaveState();
});

form.addEventListener("change", () => {
  setStatus();
  updateSaveState();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus();

  if (!validateForm()) {
    setStatus("Complete every field, add a live URL, and add a flyer if Flyer is selected.", "error");
    return;
  }

  saveButton.disabled = true;

  try {
    if (pendingFlyerFile) {
      setStatus("Uploading flyer...");
      if (currentFlyerPath) {
        try {
          await deleteObject(ref(storage, currentFlyerPath));
        } catch (error) {
          console.error("Unable to delete previous flyer:", error);
        }
      }
      const uploaded = await uploadFlyer(pendingFlyerFile);
      currentFlyerUrl = uploaded.url;
      currentFlyerPath = uploaded.path;
      pendingFlyerFile = null;
    }

    const settings = getFormData();
    await saveLiveServiceSettings(settings, currentAdmin.uid);
    savedSettings = { ...settings };
    renderPreview(savedSettings);
    setStatus("Invitation saved. Refresh the public homepage to see it.", "success");
    updateSaveState();
  } catch (error) {
    console.error("Unable to save live invitation settings:", error);
    setStatus("Unable to save. If this is the first flyer upload, finish Storage setup first.", "error");
    updateSaveState();
  }
});

signOutButton.addEventListener("click", async () => {
  await signOut(auth);
  window.location.replace("/admin/");
});

async function initializePage() {
  currentAdmin = await requireAdmin();
  if (!currentAdmin) {
    return;
  }

  adminNameEl.textContent =
    currentAdmin.displayName || currentAdmin.email || "Administrator";

  loadingEl.hidden = true;
  appEl.hidden = false;
  await loadSettings();
}

initializePage();