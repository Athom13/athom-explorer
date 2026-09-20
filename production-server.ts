import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import { authMiddleware } from "./auth-server.ts";

const port = Number(process.env.DEMO_PORT || 4141);
const root = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	process.env.DIST_DIR || "packages/demo/dist"
);

const contentTypes: Record<string, string> = {
	".css": "text/css; charset=utf-8",
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".svg": "image/svg+xml",
	".wasm": "application/wasm",
};

async function serveStatic(req: http.IncomingMessage, res: http.ServerResponse) {
	const requestPath = new URL(req.url ?? "/", "http://localhost").pathname;
	const relativePath = decodeURIComponent(requestPath).replace(/^\/+/, "");
	const candidate = path.resolve(root, relativePath || "index.html");
	const file = candidate.startsWith(`${root}${path.sep}`) ? candidate : path.join(root, "index.html");

	try {
		const body = await fs.readFile(file);
		const type = contentTypes[path.extname(file)] ?? "application/octet-stream";
		res.writeHead(200, { "Content-Type": type });
		res.end(body);
	} catch {
		const body = await fs.readFile(path.join(root, "index.html"));
		res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
		res.end(body);
	}
}

const server = http.createServer((req, res) => {
	void authMiddleware(req, res, () => {
		void serveStatic(req, res);
	});
});

server.listen(port, "0.0.0.0", () => {
	console.log(`Scramjet demo listening on port ${port}`);
});
