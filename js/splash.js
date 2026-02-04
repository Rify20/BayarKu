// js/splash.js
(function () {
  const barFill = document.getElementById("barFill");
  const percentText = document.getElementById("percentText");
  const statusText = document.getElementById("statusText");

  const steps = [
    { p: 10, t: "Initializing POS System" },
    { p: 25, t: "Loading UI Components" },
    { p: 45, t: "Checking Session" },
    { p: 65, t: "Connecting to Supabase" },
    { p: 85, t: "Preparing Workspace" },
    { p: 95, t: "Finalizing" },
  ];

  function setProgress(p) {
    if (barFill) barFill.style.width = p + "%";
    if (percentText) percentText.textContent = p + "%";

    let current = steps[0].t;
    for (const s of steps) if (p >= s.p) current = s.t;
    if (statusText) statusText.textContent = current;
  }

  async function main() {
    let supabase;
    try {
      supabase = window.getSupabase();
    } catch (e) {
      alert(e.message);
      return;
    }

    // animasi progress
    const start = performance.now();
    const duration = 1800;
    let doneAnim = false;

    function animate(now) {
      const ratio = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - ratio, 3);
      const p = Math.max(1, Math.min(99, Math.round(eased * 99)));
      setProgress(p);

      if (ratio < 1) requestAnimationFrame(animate);
      else doneAnim = true;
    }
    requestAnimationFrame(animate);

    // cek session supabase
    let session = null;
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      session = data.session;
    } catch (e) {
      console.error("Supabase session error:", e);
      session = null;
    }

    // tunggu animasi selesai
    while (!doneAnim) await new Promise((r) => setTimeout(r, 50));
    setProgress(100);

    setTimeout(() => {
      const target = session ? window.TARGET_IF_LOGGED_IN : window.TARGET_IF_GUEST;
      // karena kita ada di /pages, targetnya halaman di folder yang sama
      window.location.href = target;
    }, 300);
  }

  document.addEventListener("DOMContentLoaded", main);
})();
