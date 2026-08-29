// ======================================================
// FILE: /js/admin/admin-login.js
// PROJECT: IATTV Website
// PURPOSE:
// Handles Firebase Authentication for the IATTV
// administration login page.
// ======================================================

import { auth } from "/js/services/firebase-config.js";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const loginForm = document.getElementById("adminLoginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton");
const forgotPasswordButton = document.getElementById("forgotPasswordButton");
const loginMessage = document.getElementById("loginMessage");

function setMessage(message = "", type = "") {
  loginMessage.textContent = message;
  loginMessage.className = "login-message";
  if (type) loginMessage.classList.add(type);
}

function setLoading(isLoading) {
  loginButton.disabled = isLoading;
  loginButton.textContent = isLoading ? "Signing In..." : "Sign In";
}

function friendlyAuthError(errorCode) {
  switch (errorCode) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Email or password is incorrect.";
    case "auth/too-many-requests":
      return "Too many sign-in attempts. Please try again later.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    default:
      return "Unable to sign in. Please try again.";
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  setMessage();

  if (!email || !password) {
    setMessage("Enter your email and password.", "error");
    return;
  }

  setLoading(true);

  try {
    await signInWithEmailAndPassword(auth, email, password);
    setMessage("Sign-in successful.", "success");
    window.location.href = "/admin/dashboard.html";
  } catch (error) {
    console.error("IATTV admin sign-in error:", error);
    setMessage(friendlyAuthError(error.code), "error");
  } finally {
    setLoading(false);
  }
});

forgotPasswordButton.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  if (!email) {
    setMessage("Enter your email first.", "error");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    setMessage("Password reset email sent.", "success");
  } catch (error) {
    console.error("IATTV password reset error:", error);
    setMessage("Unable to send reset email.", "error");
  }
});

onAuthStateChanged(auth, (user) => {
  if (!user) return;
  window.location.replace("/admin/dashboard.html");
});