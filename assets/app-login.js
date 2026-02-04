import { getState, setState, defaultState } from "./storage.js";

const state = getState() || defaultState();
let draft = { ...state };

const qs = (sel) => document.querySelector(sel);
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
function br(text) {
  return escapeHtml(text).replace(/\n/g, "<br/>");
}
function applyTokens(text) {
  return String(text || "")
    .replaceAll("{store_name}", draft.storeName || "")
    .replaceAll("{date}", new Date().toLocaleDateString())
    .replaceAll("{staff_name}", "Kasir")
    .replaceAll("{thank_you}", "Terima kasih");
}

/**
 * IMPORTANT:
 * Kita TIDAK ubah layout HTML kamu.
 * Kita hanya cari elemen pakai selector yang stabil.
 * Tapi tetap paling aman kalau kamu tambahin id (lihat STEP 2).
 */

function fillFormFromDraft() {
  qs("#rf_storeName").value = draft.storeName;
  qs("#rf_phone").value = draft.phone;
  qs("#rf_address").value = draft.address;
  qs("#rf_header").value = draft.headerText;
  qs("#rf_footer").value = draft.footerText;

  qs("#rf_opt_logo").checked = !!draft.optShowLogo;
  qs("#rf_opt_txn").checked = !!draft.optShowTxnId;
  qs("#rf_opt_compact").checked = !!draft.optCompact;
  qs("#rf_opt_qr").checked = !!draft.optPrintQr;
}

function renderPreview() {
  // store name + address + phone
  qs("#pv_storeName").textContent = draft.storeName;
  qs("#pv_storeMeta").innerHTML = `${br(draft.address)}<br/>${escapeHtml(draft.phone)}`;

  // header/footer preview
  qs("#pv_header").innerHTML = br(applyTokens(draft.headerText));
  qs("#pv_footer").innerHTML = br(applyTokens(draft.footerText));

  // options
  qs("#pv_logo").style.display = draft.optShowLogo ? "" : "none";
  qs("#pv_txn").style.display = draft.optShowTxnId ? "" : "none";
  qs("#pv_qrwrap").style.display = draft.optPrintQr ? "" : "none";

  // compact mode: cukup ubah padding receipt-paper
  const paper = qs("#pv_paper");
  if (draft.optCompact) {
    paper.classList.remove("p-8");
    paper.classList.add("p-5");
  } else {
    paper.classList.remove("p-5");
    paper.classList.add("p-8");
  }
}

function showToast(textTop = "Settings Saved!", textBottom = "Your receipt template has been updated successfully.") {
  const toast = qs("#toastWrap");
  if (!toast) return;

  toast.querySelector("#toastTitle").textContent = textTop;
  toast.querySelector("#toastDesc").textContent = textBottom;
  toast.style.display = "block";

  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    toast.style.display = "none";
  }, 2200);
}

function insertToken(textarea, token) {
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? textarea.value.length;
  textarea.value = textarea.value.slice(0, start) + token + textarea.value.slice(end);
  textarea.focus();
  textarea.selectionStart = textarea.selectionEnd = start + token.length;
}

function bindEvents() {
  // live form updates
  qs("#rf_storeName").addEventListener("input", (e) => { draft.storeName = e.target.value; renderPreview(); });
  qs("#rf_phone").addEventListener("input", (e) => { draft.phone = e.target.value; renderPreview(); });
  qs("#rf_address").addEventListener("input", (e) => { draft.address = e.target.value; renderPreview(); });
  qs("#rf_header").addEventListener("input", (e) => { draft.headerText = e.target.value; renderPreview(); });
  qs("#rf_footer").addEventListener("input", (e) => { draft.footerText = e.target.value; renderPreview(); });

  // checkbox options
  qs("#rf_opt_logo").addEventListener("change", (e) => { draft.optShowLogo = e.target.checked; renderPreview(); });
  qs("#rf_opt_txn").addEventListener("change", (e) => { draft.optShowTxnId = e.target.checked; renderPreview(); });
  qs("#rf_opt_compact").addEventListener("change", (e) => { draft.optCompact = e.target.checked; renderPreview(); });
  qs("#rf_opt_qr").addEventListener("change", (e) => { draft.optPrintQr = e.target.checked; renderPreview(); });

  // token buttons
  qsa("[data-token]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const token = btn.getAttribute("data-token");
      const target = btn.getAttribute("data-target"); // header/footer
      const textarea = target === "footer" ? qs("#rf_footer") : qs("#rf_header");
      insertToken(textarea, token);
      if (target === "footer") draft.footerText = textarea.value;
      else draft.headerText = textarea.value;
      renderPreview();
    });
  });

  // Save / Cancel
  qs("#btnSave").addEventListener("click", () => {
    setState(draft);
    showToast();
  });

  qs("#btnCancel").addEventListener("click", () => {
    const saved = getState() || defaultState();
    draft = { ...saved };
    fillFormFromDraft();
    renderPreview();
    showToast("Reverted", "Changes have been discarded.");
  });

  // toast close
  const closeBtn = qs("#toastClose");
  if (closeBtn) closeBtn.addEventListener("click", () => {
    qs("#toastWrap").style.display = "none";
  });
}

function init() {
  // hide original toast wrapper by default (biar gak nongol terus)
  const toast = qs("#toastWrap");
  if (toast) toast.style.display = "none";

  fillFormFromDraft();
  renderPreview();
  bindEvents();
}

document.addEventListener("DOMContentLoaded", init);
