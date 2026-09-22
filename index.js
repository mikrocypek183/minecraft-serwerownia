const ALLOWED_TYPES = new Set(["aircraft","car","military","machine","utility","other"]);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",...corsHeaders}
  });
}

function githubHeaders(env) {
  return {
    "Accept": "application/vnd.github+json",
    "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
    "X-GitHub-Api-Version": "2026-03-10",
    "Content-Type": "application/json"
  };
}

async function getFile(env) {
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${env.GITHUB_PATH}`;
  const response = await fetch(url, {headers: githubHeaders(env)});
  if (response.status === 404) return {systems: [], sha: null};
  if (!response.ok) throw new Error(`GitHub GET failed: ${response.status}`);
  const data = await response.json();
  const systems = JSON.parse(atob(data.content.replace(/\n/g, "")));
  if (!Array.isArray(systems)) throw new Error("systems.json must contain an array");
  return {systems, sha: data.sha};
}

async function saveFile(env, systems, sha) {
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${env.GITHUB_PATH}`;
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(systems, null, 2) + "\n")));
  const body = {message:"Update base control systems", content};
  if (sha) body.sha = sha;

  const response = await fetch(url, {
    method:"PUT", headers:githubHeaders(env), body:JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`GitHub PUT failed: ${response.status}`);
  return response.json();
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, {status:204,headers:corsHeaders});
    const url = new URL(request.url);

    try {
      if (url.pathname === "/api/health" && request.method === "GET")
        return json({status:"online",database:"github"});

      if (url.pathname === "/api/systems" && request.method === "GET") {
        const {systems} = await getFile(env);
        return json(systems);
      }

      if (url.pathname === "/api/systems" && request.method === "POST") {
        const body = await request.json();
        const name = typeof body.name === "string" ? body.name.trim() : "";
        const type = typeof body.type === "string" ? body.type.trim() : "";

        if (!name || !type) return json({error:"ALL FIELDS ARE REQUIRED"},400);
        if (name.length > 32) return json({error:"SYSTEM NAME TOO LONG"},400);
        if (!ALLOWED_TYPES.has(type)) return json({error:"INVALID SYSTEM TYPE"},400);

        const {systems, sha} = await getFile(env);
        if (systems.some(s => String(s.name).toLowerCase() === name.toLowerCase()))
          return json({error:"SYSTEM NAME ALREADY EXISTS"},409);

        const system = {
          id: crypto.randomUUID(), name, type, registeredAt:new Date().toISOString()
        };
        systems.push(system);
        await saveFile(env, systems, sha);
        return json(system,201);
      }

      const match = url.pathname.match(/^\/api\/systems\/([^/]+)$/);
      if (match && request.method === "DELETE") {
        const id = decodeURIComponent(match[1]);
        const {systems, sha} = await getFile(env);
        const updated = systems.filter(s => s.id !== id);
        if (updated.length === systems.length) return json({error:"SYSTEM NOT FOUND"},404);
        await saveFile(env, updated, sha);
        return json({success:true});
      }

      return json({error:"NOT FOUND"},404);
    } catch (error) {
      return json({error:error.message || "SERVER ERROR"},500);
    }
  }
};
