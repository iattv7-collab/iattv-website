// ======================================================
// FILE: /js/admin/messages-admin.js
// PROJECT: IATTV Website
// PURPOSE:
// Manages creation, editing, publishing and deletion
// of IATTV ministry messages stored in Firestore.
// ======================================================

import { auth, db } from "/js/services/firebase-config.js";

import { requireAdmin } from "/js/admin/admin-guard.js";

import { signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// ======================================================
// ELEMENTS
// ======================================================

const loadingEl = document.getElementById("adminLoading");

const appEl = document.getElementById("adminApp");

const adminNameEl = document.getElementById("adminName");

const signOutButton = document.getElementById("signOutButton");

const messageForm = document.getElementById("messageForm");

const messageIdInput = document.getElementById("messageId");

const youtubeUrlInput = document.getElementById("youtubeUrl");

const titleEnInput = document.getElementById("titleEn");

const titleEsInput = document.getElementById("titleEs");

const scriptureEnInput = document.getElementById("scriptureEn");

const messageDateInput = document.getElementById("messageDate");

const descriptionEnInput = document.getElementById("descriptionEn");

const descriptionEsInput = document.getElementById("descriptionEs");

const publishedInput = document.getElementById("published");

const saveMessageButton = document.getElementById("saveMessageButton");

const cancelEditButton = document.getElementById("cancelEditButton");

const formTitle = document.getElementById("formTitle");

const messageFormStatus = document.getElementById("messageFormStatus");

const messagesLoading = document.getElementById("messagesLoading");

const messagesEmpty = document.getElementById("messagesEmpty");

const messagesList = document.getElementById("messagesList");

// ======================================================
// STATE
// ======================================================

let currentAdmin = null;

let messageCache = [];

// ======================================================
// HELPERS
// ======================================================

function clean(value) {
  return String(value || "").trim();
}

function setStatus(message = "", type = "") {
  messageFormStatus.textContent = message;

  messageFormStatus.className = "login-message";

  if (type) {
    messageFormStatus.classList.add(type);
  }
}

function escapeHtml(value) {
  return String(value || "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character],
  );
}

function extractYouTubeId(url) {
  const value = clean(url);

  if (!value) {
    return "";
  }

  try {
    const parsedUrl = new URL(value);

    if (parsedUrl.hostname === "youtu.be") {
      return parsedUrl.pathname.replace("/", "").split("?")[0];
    }

    if (parsedUrl.hostname.includes("youtube.com")) {
      if (parsedUrl.pathname === "/watch") {
        return parsedUrl.searchParams.get("v") || "";
      }

      if (parsedUrl.pathname.startsWith("/shorts/")) {
        return parsedUrl.pathname.split("/")[2] || "";
      }

      if (parsedUrl.pathname.startsWith("/embed/")) {
        return parsedUrl.pathname.split("/")[2] || "";
      }
    }
  } catch {
    return "";
  }

  return "";
}

function youtubeThumbnail(videoId) {
  if (!videoId) {
    return "";
  }

  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

function resetForm() {
  messageForm.reset();

  messageIdInput.value = "";

  publishedInput.checked = true;

  formTitle.textContent = "Add Message";

  saveMessageButton.textContent = "Publish Message";

  cancelEditButton.hidden = true;

  setStatus();
}

// ======================================================
// LOAD MESSAGES
// ======================================================

async function loadMessages() {
  messagesLoading.hidden = false;
  messagesEmpty.hidden = true;
  messagesList.innerHTML = "";

  try {
    const messagesQuery = query(
      collection(db, "messages"),
      orderBy("messageDate", "desc"),
    );

    const snapshot = await getDocs(messagesQuery);

    messageCache = snapshot.docs.map((messageDoc) => ({
      id: messageDoc.id,
      ...messageDoc.data(),
    }));

    renderMessages();
  } catch (error) {
    console.error("Unable to load IATTV messages:", error);

    messagesLoading.textContent = "Unable to load messages.";
  }
}

// ======================================================
// RENDER MESSAGES
// ======================================================

function renderMessages() {
  messagesLoading.hidden = true;

  if (!messageCache.length) {
    messagesEmpty.hidden = false;
    return;
  }

  messagesEmpty.hidden = true;

  messagesList.innerHTML = messageCache
    .map((message) => {
      const thumbnail =
        message.thumbnailUrl || youtubeThumbnail(message.youtubeId);

      const status = message.published === true ? "Published" : "Unpublished";

      const statusClass =
        message.published === true ? "published" : "unpublished";

      return `
        <article class="admin-message-item">

          <div class="admin-message-thumbnail">

            ${
              thumbnail
                ? `
                  <img
                    src="${escapeHtml(thumbnail)}"
                    alt=""
                  >
                `
                : `
                  <div class="admin-message-no-image">
                    No thumbnail
                  </div>
                `
            }

          </div>


          <div class="admin-message-info">

            <div class="admin-message-meta">

              <span class="admin-message-status ${statusClass}">
                ${status}
              </span>

              <span>
                ${escapeHtml(message.messageDate || "")}
              </span>

            </div>

            <h3>
              ${escapeHtml(message.titleEn || "")}
            </h3>

            <p class="admin-message-spanish-title">
              ${escapeHtml(message.titleEs || "")}
            </p>

            <p>
              ${escapeHtml(message.scripture || "")}
            </p>

          </div>


          <div class="admin-message-actions">

            <button
              type="button"
              data-edit-message="${message.id}"
            >
              Edit
            </button>

            <button
              type="button"
              class="danger"
              data-delete-message="${message.id}"
            >
              Delete
            </button>

          </div>

        </article>
      `;
    })
    .join("");

  bindMessageActions();
}

// ======================================================
// EDIT MESSAGE
// ======================================================

function editMessage(messageId) {
  const message = messageCache.find((item) => item.id === messageId);

  if (!message) {
    return;
  }

  messageIdInput.value = message.id;

  youtubeUrlInput.value = message.youtubeUrl || "";

  titleEnInput.value = message.titleEn || "";

  titleEsInput.value = message.titleEs || "";

  scriptureEnInput.value = message.scripture || "";

  messageDateInput.value = message.messageDate || "";

  descriptionEnInput.value = message.descriptionEn || "";

  descriptionEsInput.value = message.descriptionEs || "";

  publishedInput.checked = message.published === true;

  formTitle.textContent = "Edit Message";

  saveMessageButton.textContent = "Save Changes";

  cancelEditButton.hidden = false;

  setStatus();

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

// ======================================================
// DELETE MESSAGE
// ======================================================

async function deleteMessage(messageId) {
  const message = messageCache.find((item) => item.id === messageId);

  if (!message) {
    return;
  }

  const firstConfirmed = window.confirm(`Delete "${message.titleEn}"?`);

  if (!firstConfirmed) {
    return;
  }

  const finalConfirmed = window.confirm(
    `FINAL CONFIRMATION:\n\nPermanently delete "${message.titleEn}"?\n\nThis cannot be undone.`,
  );

  if (!finalConfirmed) {
    return;
  }

  try {
    await deleteDoc(doc(db, "messages", messageId));

    await loadMessages();
  } catch (error) {
    console.error("Unable to delete message:", error);

    window.alert("Unable to delete the message.");
  }
}

// ======================================================
// MESSAGE ACTION BUTTONS
// ======================================================

function bindMessageActions() {
  document.querySelectorAll("[data-edit-message]").forEach((button) => {
    button.addEventListener("click", () => {
      editMessage(button.dataset.editMessage);
    });
  });

  document.querySelectorAll("[data-delete-message]").forEach((button) => {
    button.addEventListener("click", () => {
      deleteMessage(button.dataset.deleteMessage);
    });
  });
}

// ======================================================
// SAVE MESSAGE
// ======================================================

messageForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  setStatus();

  const youtubeUrl = clean(youtubeUrlInput.value);

  const youtubeId = extractYouTubeId(youtubeUrl);

  if (!youtubeId) {
    setStatus("Enter a valid YouTube video URL.", "error");

    return;
  }

  const messageData = {
    youtubeUrl,
    youtubeId,

    thumbnailUrl: youtubeThumbnail(youtubeId),

    titleEn: clean(titleEnInput.value),

    titleEs: clean(titleEsInput.value),

    scripture: clean(scriptureEnInput.value),

    messageDate: messageDateInput.value,

    descriptionEn: clean(descriptionEnInput.value),

    descriptionEs: clean(descriptionEsInput.value),

    published: publishedInput.checked,

    updatedAt: serverTimestamp(),

    updatedBy: currentAdmin.uid,
  };

  saveMessageButton.disabled = true;

  try {
    const messageId = clean(messageIdInput.value);

    if (messageId) {
      await updateDoc(doc(db, "messages", messageId), messageData);

      setStatus("Message updated successfully.", "success");
    } else {
      await addDoc(collection(db, "messages"), {
        ...messageData,

        createdAt: serverTimestamp(),

        createdBy: currentAdmin.uid,
      });

      setStatus("Message published successfully.", "success");
    }

    resetForm();

    await loadMessages();
  } catch (error) {
    console.error("Unable to save message:", error);

    setStatus("Unable to save the message.", "error");
  } finally {
    saveMessageButton.disabled = false;
  }
});

// ======================================================
// CANCEL EDIT
// ======================================================

cancelEditButton.addEventListener("click", () => {
  resetForm();
});

// ======================================================
// SIGN OUT
// ======================================================

signOutButton.addEventListener("click", async () => {
  try {
    await signOut(auth);

    window.location.replace("/admin/");
  } catch (error) {
    console.error("Unable to sign out:", error);
  }
});

// ======================================================
// INITIALIZE PAGE
// ======================================================

async function initializeMessagesPage() {
  currentAdmin = await requireAdmin();

  if (!currentAdmin) {
    return;
  }

  adminNameEl.textContent =
    currentAdmin.displayName || currentAdmin.email || "Administrator";

  loadingEl.hidden = true;
  appEl.hidden = false;

  await loadMessages();
}

initializeMessagesPage();
