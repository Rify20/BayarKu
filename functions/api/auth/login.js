export async function onRequest({ request, env }) {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const { email, password } = await request.json().catch(() => ({}));
  if (!email || !password) return Response.json({ error: "Missing email/password" }, { status: 400 });

  const user = await env.DB.prepare(
    "SELECT id, password_hash, salt FROM users WHERE email=?"
  ).bind(email.toLowerCase()).first();

  if (!user) return Response.json({ error: "Invalid credentials" }, { status: 401 });

  const hash = await pbkdf2Hex(password, user.salt);
  if (hash !== user.password_hash) return Response.json({ error: "Invalid credentials" }, { status: 401 });

  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 3600; // 7 days
  const token = await signSession(env.SESSION_SECRET, { uid: user.id, exp });

  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": cookie("session", token, exp),
    },
  });
}

function cookie(name, value, expUnix) {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=${new Date(expUnix * 1000).toUTCString()}`;
}

async function signSession(secret, payload) {
  const body = b64url(JSON.stringify(payload));
  const sig = await hmacHex(secret, body);
  return `${body}.${sig}`;
}

async function hmacHex(secret, msg) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function b64url(str) {
  return btoa(str).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function pbkdf2Hex(password, salt) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: enc.encode(salt), iterations: 120000 },
    key,
    256
  );
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
