export interface Env {
  // i tuoi env qui
}

const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "https://social-growth-engine.web.app",
  "https://social-growth-engine.firebaseapp.com",
]);

function corsHeaders(origin: string | null) {
  // Con Authorization Bearer NON serve "credentials: include".
  // Quindi possiamo essere più permissivi. Però: se vuoi cookies, NON usare "*".
  const allowOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : "http://localhost:5173";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function withCors(resp: Response, origin: string | null) {
  const headers = new Headers(resp.headers);
  const cors = corsHeaders(origin);
  Object.entries(cors).forEach(([k, v]) => headers.set(k, v));
  return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers });
}

function json(data: unknown, status = 200, origin: string | null = null) {
  const resp = new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
  return withCors(resp, origin);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const origin = request.headers.get("Origin");

    // Preflight
    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }), origin);
    }

    try {
      const url = new URL(request.url);

      // ✅ esempio route
      if (url.pathname === "/api/health") {
        return json({ ok: true }, 200, origin);
      }

      // TODO: qui le tue route reali (/api/tasks/today ecc.)
      // IMPORTANTE: qualsiasi return deve passare da json(...) o withCors(...)

      return json({ error: "Not found" }, 404, origin);
    } catch (err: any) {
      // ✅ anche il 500 deve avere CORS
      return json(
        { error: "Internal error", message: err?.message ?? String(err) },
        500,
        origin,
      );
    }
  },
} satisfies ExportedHandler<Env>;
