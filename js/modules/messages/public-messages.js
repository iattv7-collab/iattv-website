// ======================================================
// FILE: /js/modules/messages/public-messages.js
// PROJECT: IATTV Website
// PURPOSE:
// Renders published Firestore messages on the homepage.
// ======================================================

import {
  getLatestPublishedMessages,
} from "/js/services/messages-service.js";

const grid = document.getElementById("latestMessagesGrid");

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

function getLanguage() {
  return localStorage.getItem("iattv_language") || "en";
}

function messageTitle(message, language) {
  if (language === "es") {
    return message.titleEs || message.titleEn || "";
  }

  return message.titleEn || message.titleEs || "";
}

function renderMessages(messages) {
  if (!grid || !messages.length) {
    return;
  }

  const language = getLanguage();

  grid.innerHTML = messages
    .map((message) => {
      const title = messageTitle(message, language);

      return `
        <article class="message-card">

          <a
            href="${escapeHtml(message.youtubeUrl)}"
            target="_blank"
            rel="noopener"
            class="message-image"
            style="
              background-image:
                url('${escapeHtml(message.thumbnailUrl)}');
            "
          >
            <span class="play-button">▶</span>
          </a>

          <div class="message-content">

            <p class="message-reference">
              ${escapeHtml(message.scripture)}
            </p>

            <h3>
              ${escapeHtml(title)}
            </h3>

            <a
              href="${escapeHtml(message.youtubeUrl)}"
              target="_blank"
              rel="noopener"
            >
              ${
                language === "es"
                  ? "Ver Mensaje →"
                  : "Watch Message →"
              }
            </a>

          </div>

        </article>
      `;
    })
    .join("");
}

async function loadMessages() {
  if (!grid) {
    return;
  }

  try {
    const messages =
      await getLatestPublishedMessages(4);

    renderMessages(messages);
  } catch (error) {
    console.error(
      "Unable to load public IATTV messages:",
      error,
    );
  }
}

loadMessages();