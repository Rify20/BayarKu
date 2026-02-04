// js/dashboard.js
(function () {
  const userEmail = document.getElementById("userEmail");

  async function main() {
    let supabase;
    try {
      supabase = window.getSupabase();
    } catch (e) {
      alert(e.message);
      return;
    }

    // protect page
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      window.location.href = "login.html";
      return;
    }

    if (userEmail) userEmail.textContent = data.user.email || "(no email)";

    document.getElementById("btnSplash")?.addEventListener("click", () => {
      window.location.href = "index.html";
    });

    document.getElementById("btnLogout")?.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "login.html";
    });
  }

  document.addEventListener("DOMContentLoaded", main);
})();
