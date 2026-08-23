// ======================================================
// FILE: /js/services/giving-methods-service.js
// PROJECT: IATTV Website
// PURPOSE:
// Firestore data access for configurable IATTV
// giving / offering payment methods.
// ======================================================

import { db } from "/js/services/firebase-config.js";

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// ------------------------------------------------------
// COLLECTION
// ------------------------------------------------------

const METHODS_COLLECTION = collection(db, "givingMethods");

// ------------------------------------------------------
// GET ALL METHODS (ordered)
// ------------------------------------------------------

/**
 * Returns all giving methods ordered by the "order" field.
 * @return {Promise<Array>}
 */
export async function getGivingMethods() {
  const q = query(METHODS_COLLECTION, orderBy("order", "asc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

// ------------------------------------------------------
// GET ONLY ENABLED METHODS (for public page)
// ------------------------------------------------------

/**
 * Returns only enabled giving methods, ordered.
 * @return {Promise<Array>}
 */
export async function getEnabledGivingMethods() {
  const methods = await getGivingMethods();
  return methods.filter((method) => method.enabled === true);
}

// ------------------------------------------------------
// GET ONE METHOD
// ------------------------------------------------------

/**
 * Returns a single giving method by ID.
 * @param {string} methodId
 * @return {Promise<object|null>}
 */
export async function getGivingMethod(methodId) {
  if (!methodId) return null;

  const methodRef = doc(db, "givingMethods", methodId);
  const snapshot = await getDoc(methodRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

// ------------------------------------------------------
// SAVE / UPDATE METHOD
// ------------------------------------------------------

/**
 * Creates or updates a giving method.
 * @param {string|null} methodId  Existing ID or null for new
 * @param {object} data           Method data
 * @param {string} adminUid       Administrator UID
 * @return {Promise<string>}      The document ID
 */
export async function saveGivingMethod(methodId, data, adminUid) {
  const id = methodId || doc(METHODS_COLLECTION).id;
  const methodRef = doc(db, "givingMethods", id);

  await setDoc(
    methodRef,
    {
      name: String(data.name || "").trim(),
      label: String(data.label || "").trim(),
      description: String(data.description || "").trim(),
      url: String(data.url || "").trim(),
      enabled: Boolean(data.enabled),
      order: Number(data.order) || 0,
      openExternal: data.openExternal !== false,
      updatedAt: serverTimestamp(),
      updatedBy: adminUid || "",
    },
    { merge: true },
  );

  return id;
}

// ------------------------------------------------------
// DELETE METHOD
// ------------------------------------------------------

/**
 * Permanently deletes a giving method.
 * @param {string} methodId
 * @return {Promise<void>}
 */
export async function deleteGivingMethod(methodId) {
  if (!methodId) return;

  const methodRef = doc(db, "givingMethods", methodId);
  await deleteDoc(methodRef);
}