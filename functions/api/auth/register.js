export async function onRequest({ request, env }) {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const { email, password } = await request.json().catch(() => ({}));
  if (!email || !password || password.length < 6) {
    return Response.json({ error: "Email/password invalid (min 6 chars)" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const salt = crypto.randomUUID().replaceAll("-", "");
  const hash = await pbkdf2Hex(password, salt);

  try {
    await env.DB.prepare(
      "INSERT INTO users (id, email, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(id, email.toLowerCase(), hash, salt, Math.floor(Date.now() / 1000)).run();
  } catch {
    return Response.json({ error: "Email already registered" }, { status: 409 });
  }

  return Response.json({ ok: true });
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
