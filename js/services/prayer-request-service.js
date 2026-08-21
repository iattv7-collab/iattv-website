// ======================================================
// FILE: /js/services/prayer-request-service.js
// PROJECT: IATTV Website
// PURPOSE:
// Sends new public prayer requests through the secure
// Firebase Cloud Function and manages legacy Firestore
// prayer requests for administrators.
// ======================================================

import {
  db,
  functions,
} from "/js/services/firebase-config.js";

import {
  deleteDoc,
  doc,
  getDocs,
  collection,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
  httpsCallable,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-functions.js";


const COLLECTION_NAME =
  "prayerRequests";


// ======================================================
// CREATE / SEND BY EMAIL
// ======================================================

export async function submitPrayerRequest(data) {
  const sendPrayerRequest =
    httpsCallable(
      functions,
      "sendPrayerRequest",
    );

  const result =
    await sendPrayerRequest({
      name:
        String(
          data.name || "",
        ).trim(),

      email:
        String(
          data.email || "",
        ).trim(),

      phone:
        String(
          data.phone || "",
        ).trim(),

      request:
        String(
          data.request || "",
        ).trim(),

      confidential:
        data.confidential === true,
    });


  if (
    result?.data?.success !== true
  ) {
    throw new Error(
      "Prayer request was not sent.",
    );
  }


  return result.data;
}


// ======================================================
// READ LEGACY REQUESTS
// ======================================================

export async function getPrayerRequests() {
  const prayerQuery =
    query(
      collection(
        db,
        COLLECTION_NAME,
      ),
      orderBy(
        "createdAt",
        "desc",
      ),
    );


  const snapshot =
    await getDocs(
      prayerQuery,
    );


  return snapshot.docs.map(
    (item) => ({
      id: item.id,
      ...item.data(),
    }),
  );
}


// ======================================================
// UPDATE LEGACY REQUEST STATUS
// ======================================================

export async function updatePrayerRequestStatus(
  requestId,
  status,
  adminUid,
) {
  await updateDoc(
    doc(
      db,
      COLLECTION_NAME,
      requestId,
    ),
    {
      status,

      updatedAt:
        serverTimestamp(),

      updatedBy:
        adminUid,
    },
  );
}


// ======================================================
// DELETE LEGACY REQUEST
// ======================================================

export async function deletePrayerRequest(
  requestId,
) {
  await deleteDoc(
    doc(
      db,
      COLLECTION_NAME,
      requestId,
    ),
  );
}