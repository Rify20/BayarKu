(() => {
  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ====== Find elements from YOUR existing HTML (tanpa ubah desain) ======
  function getButtons() {
    const buttons = $$("button");
    const byText = (t) => buttons.find((b) => norm(b.textContent) === t);

    const tokenBtns = buttons.filter((b) => /^\{.*\}$/.test(norm(b.textContent)));

    const toastClose = buttons.find((b) => {
      const icon = b.querySelector(".material-symbols-outlined");
      return icon && norm(icon.textContent) === "close";
    });

    return {
      btnCancel: byText("Batal"),
      btnSave: byText("Simpan"),
      btnLogout: byText("Logout"),
      tokenBtns,
      toastClose,
    };
  }

  function getFormEls() {
    // sesuai struktur HTML lo:
    // input text: store name, phone
    // textarea: address, header, footer
    // checkbox: show logo, show txn id, compact mode, print qr
    const inputs = $$('input[type="text"]');
    const textareas = $$("textarea");
    const checks = $$('input[type="checkbox"]');

    return {
      storeName: inputs[0],
      phone: inputs[1],
      address: textareas[0],
      header: textareas[1],
      footer: textareas[2],
      optLogo: checks[0],
      optTxn: checks[1],
      optCompact: checks[2],
      optQr: checks[3],
    };
  }

  function getPreviewEls() {
    const paper = $(".receipt-paper");
    return {
      paper,
      // bagian logo placeholder
      logoBox: $(".receipt-paper .border-dashed"),
      // store name di preview
      pvStoreName: $(".receipt-paper .space-y-1 p.font-bold"),
      // address + phone di preview
      pvMeta: $(".receipt-paper .space-y-1 p.text-\\[11px\\]"),
      // header block
      pvHeader: $(".receipt-paper .border-t.border-dashed p.text-\\[11px\\]"),
      // footer block
      pvFooter: $(".receipt-paper p.text-\\[11px\\].text-gray-600.font-medium"),
      // qr section wrapper
      pvQrWrap: $(".receipt-paper .flex.flex-col.items-center.gap-2.py-2"),
      // txn id text
      pvTxn: $(".receipt-paper p.text-\\[10px\\].font-mono"),
      // toast container
      toast: $("div.fixed.bottom-8.right-8"),
      toastTitle: $("div.fixed.bottom-8.right-8 p.font-bold.text-sm"),
      toastDesc: $("div.fixed.bottom-8.right-8 p.text-xs.text-gray-400"),
    };
  }

  // ====== Utilities ======
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[c]));
  }

  function withBr(s) {
    return escapeHtml(s).replace(/\n/g, "<br/>");
  }

  function applyTokens(text, storeName) {
    return String(text || "")
      .replaceAll("{store_name}", storeName || "")
      .replaceAll("{date}", new Date().toLocaleDateString())
      .replaceAll("{staff_name}", "Kasir")
      .replaceAll("{thank_you}", "Terima kasih");
  }

  function insertAtCursor(textarea, token) {
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    textarea.value = textarea.value.slice(0, start) + token + textarea.value.slice(end);
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + token.length;
  }

  function showToast(pv, title, desc) {
    if (!pv.toast) return;
    pv.toast.style.display = "block";
    if (pv.toastTitle) pv.toastTitle.textContent = title;
    if (pv.toastDesc) pv.toastDesc.textContent = desc;

    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => {
      pv.toast.style.display = "none";
    }, 2200);
  }

  // ====== "Backend" sementara: memory only (bukan localStorage) ======
  // lo bilang jangan localStorage. Ok. Ini cuma buat demo fungsi tombol.
  // Nanti kalau udah siap database, bagian load/save tinggal ganti fetch API.
  const STATE = {
    lastSaved: null,
  };

  function getCurrentForm(form) {
    return {
      store_name: form.storeName.value,
      phone: form.phone.value,
      address: form.address.value,
      header_text: form.header.value,
      footer_text: form.footer.value,
      opt_show_logo: form.optLogo.checked,
      opt_show_txn_id: form.optTxn.checked,
      opt_compact: form.optCompact.checked,
      opt_print_qr: form.optQr.checked,
    };
  }

  function setForm(form, data) {
    form.storeName.value = data.store_name ?? "";
    form.phone.value = data.phone ?? "";
    form.address.value = data.address ?? "";
    form.header.value = data.header_text ?? "";
    form.footer.value = data.footer_text ?? "";
    form.optLogo.checked = !!data.opt_show_logo;
    form.optTxn.checked = !!data.opt_show_txn_id;
    form.optCompact.checked = !!data.opt_compact;
    form.optQr.checked = !!data.opt_print_qr;
  }

  // ====== Render preview (REAL TIME) ======
  function renderPreview(form, pv) {
    const storeName = form.storeName.value || "";

    if (pv.pvStoreName) pv.pvStoreName.textContent = storeName;

    if (pv.pvMeta) {
      pv.pvMeta.innerHTML = `${withBr(form.address.value || "")}<br/>${escapeHtml(form.phone.value || "")}`;
    }

    if (pv.pvHeader) {
      pv.pvHeader.innerHTML = withBr(applyTokens(form.header.value || "", storeName));
    }

    if (pv.pvFooter) {
      pv.pvFooter.innerHTML = withBr(applyTokens(form.footer.value || "", storeName));
    }

    if (pv.logoBox) pv.logoBox.style.display = form.optLogo.checked ? "" : "none";
    if (pv.pvTxn) pv.pvTxn.style.display = form.optTxn.checked ? "" : "none";
    if (pv.pvQrWrap) pv.pvQrWrap.style.display = form.optQr.checked ? "" : "none";

    // compact mode: ganti padding receipt (TIDAK ubah layout lain)
    if (pv.paper) {
      if (form.optCompact.checked) {
        pv.paper.classList.remove("p-8");
        pv.paper.classList.add("p-5");
      } else {
        pv.paper.classList.remove("p-5");
        pv.paper.classList.add("p-8");
      }
    }
  }

  // ====== Main ======
  function main() {
    const btns = getButtons();
    const form = getFormEls();
    const pv = getPreviewEls();

    // hide toast awal (di HTML lo toast kebuka)
    if (pv.toast) pv.toast.style.display = "none";

    // seed "saved state" pertama kali dari isi HTML sekarang
    STATE.lastSaved = getCurrentForm(form);

    // first render
    renderPreview(form, pv);

    // realtime listeners
    [form.storeName, form.phone, form.address, form.header, form.footer].forEach((el) => {
      el.addEventListener("input", () => renderPreview(form, pv));
    });
    [form.optLogo, form.optTxn, form.optCompact, form.optQr].forEach((el) => {
      el.addEventListener("change", () => renderPreview(form, pv));
    });

    // token buttons
    btns.tokenBtns.forEach((b) => {
      const t = norm(b.textContent);
      b.addEventListener("click", () => {
        if (t === "{store_name}" || t === "{date}") {
          insertAtCursor(form.header, t);
        } else if (t === "{staff_name}" || t === "{thank_you}") {
          insertAtCursor(form.footer, t);
        }
        renderPreview(form, pv);
      });
    });

    // close toast
    btns.toastClose?.addEventListener("click", () => {
      if (pv.toast) pv.toast.style.display = "none";
    });

    // SAVE (sementara: simpan ke memory STATE, nanti ganti ke database)
    btns.btnSave?.addEventListener("click", () => {
      STATE.lastSaved = getCurrentForm(form);
      showToast(pv, "Settings Saved!", "Your receipt template has been updated successfully.");
    });

    // CANCEL (revert ke lastSaved)
    btns.btnCancel?.addEventListener("click", () => {
      setForm(form, STATE.lastSaved || {});
      renderPreview(form, pv);
      showToast(pv, "Reverted", "Changes have been discarded.");
    });

    // LOGOUT (sementara: redirect)
    btns.btnLogout?.addEventListener("click", () => {
      // nanti kalau sudah login beneran, ini panggil /logout API.
      window.location.href = "./login.html";
    });
  }

  document.addEventListener("DOMContentLoaded", main);
})();
