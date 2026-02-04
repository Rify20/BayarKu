export async function onRequest({ request, env }) {
  const sess = await requireSession(request, env);
  if (!sess.ok) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (request.method === "GET") {
    const row = await env.DB.prepare(
      "SELECT store_name, phone, address, header_text, footer_text, opt_show_logo, opt_show_txn_id, opt_compact, opt_print_qr FROM settings WHERE id='main'"
    ).first();
    return Response.json(row || {});
  }

  if (request.method === "PUT") {
    const b = await request.json().catch(() => null);
    if (!b) return Response.json({ error: "Invalid JSON" }, { status: 400 });

    await env.DB.prepare(`
      UPDATE settings SET
        store_name=?,
        phone=?,
        address=?,
        header_text=?,
        footer_text=?,
        opt_show_logo=?,
        opt_show_txn_id=?,
        opt_compact=?,
        opt_print_qr=?,
        updated_at=strftime('%s','now')
      WHERE id='main'
    `).bind(
      String(b.store_name ?? ""),
      String(b.phone ?? ""),
      String(b.address ?? ""),
      String(b.header_text ?? ""),
      String(b.footer_text ?? ""),
      b.opt_show_logo ? 1 : 0,
      b.opt_show_txn_id ? 1 : 0,
      b.opt_compact ? 1 : 0,
      b.opt_print_qr ? 1 : 0,
    ).run();

    return Response.json({ ok: true });
  }

  return new Response("Method Not Allowed", { status: 405 });
}

async function requireSession(request, env) {
  const cookie = request.headers.get("Cookie") || "";
  const m = cookie.match(/(?:^|;\s*)session=([^;]+)/);
  if (!m) return { ok: false };

  const token = m[1];
  const [body, sig] = token.split(".");
  if (!body || !sig) return { ok: false };

  const expected = await hmacHex(env.SESSION_SECRET, body);
  if (expected !== sig) return { ok: false };

  const payload = JSON.parse(atob(body.replaceAll("-", "+").replaceAll("_", "/")));
  if (!payload?.exp || payload.exp < Math.floor(Date.now() / 1000)) return { ok: false };

  return { ok: true, uid: payload.uid };
}

async function hmacHex(secret, msg) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
