(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[c]));
  }
  const br = (t) => escapeHtml(t).replace(/\n/g, "<br/>");

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

  function findButtons() {
    const buttons = $$("button");
    return {
      cancel: buttons.find((b) => norm(b.textContent) === "Batal"),
      save: buttons.find((b) => norm(b.textContent) === "Simpan"),
      logout: buttons.find((b) => norm(b.textContent) === "Logout"),
      toastClose: buttons.find((b) => b.querySelector(".material-symbols-outlined")?.textContent?.trim() === "close"),
      tokenBtns: buttons.filter((b) => /^\{.*\}$/.test(norm(b.textContent))),
    };
  }

  function findFormEls() {
    const inputs = $$('section input[type="text"]');
    const textareas = $$("section textarea");
    const checks = $$('section input[type="checkbox"]');

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

  function findPreviewEls() {
    const paper = $(".receipt-paper");
    if (!paper) return {};

    return {
      paper,
      logo: $(".receipt-paper .border-dashed", paper),
      storeName: $(".receipt-paper .space-y-1 p.font-bold", paper),
      storeMeta: $(".receipt-paper .space-y-1 p.text-\\[11px\\]", paper),
      header: $(".receipt-paper .border-t.border-dashed p.text-\\[11px\\]", paper),
      footer: $(".receipt-paper p.text-\\[11px\\].text-gray-600.font-medium", paper),
      qrWrap: $(".receipt-paper .flex.flex-col.items-center.gap-2.py-2", paper),
      txn: $(".receipt-paper p.text-\\[10px\\].font-mono", paper),
      toast: $('div.fixed.bottom-8.right-8'),
    };
  }

  async function apiGetSettings() {
    const res = await fetch("/api/settings");
    if (res.status === 401) location.href = "/pages/login.html";
    if (!res.ok) throw new Error("Failed to load settings");
    return res.json();
  }

  async function apiSaveSettings(payload) {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.status === 401) location.href = "/pages/login.html";
    if (!res.ok) throw new Error("Failed to save settings");
    return res.json();
  }

  async function apiLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    location.href = "/pages/login.html";
  }

  function renderPreview(form, pv) {
    const storeName = form.storeName.value || "";

    if (pv.storeName) pv.storeName.textContent = storeName;
    if (pv.storeMeta) pv.storeMeta.innerHTML = `${br(form.address.value || "")}<br/>${escapeHtml(form.phone.value || "")}`;

    if (pv.header) pv.header.innerHTML = br(applyTokens(form.header.value || "", storeName));
    if (pv.footer) pv.footer.innerHTML = br(applyTokens(form.footer.value || "", storeName));

    if (pv.logo) pv.logo.style.display = form.optLogo.checked ? "" : "none";
    if (pv.txn) pv.txn.style.display = form.optTxn.checked ? "" : "none";
    if (pv.qrWrap) pv.qrWrap.style.display = form.optQr.checked ? "" : "none";

    if (pv.paper) {
      if (form.optCompact.checked) {
        pv.paper.classList.remove("p-8"); pv.paper.classList.add("p-5");
      } else {
        pv.paper.classList.remove("p-5"); pv.paper.classList.add("p-8");
      }
    }
  }

  function showToast(pv, title, desc) {
    if (!pv.toast) return;
    const titleEl = $(".font-bold.text-sm", pv.toast);
    const descEl = $(".text-xs.text-gray-400", pv.toast);
    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = desc;

    pv.toast.style.display = "block";
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => (pv.toast.style.display = "none"), 2200);
  }

  async function main() {
    const btns = findButtons();
    const form = findFormEls();
    const pv = findPreviewEls();

    // toast awalnya hide (karena di HTML lo toast tampil)
    if (pv.toast) pv.toast.style.display = "none";

    // load settings dari DB
    const s = await apiGetSettings();

    // isi form (tanpa ubah HTML struktur)
    form.storeName.value = s.store_name ?? "";
    form.phone.value = s.phone ?? "";
    form.address.value = s.address ?? "";
    form.header.value = s.header_text ?? "";
    form.footer.value = s.footer_text ?? "";

    form.optLogo.checked = !!s.opt_show_logo;
    form.optTxn.checked = !!s.opt_show_txn_id;
    form.optCompact.checked = !!s.opt_compact;
    form.optQr.checked = !!s.opt_print_qr;

    renderPreview(form, pv);

    // realtime update
    [form.storeName, form.phone, form.address, form.header, form.footer].forEach((el) =>
      el.addEventListener("input", () => renderPreview(form, pv))
    );
    [form.optLogo, form.optTxn, form.optCompact, form.optQr].forEach((el) =>
      el.addEventListener("change", () => renderPreview(form, pv))
    );

    // token buttons berdasarkan teksnya (tetep UI sama)
    btns.tokenBtns.forEach((b) => {
      const t = norm(b.textContent);
      if (t === "{store_name}" || t === "{date}") {
        b.addEventListener("click", () => {
          insertAtCursor(form.header, t);
          renderPreview(form, pv);
        });
      } else if (t === "{staff_name}" || t === "{thank_you}") {
        b.addEventListener("click", () => {
          insertAtCursor(form.footer, t);
          renderPreview(form, pv);
        });
      }
    });

    // save
    btns.save?.addEventListener("click", async () => {
      await apiSaveSettings({
        store_name: form.storeName.value,
        phone: form.phone.value,
        address: form.address.value,
        header_text: form.header.value,
        footer_text: form.footer.value,
        opt_show_logo: form.optLogo.checked,
        opt_show_txn_id: form.optTxn.checked,
        opt_compact: form.optCompact.checked,
        opt_print_qr: form.optQr.checked,
      });
      showToast(pv, "Settings Saved!", "Your receipt template has been updated successfully.");
    });

    // cancel -> reload dari DB (bener-bener revert)
    btns.cancel?.addEventListener("click", async () => {
      const s2 = await apiGetSettings();
      form.storeName.value = s2.store_name ?? "";
      form.phone.value = s2.phone ?? "";
      form.address.value = s2.address ?? "";
      form.header.value = s2.header_text ?? "";
      form.footer.value = s2.footer_text ?? "";
      form.optLogo.checked = !!s2.opt_show_logo;
      form.optTxn.checked = !!s2.opt_show_txn_id;
      form.optCompact.checked = !!s2.opt_compact;
      form.optQr.checked = !!s2.opt_print_qr;
      renderPreview(form, pv);
      showToast(pv, "Reverted", "Changes have been discarded.");
    });

    // logout
    btns.logout?.addEventListener("click", apiLogout);

    // toast close
    btns.toastClose?.addEventListener("click", () => { if (pv.toast) pv.toast.style.display = "none"; });
  }

  document.addEventListener("DOMContentLoaded", () => {
    main().catch(() => (location.href = "/pages/login.html"));
  });
})();
