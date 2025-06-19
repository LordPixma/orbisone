export interface Env {
  ParserQueue: Queue;
}

interface MimeParts {
  headers: Record<string, string>;
  body: string;
}

function extractMimeParts(rawMime: string): MimeParts {
  const [rawHeaders, ...bodyParts] = rawMime.split(/\r?\n\r?\n/);
  const body = bodyParts.join("\n\n");
  const headers: Record<string, string> = {};

  for (const line of rawHeaders.split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    headers[key] = value;
  }

  return { headers, body };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const rawMime = await request.text();
    extractMimeParts(rawMime); // MIME parsing side-effect for demonstration

    ctx.waitUntil(env.ParserQueue.send(JSON.stringify({ rawMime })));

    return new Response("Queued", { status: 202 });
  },
};
