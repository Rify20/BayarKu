// js/supabase.js
// ==============================
// ISI SUPABASE KAMU DI SINI
// ==============================
window.SUPABASE_URL = "https://epnsdpmyhosdwxmpvpeg.supabase.co";
window.SUPABASE_ANON_KEY = "sb_publishable_qMjD4hhoWHP3VeHXJd1YOg_oaAp_4mq";

// Redirect tujuan
window.TARGET_IF_LOGGED_IN = "dashboard.html";
window.TARGET_IF_GUEST = "login.html";

// Buat supabase client (dipakai di file JS lain)
window.getSupabase = function getSupabase() {
  if (!window.SUPABASE_URL?.startsWith("http") || !window.SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY.length < 50) {
    throw new Error("Supabase URL / ANON KEY belum diisi atau salah. Edit js/supabase.js");
  }
  if (!window.supabase?.createClient) {
    throw new Error("Supabase CDN belum ter-load. Pastikan script supabase-js ada di HTML.");
  }
  return window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
};
