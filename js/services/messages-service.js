// ======================================================
// FILE: /js/services/messages-service.js
// PROJECT: IATTV Website
// PURPOSE:
// Firestore data access for published IATTV messages.
// ======================================================

import { db } from "/js/services/firebase-config.js";

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

export async function getLatestPublishedMessages(maxResults = 4) {
  const messagesQuery = query(
    collection(db, "messages"),
    where("published", "==", true),
    orderBy("messageDate", "desc"),
    limit(maxResults),
  );

  const snapshot = await getDocs(messagesQuery);

  return snapshot.docs.map((messageDoc) => ({
    id: messageDoc.id,
    ...messageDoc.data(),
  }));
}