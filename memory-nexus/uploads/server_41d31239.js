const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 5186);
const dataDir = process.env.SIGNAL_LOST_DATA_DIR || path.join(root, ".signal-lost-data");
const sessionStoreFile = path.join(dataDir, "sessions.json");
const resolvedRoot = path.resolve(root);
const resolvedDataDir = path.resolve(dataDir);
const sessions = new Map();
const maxStoredSessions = 80;
const staleSessionMs = 30_000;
const playerInactiveMs = 120_000;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".md": "text/markdown; charset=utf-8"
};

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*"
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function loadSessions() {
  try {
    const stored = JSON.parse(fs.readFileSync(sessionStoreFile, "utf8"));
    const rows = Array.isArray(stored.sessions) ? stored.sessions : [];
    rows.forEach((session) => {
      if (!session?.code) return;
      sessions.set(String(session.code).toUpperCase(), {
        ...session,
        code: String(session.code).toUpperCase()
      });
    });
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn(`Could not load session store: ${error.message}`);
    }
  }
}

function saveSessions() {
  const rows = [...sessions.values()]
    .sort((a, b) => Number(b.syncedAt || 0) - Number(a.syncedAt || 0))
    .slice(0, maxStoredSessions);
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(
    sessionStoreFile,
    JSON.stringify(
      {
        version: 1,
        savedAt: Date.now(),
        sessions: rows
      },
      null,
      2
    )
  );
}

