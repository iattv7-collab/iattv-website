// ======================================================
// FILE: /js/admin/admin-guard.js
// PROJECT: IATTV Website
// PURPOSE:
// Provides reusable authorization for protected IATTV
// administration pages, including multi-module roles.
// ======================================================

import { auth, db } from "/js/services/firebase-config.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const VALID_ROLES = [
  "admin",
  "full",
  "content",
  "media",
  "prayer",
  "giving",
  "accountant",
];

const FULL_ROLES = ["admin", "full"];

function waitForAuth() {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, resolve, reject);
  });
}

function normalizeRole(role) {
  const value = String(role || "").trim().toLowerCase();
  return VALID_ROLES.includes(value) ? value : "";
}

function rolesOf(adminOrRole) {
  if (typeof adminOrRole === "string" || !adminOrRole) {
    const one = normalizeRole(adminOrRole);
    return one ? [one] : [];
  }

  const list = [];
  const one = normalizeRole(adminOrRole.role);
  if (one) list.push(one);
  if (Array.isArray(adminOrRole.roles)) {
    adminOrRole.roles.forEach((item) => {
      const role = normalizeRole(item);
      if (role && list.indexOf(role) === -1) list.push(role);
    });
  }
  return list;
}

function isFullRole(adminOrRole) {
  return rolesOf(adminOrRole).some((role) => FULL_ROLES.indexOf(role) !== -1);
}

function canAccess(adminOrRole, allowedRoles) {
  const current = rolesOf(adminOrRole);
  if (!current.length) return false;
  if (!allowedRoles || !allowedRoles.length) return true;
  if (isFullRole(adminOrRole)) return true;
  const allowed = allowedRoles.map((item) => String(item).toLowerCase());
  return current.some((role) => allowed.indexOf(role) !== -1);
}

async function getAdminRecord(user) {
  if (!user || !user.uid) return null;
  const adminSnapshot = await getDoc(doc(db, "admins", user.uid));
  if (!adminSnapshot.exists()) return null;
  const adminData = adminSnapshot.data() || {};
  const roles = rolesOf(adminData);
  if (adminData.active !== true || !roles.length) return null;
  return {
    uid: user.uid,
    email: user.email || "",
    ...adminData,
    role: roles[0],
    roles: roles,
  };
}

async function denyAccess() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Unable to sign out unauthorized user:", error);
  }
  window.location.replace("/admin/");
}

async function requireAdmin(allowedRoles) {
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
    if (!canAccess(admin, allowedRoles)) {
      window.location.replace("/admin/dashboard.html");
      return null;
    }
    return admin;
  } catch (error) {
    console.error("IATTV admin authorization error:", error);
    await denyAccess();
    return null;
  }
}

export { requireAdmin, canAccess, isFullRole, rolesOf, VALID_ROLES };