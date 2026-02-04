import { loadState, saveState, defaultState } from "./storage.js";

const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

let state = loadState() || defaultState();
let draft = deepClone(state);

const el = (id) => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing element id="${id}"`);
  return node;
};

const qsa = (sel) => Array.from(document.querySelectorAll(sel));

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[c]));
}

function formatMultiline(text) {
  return escapeHtml(text).replace(/\n/g, "<br/>");
}

function applyTokens(text) {
  // token minimal yang kita pakai sekarang
  const storeName = draft.store.name || "";
  return String(text || "")
    .replaceAll("{store_name}", storeName)
    .replaceAll("{date}", new Date().toLocaleDateString())
    .replaceAll("{staff_name}", "Kasir")
    .replaceAll("{thank_you}", "Terima kasih");
}

function renderPreview() {
  // Store profile
  el("pvStoreName").textContent = draft.store.name || "";
  el("pvStorePhone").textContent = draft.store.phone || "";
  el("pvStoreAddress").innerHTML = formatMultiline(draft.store.address || "");

  // Receipt header/footer (token replaced)
  const header = applyTokens(draft.receipt.headerText);
  const footer = applyTokens(draft.receipt.footerText);

  el("pvHeaderText").innerHTML = formatMultiline(header);
  el("pvFooterText").innerHTML = formatMultiline(footer);

  // Options (show/hide blocks)
  el("pvLogo").style.display = draft.receipt.options.showLogo ? "" : "none";
  el("pvTxnBlock").style.display = draft.receipt.options.showTxnId ? "" : "none";
  el("pvQrBlock").style.display = draft.receipt.options.printQr ? "" : "none";

  // Compact mode (toggle padding)
  const paper = el("pvPaper");
  if (draft.receipt.options.compactMode) {
    paper.classList.remove("p-8");
    paper.classList.add("p-5");
  } else {
    paper.classList.remove("p-5");
    paper.classList.add("p-8");
  }
}

function setFormFromDraft() {
  el("storeName").value = draft.store.name || "";
  el("storePhone").value = draft.store.phone || "";
  el("storeAddress").value = draft.store.address || "";

  el("headerText").value = draft.receipt.headerText || "";
  el("footerText").value = draft.receipt.footerText || "";

  el("optShowLogo").checked = !!draft.receipt.options.showLogo;
  el("optShowTxnId").checked = !!draft.receipt.options.showTxnId;
  el("optCompact").checked = !!draft.receipt.options.compactMode;
  el("optPrintQr").checked = !!draft.receipt.options.printQr;
}

function insertTokenIntoTextarea(textarea, token) {
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? textarea.value.length;
  textarea.value = textarea.value.slice(0, start) + token + textarea.value.slice(end);
  textarea.focus();
  textarea.selectionStart = textarea.selectionEnd = start + token.length;
}

function showToast(title, desc) {
  el("toastTitle").textContent = title;
  el("toastDesc").textContent = desc;
  el("toast").classList.remove("hidden");
  window.clearTimeout(window.__toastTimer);
  window.__toastTimer = window.setTimeout(hideToast, 2200);
}

function hideToast() {
  const t = document.getElementById("toast");
  if (t) t.classList.add("hidden");
}

function bindOnce() {
  // Live updates
  el("storeName").addEventListener("input", (e) => {
    draft.store.name = e.target.value;
    renderPreview();
  });

  el("storePhone").addEventListener("input", (e) => {
    draft.store.phone = e.target.value;
    renderPreview();
  });

  el("storeAddress").addEventListener("input", (e) => {
    draft.store.address = e.target.value;
    renderPreview();
  });

  el("headerText").addEventListener("input", (e) => {
    draft.receipt.headerText = e.target.value;
    renderPreview();
  });

  el("footerText").addEventListener("input", (e) => {
    draft.receipt.footerText = e.target.value;
    renderPreview();
  });

  // Options
  el("optShowLogo").addEventListener("change", (e) => {
    draft.receipt.options.showLogo = e.target.checked;
    renderPreview();
  });

  el("optShowTxnId").addEventListener("change", (e) => {
    draft.receipt.options.showTxnId = e.target.checked;
    renderPreview();
  });

  el("optCompact").addEventListener("change", (e) => {
    draft.receipt.options.compactMode = e.target.checked;
    renderPreview();
  });

  el("optPrintQr").addEventListener("change", (e) => {
    draft.receipt.options.printQr = e.target.checked;
    renderPreview();
  });

  // Token buttons
  qsa("[data-insert-token]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const token = btn.getAttribute("data-insert-token") || "";
      const target = btn.getAttribute("data-target") || "header";
      const textarea = target === "footer" ? el("footerText") : el("headerText");

      insertTokenIntoTextarea(textarea, token);

      if (target === "footer") draft.receipt.footerText = textarea.value;
      else draft.receipt.headerText = textarea.value;

      renderPreview();
    });
  });

  // Save
  el("btnSave").addEventListener("click", () => {
    state = deepClone(draft);
    saveState(state);
    showToast("Settings Saved!", "Your receipt template has been updated successfully.");
  });

  // Cancel (revert to last saved)
  el("btnCancel").addEventListener("click", () => {
    draft = deepClone(state);
    setFormFromDraft();
    renderPreview();
    showToast("Reverted", "Changes have been discarded.");
  });

  // Toast close
  el("toastClose").addEventListener("click", hideToast);
}

function main() {
  // ensure at least one saved state exists
  if (!loadState()) saveState(state);

  setFormFromDraft();
  renderPreview();
  hideToast();
  bindOnce();
}

document.addEventListener("DOMContentLoaded", main);