function normalizeSession(session) {
  if (!session || typeof session !== "object") return null;
  const code = String(session.code || "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 40);
  if (!code) return null;
  const sessionMode = ["private", "public", "locked"].includes(session.sessionMode)
    ? session.sessionMode
    : session.isPublic
      ? "public"
      : "private";
  return {
    ...session,
    code,
    sessionMode,
    isPublic: sessionMode !== "private",
    revision: Number(session.revision || 1),
    syncedAt: Date.now()
  };
}

function sessionSummary(session) {
  const syncedAt = Number(session.syncedAt || session.updatedAt || 0);
  const ageMs = syncedAt ? Date.now() - syncedAt : Infinity;
  const objectives = Array.isArray(session.objectives) ? session.objectives : [];
  const agents = Array.isArray(session.agents) ? session.agents : [];
  const chat = Array.isArray(session.chat) ? session.chat : [];
  const organizer = session.organizer && typeof session.organizer === "object" ? session.organizer : {};
  const auth = session.auth && typeof session.auth === "object" ? session.auth : {};
  const activePlayers = agents.filter((agent) => !botAgent(agent) && playerIsActive(agent)).length;
  return {
    code: session.code,
    status: session.status,
    sessionMode: session.sessionMode || (session.isPublic ? "public" : "private"),
    organizerName: organizer.name || "",
    organizerCallsign: organizer.callsign || "",
    accessRequired: auth.requireAccessCode !== false,
    city: session.city,
    players: agents.length,
    activePlayers,
    maxPlayers: session.maxPlayers,
    chatCount: chat.length,
    lastChatAt: latestChatTime(chat),
    found: objectives.filter((objective) => objective.found).length,
    objectives: objectives.length,
    revision: Number(session.revision || 0),
    serverRevision: Number(session.serverRevision || 0),
    updatedAt: session.updatedAt || syncedAt,
    syncedAt,
    ageMs: Number.isFinite(ageMs) ? Math.max(0, ageMs) : null,
    stale: !syncedAt || ageMs > staleSessionMs
  };
}

function latestChatTime(chat) {
  return chat.reduce((latest, entry) => {
    const at = Array.isArray(entry) ? Number(entry[2] || 0) : Number(entry?.at || 0);
    return Math.max(latest, Number.isFinite(at) ? at : 0);
  }, 0);
}

function botAgent(agent) {
  return Boolean(agent?.bot || String(agent?.id || "").startsWith("bot-"));
}

function playerIsActive(agent) {
  const lastSeen = Number(agent?.lastSeen || agent?.identity?.joinedAt || 0);
  return Boolean(lastSeen && Date.now() - lastSeen <= playerInactiveMs);
}

function agentPositionPayload(agent) {
  return {
    id: agent.id,
    name: agent.name,
    role: agent.role,
    team: agent.team,
    bot: botAgent(agent),
    clientId: agent.clientId || "",
    lat: Number(agent.lat),
    lng: Number(agent.lng),
    signal: Number(agent.signal),
    stamina: Number(agent.stamina),
    gpsAccuracy: Number.isFinite(Number(agent.gpsAccuracy)) ? Number(agent.gpsAccuracy) : null,
    lastSeen: Number(agent.lastSeen || agent.identity?.joinedAt || 0),
    active: !botAgent(agent) && playerIsActive(agent)
  };
}

function isInsidePath(target, parent) {
  const resolvedTarget = path.resolve(target);
  return resolvedTarget === parent || resolvedTarget.startsWith(`${parent}${path.sep}`);
}

function serveFile(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requested = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.normalize(path.join(root, requested));

  if (!isInsidePath(filePath, resolvedRoot) || isInsidePath(filePath, resolvedDataDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(error.code === "ENOENT" ? 404 : 500);
      res.end(error.code === "ENOENT" ? "Not found" : "Server error");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "content-type": mimeTypes[ext] || "application/octet-stream",
      "cache-control": ext === ".html" ? "no-store" : "public, max-age=60"
    });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
      "access-control-allow-headers": "content-type"
    });
    res.end();
    return;
  }

  if (url.pathname === "/api/export" && req.method === "GET") {
    const exportedSessions = [...sessions.values()].sort((a, b) => Number(b.syncedAt || 0) - Number(a.syncedAt || 0));
    sendJson(res, 200, { ok: true, exportedAt: Date.now(), sessions: exportedSessions });
    return;
  }

  if (url.pathname === "/api/import" && req.method === "POST") {
    try {
      const incoming = JSON.parse(await readBody(req));
      const rows = Array.isArray(incoming.sessions) ? incoming.sessions : [incoming.session || incoming];
      const imported = [];
      rows.forEach((row) => {
        const session = normalizeSession(row);
        if (!session) return;
        const currentRevision = Number(sessions.get(session.code)?.revision || 0);
        sessions.set(session.code, {
          ...session,
          serverRevision: currentRevision + 1
        });
        imported.push(session.code);
      });
      if (imported.length) saveSessions();
      sendJson(res, 200, { ok: true, imported });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error.message });
    }
    return;
  }

  if (url.pathname === "/api/health") {
    const active = [...sessions.values()].filter((session) => !sessionSummary(session).stale).length;
    sendJson(res, 200, { ok: true, sessions: sessions.size, active, stale: Math.max(0, sessions.size - active), savedAt: Date.now() });
    return;
  }

  if (url.pathname === "/api/sessions" && req.method === "GET") {
    const activeSessions = [...sessions.values()]
      .filter((session) => ["public", "locked"].includes(session.sessionMode || (session.isPublic ? "public" : "private")))
      .sort((a, b) => Number(b.syncedAt || 0) - Number(a.syncedAt || 0))
      .slice(0, 12)
      .map(sessionSummary);
    sendJson(res, 200, { ok: true, sessions: activeSessions, serverTime: Date.now(), staleAfterMs: staleSessionMs });
    return;
  }

  const locationsMatch = url.pathname.match(/^\/api\/session\/([A-Z0-9-]+)\/locations$/i);
  if (locationsMatch && req.method === "GET") {
    const code = locationsMatch[1].toUpperCase();
    const session = sessions.get(code);
    if (!session) {
      sendJson(res, 404, { ok: false, error: "Session not found" });
      return;
    }
    const agents = Array.isArray(session.agents) ? session.agents : [];
    sendJson(res, 200, {
      ok: true,
      code,
      serverRevision: Number(session.serverRevision || 0),
      inactiveAfterMs: playerInactiveMs,
      agents: agents.map(agentPositionPayload)
    });
    return;
  }

  const heartbeatMatch = url.pathname.match(/^\/api\/session\/([A-Z0-9-]+)\/heartbeat$/i);
  if (heartbeatMatch && req.method === "POST") {
    try {
      const code = heartbeatMatch[1].toUpperCase();
      const incoming = JSON.parse(await readBody(req));
      const session = sessions.get(code);
      if (!session) {
        sendJson(res, 404, { ok: false, error: "Session not found" });
        return;
      }
      const agentId = String(incoming.agentId || "").slice(0, 80);
      if (!agentId) {
        sendJson(res, 400, { ok: false, error: "Missing agentId" });
        return;
      }
      const agents = Array.isArray(session.agents) ? session.agents : [];
      const agent = agents.find((item) => item.id === agentId);
      if (!agent) {
        sendJson(res, 404, { ok: false, error: "Agent not found" });
        return;
      }
      const now = Date.now();
      Object.assign(agent, {
        lastSeen: now,
        clientId: incoming.clientId || agent.clientId || "",
        lat: Number.isFinite(Number(incoming.lat)) ? Number(incoming.lat) : agent.lat,
        lng: Number.isFinite(Number(incoming.lng)) ? Number(incoming.lng) : agent.lng,
        signal: Number.isFinite(Number(incoming.signal)) ? Number(incoming.signal) : agent.signal,
        stamina: Number.isFinite(Number(incoming.stamina)) ? Number(incoming.stamina) : agent.stamina
      });
      session.agents = agents;
      session.syncedAt = now;
      session.serverRevision = Number(session.serverRevision || 0) + 1;
      saveSessions();
      sendJson(res, 200, { ok: true, agentId, lastSeen: now, inactiveAfterMs: playerInactiveMs, session: sessionSummary(session) });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error.message });
    }
    return;
  }

  const chatMatch = url.pathname.match(/^\/api\/session\/([A-Z0-9-]+)\/chat$/i);
  if (chatMatch && req.method === "POST") {
    try {
      const code = chatMatch[1].toUpperCase();
      const incoming = JSON.parse(await readBody(req));
      const session = sessions.get(code);
      if (!session) {
        sendJson(res, 404, { ok: false, error: "Session not found" });
        return;
      }
      const speaker = String(incoming.speaker || "Mission Control").slice(0, 32);
      const text = String(incoming.text || "").trim().slice(0, 140);
      if (!text) {
        sendJson(res, 400, { ok: false, error: "Missing chat text" });
        return;
      }
      const chat = Array.isArray(session.chat) ? session.chat : [];
      const entry = [speaker, text, Date.now(), incoming.clientId || ""];
      chat.push(entry);
      session.chat = chat.slice(-80);
      session.revision = Number(session.revision || 0) + 1;
      session.syncedAt = Date.now();
      session.serverRevision = Number(session.serverRevision || 0) + 1;
      saveSessions();
      sendJson(res, 200, { ok: true, entry, chatCount: session.chat.length, session: sessionSummary(session) });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error.message });
    }
    return;
  }

  const sessionMatch = url.pathname.match(/^\/api\/session\/([A-Z0-9-]+)$/i);
  if (sessionMatch && req.method === "GET") {
    const code = sessionMatch[1].toUpperCase();
    const session = sessions.get(code);
    if (!session) {
      sendJson(res, 404, { ok: false, error: "Session not found" });
      return;
    }
    sendJson(res, 200, { ok: true, session });
    return;
  }

  if (sessionMatch && req.method === "POST") {
    try {
      const code = sessionMatch[1].toUpperCase();
      const incoming = JSON.parse(await readBody(req));
      const current = sessions.get(code);
      const incomingRevision = Number(incoming.revision || 0);
      const currentRevision = Number(current?.revision || 0);

      if (!current || incomingRevision >= currentRevision) {
        sessions.set(code, {
          ...incoming,
          code,
          syncedAt: Date.now(),
          serverRevision: currentRevision + 1
        });
        saveSessions();
      }

      sendJson(res, 200, { ok: true, session: sessions.get(code) });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error.message });
    }
    return;
  }

  if (sessionMatch && req.method === "DELETE") {
    const code = sessionMatch[1].toUpperCase();
    const removed = sessions.delete(code);
    if (removed) saveSessions();
    sendJson(res, 200, { ok: true, removed, code });
    return;
  }

  serveFile(req, res);
});

loadSessions();

server.listen(port, "127.0.0.1", () => {
  console.log(`Signal Lost game server running at http://127.0.0.1:${port}/`);
  console.log(`Session store: ${sessionStoreFile}`);
});