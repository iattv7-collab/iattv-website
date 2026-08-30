// ======================================================
// FILE: /js/services/firebase-config.js
// PROJECT: IATTV Website
// PURPOSE:
// Initializes Firebase services used by the IATTV website
// and administration system.
// ======================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
  getAuth,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
  getFirestore,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
  getFunctions,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-functions.js";

import {
  getStorage,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyB6ax5ywaI9ebpM_SZFkQyyGe8Cq6UPURg",
  authDomain: "iattv-jesus.firebaseapp.com",
  projectId: "iattv-jesus",
  storageBucket: "iattv-jesus.firebasestorage.app",
  messagingSenderId: "48797024634",
  appId: "1:48797024634:web:cd56d923df4b3ef6bc96c3",
  measurementId: "G-8QVGEZBKML",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);
const storage = getStorage(app);

export {
  app,
  auth,
  db,
  functions,
  storage,
};