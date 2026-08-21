// ======================================================
// FILE: /js/services/live-service-service.js
// PROJECT: IATTV Website
// PURPOSE:
// Firestore data access for IATTV live-service settings.
// ======================================================

import { db } from "/js/services/firebase-config.js";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const LIVE_SERVICE_DOC =
  doc(db, "siteSettings", "liveService");

export async function getLiveServiceSettings() {
  const snapshot =
    await getDoc(LIVE_SERVICE_DOC);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data();
}

export async function saveLiveServiceSettings(
  settings,
  adminUid,
) {
  await setDoc(
    LIVE_SERVICE_DOC,
    {
      ...settings,
      updatedAt: serverTimestamp(),
      updatedBy: adminUid,
    },
    {
      merge: true,
    },
  );
}