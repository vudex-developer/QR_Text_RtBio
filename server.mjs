import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  createInitialDatabase,
  createJsonDatabase,
} from "./src/serverData.js";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const dataDir = process.env.DATA_DIR || join(rootDir, "data");
const dataPath = join(dataDir, "rtbio-db.json");
const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 4175);

const database = createJsonDatabase({
  initialData: await readDatabase(),
  write: writeDatabase,
});

const server = createServer(async (request, response) => {
  try {
    await route(request, response);
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { error: "internal_server_error" });
  }
});

server.listen(port, host, () => {
  console.log(`RTBIO survey server running at http://${host}:${port}/`);
});

async function route(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (url.pathname.startsWith("/api/")) {
    await routeApi(request, response, url);
    return;
  }

  await serveStatic(response, url.pathname);
}

async function routeApi(request, response, url) {
  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, { ok: true, service: "rtbio-survey-app" });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/records") {
    sendJson(response, 200, await database.listRecords());
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/export.csv") {
    sendText(response, 200, await database.exportCsv(), "text/csv; charset=utf-8");
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/record") {
    const record = await database.findByCode(url.searchParams.get("code"));
    sendJson(response, record ? 200 : 404, record ?? { error: "not_found" });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/submissions") {
    const body = await readJson(request);
    sendJson(response, 201, await database.createSubmission(body.lead, body.answers));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/redemptions") {
    const body = await readJson(request);
    const result = await database.redeem(body.code, body.redeemedBy);
    sendJson(response, result.ok ? 200 : 409, result);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/duplicates") {
    sendJson(response, 200, await database.findDuplicates(await readJson(request)));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/questions") {
    sendJson(response, 200, await database.loadQuestions());
    return;
  }

  if (request.method === "PUT" && url.pathname === "/api/questions") {
    sendJson(response, 200, await database.saveQuestions(await readJson(request)));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/questions/reset") {
    sendJson(response, 200, await database.resetQuestions());
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/event-settings") {
    sendJson(response, 200, await database.loadEventSettings());
    return;
  }

  if (request.method === "PUT" && url.pathname === "/api/event-settings") {
    sendJson(response, 200, await database.saveEventSettings(await readJson(request)));
    return;
  }

  sendJson(response, 404, { error: "not_found" });
}

async function serveStatic(response, pathname) {
  const safePath = normalize(pathname === "/" ? "/index.html" : pathname).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(rootDir, safePath);

  if (!filePath.startsWith(rootDir)) {
    sendText(response, 403, "Forbidden");
    return;
  }

  try {
    const content = await readFile(filePath);
    sendBuffer(response, 200, content, contentType(filePath));
  } catch {
    sendText(response, 404, "Not found");
  }
}

async function readDatabase() {
  try {
    return JSON.parse(await readFile(dataPath, "utf8"));
  } catch {
    return createInitialDatabase();
  }
}

async function writeDatabase(value) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataPath, `${JSON.stringify(value, null, 2)}\n`);
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function sendJson(response, status, value) {
  sendText(response, status, JSON.stringify(value), "application/json; charset=utf-8");
}

function sendText(response, status, text, type = "text/plain; charset=utf-8") {
  response.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
  });
  response.end(text);
}

function sendBuffer(response, status, buffer, type) {
  response.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
  });
  response.end(buffer);
}

function contentType(filePath) {
  const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
  };

  return types[extname(filePath)] ?? "application/octet-stream";
}
