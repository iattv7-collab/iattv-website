// ======================================================
// FILE: /js/admin/dashboard.js
// PROJECT: IATTV Website
// PURPOSE:
// Protects the dashboard and shows only tiles allowed
// by the signed-in administrator role.
// ======================================================

import { requireAdmin, canAccess } from "/js/admin/admin-guard.js";
import { auth } from "/js/services/firebase-config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const loadingEl = document.getElementById("adminLoading");
const appEl = document.getElementById("adminApp");
const adminNameEl = document.getElementById("adminName");
const signOutButton = document.getElementById("signOutButton");

async function initializeDashboard() {
  const admin = await requireAdmin();
  if (!admin) return;

  if (adminNameEl) {
    adminNameEl.textContent = admin.displayName || admin.email || "Administrator";
  }

  document.querySelectorAll("[data-roles]").forEach((card) => {
    const allowed = card.dataset.roles.split(/\s+/).filter(Boolean);
    if (!canAccess(admin.role, allowed)) {
      card.hidden = true;
    }
  });

  if (loadingEl) loadingEl.hidden = true;
  if (appEl) appEl.hidden = false;
}

if (signOutButton) {
  signOutButton.addEventListener("click", async () => {
    await signOut(auth);
    window.location.replace("/admin/");
  });
}

initializeDashboard();