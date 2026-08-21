// ======================================================
// FILE: /js/services/prayer-settings-service.js
// PROJECT: IATTV Website
// PURPOSE:
// Reads and saves administrator-controlled prayer-request
// delivery settings.
// ======================================================

import {
  db,
} from "/js/services/firebase-config.js";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


// ======================================================
// DOCUMENT
// ======================================================

const prayerSettingsRef =
  doc(
    db,
    "siteSettings",
    "prayerRequests",
  );


// ======================================================
// GET SETTINGS
// ======================================================

export async function getPrayerSettings() {
  const snapshot =
    await getDoc(prayerSettingsRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}


// ======================================================
// SAVE SETTINGS
// ======================================================

export async function savePrayerSettings(
  settings,
  adminUid,
) {
  await setDoc(
    prayerSettingsRef,
    {
      recipientEmail:
        String(
          settings.recipientEmail || "",
        ).trim(),

      updatedAt:
        serverTimestamp(),

      updatedBy:
        adminUid || "",
    },
    {
      merge: true,
    },
  );
}