export async function onRequest({ request }) {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": "session=; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    },
  });
}
