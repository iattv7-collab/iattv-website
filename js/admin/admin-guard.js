// ======================================================
// FILE: /js/admin/admin-guard.js
// PROJECT: IATTV Website
// PURPOSE:
// Provides reusable authorization for protected IATTV
// administration pages.
// ======================================================

import {
  auth,
  db,
} from "/js/services/firebase-config.js";

import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// ------------------------------------------------------
// Wait For Firebase Authentication
// ------------------------------------------------------

function waitForAuth() {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(
      auth,
      (user) => {
        resolve(user);
      },
      (error) => {
        reject(error);
      },
    );
  });
}

// ------------------------------------------------------
// Read Administrator Record
// ------------------------------------------------------

async function getAdminRecord(user) {
  if (!user?.uid) {
    return null;
  }

  const adminRef = doc(
    db,
    "admins",
    user.uid,
  );

  const adminSnapshot = await getDoc(adminRef);

  if (!adminSnapshot.exists()) {
    return null;
  }

  const adminData = adminSnapshot.data();

  if (
    adminData.active !== true ||
    adminData.role !== "admin"
  ) {
    return null;
  }

  return {
    uid: user.uid,
    email: user.email || "",
    ...adminData,
  };
}

// ------------------------------------------------------
// Deny Access
// ------------------------------------------------------

async function denyAccess() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error(
      "Unable to sign out unauthorized user:",
      error,
    );
  }

  window.location.replace("/admin/");
}

// ------------------------------------------------------
// Require Administrator
// ------------------------------------------------------

async function requireAdmin() {
  try {
    const user = await waitForAuth();

    if (!user) {
      window.location.replace("/admin/");
      return null;
    }

    const admin = await getAdminRecord(user);

    if (!admin) {
      await denyAccess();
      return null;
    }

    return admin;
  } catch (error) {
    console.error(
      "IATTV admin authorization error:",
      error,
    );

    await denyAccess();

    return null;
  }
}

export {
  requireAdmin,
};