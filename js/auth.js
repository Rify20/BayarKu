// js/auth.js
(function () {
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const msg = document.getElementById("msg");

  function showMsg(text, ok = true) {
    if (!msg) return;
    msg.classList.remove("hidden");
    msg.textContent = text;
    msg.className = ok
      ? "text-sm rounded-xl p-3 bg-green-500/10 text-green-700 border border-green-500/20"
      : "text-sm rounded-xl p-3 bg-red-500/10 text-red-700 border border-red-500/20";
  }

  async function main() {
    let supabase;
    try {
      supabase = window.getSupabase();
    } catch (e) {
      alert(e.message);
      return;
    }

    document.getElementById("btnBack")?.addEventListener("click", () => {
      window.location.href = "index.html";
    });

    document.getElementById("btnLogin")?.addEventListener("click", async () => {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.value.trim(),
          password: password.value,
        });
        if (error) throw error;

        showMsg("Login sukses. Pindah ke dashboard...", true);
        setTimeout(() => (window.location.href = "dashboard.html"), 600);
      } catch (e) {
        console.error(e);
        showMsg(e.message || "Login gagal", false);
      }
    });

    document.getElementById("btnRegister")?.addEventListener("click", async () => {
      try {
        const { error } = await supabase.auth.signUp({
          email: email.value.trim(),
          password: password.value,
        });
        if (error) throw error;

        showMsg("Register sukses. Kalau email confirmation ON, cek inbox dulu.", true);
      } catch (e) {
        console.error(e);
        showMsg(e.message || "Register gagal", false);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", main);
})();
