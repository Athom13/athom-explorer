import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type http from "node:http";

const SESSION_DAYS = 30;
const COOKIE_NAME = "scramjet_session";
const authFile = process.env.SCRAMJET_AUTH_FILE ?? path.resolve(".scramjet-auth.json");

type AuthData = {
	enabled: boolean;
	salt: string;
	hash: string;
	secret: string;
};

let dataPromise: Promise<AuthData> | undefined;

function newAuthData(): AuthData {
	return {
		enabled: false,
		salt: crypto.randomBytes(16).toString("hex"),
		hash: "",
		secret: crypto.randomBytes(32).toString("hex"),
	};
}

async function loadData(): Promise<AuthData> {
	if (!dataPromise) {
		dataPromise = fs
			.readFile(authFile, "utf8")
			.then((value) => JSON.parse(value) as AuthData)
			.catch(() => newAuthData());
	}
	return dataPromise;
}

async function saveData(data: AuthData) {
	dataPromise = Promise.resolve(data);
	await fs.writeFile(authFile, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 });
}

function hashPassword(password: string, salt: string) {
	return crypto.scryptSync(password, salt, 64).toString("hex");
}

function passwordsMatch(password: string, data: AuthData) {
	if (!data.hash) return false;
	const actual = Buffer.from(hashPassword(password, data.salt), "hex");
	const expected = Buffer.from(data.hash, "hex");
	return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function sessionCookie(data: AuthData) {
	const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
	const value = `${expires}.${crypto.createHmac("sha256", data.secret).update(String(expires)).digest("hex")}`;
	return `${COOKIE_NAME}=${value}; Max-Age=${SESSION_DAYS * 24 * 60 * 60}; Path=/; HttpOnly; SameSite=Lax`;
}

function isAuthenticated(req: http.IncomingMessage, data: AuthData) {
	if (!data.enabled) return true;
	const cookies = req.headers.cookie ?? "";
	const value = cookies
		.split(";")
		.map((part) => part.trim())
		.find((part) => part.startsWith(`${COOKIE_NAME}=`))
		?.slice(COOKIE_NAME.length + 1);
	if (!value) return false;
	const [expires, signature] = value.split(".");
	if (!expires || !signature || Number(expires) < Date.now()) return false;
	const expected = crypto.createHmac("sha256", data.secret).update(expires).digest("hex");
	return signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

async function readJson(req: http.IncomingMessage) {
	let body = "";
	for await (const chunk of req) body += chunk;
	return JSON.parse(body || "{}") as Record<string, unknown>;
}

function sendJson(res: http.ServerResponse, status: number, value: unknown, headers: Record<string, string> = {}) {
	res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...headers });
	res.end(JSON.stringify(value));
}

export async function authMiddleware(req: http.IncomingMessage, res: http.ServerResponse, next: () => void) {
	const url = new URL(req.url ?? "/", "http://localhost");
	if (!url.pathname.startsWith("/api/auth/")) {
		next();
		return;
	}

	const data = await loadData();
	try {
		if (req.method === "GET" && url.pathname === "/api/auth/status") {
			sendJson(res, 200, { enabled: data.enabled, authenticated: isAuthenticated(req, data) });
			return;
		}
		if (req.method === "POST" && url.pathname === "/api/auth/login") {
			const body = await readJson(req);
			if (!data.enabled || typeof body.password !== "string" || passwordsMatch(body.password, data)) {
				sendJson(res, 200, { authenticated: true }, { "Set-Cookie": sessionCookie(data) });
			} else {
				sendJson(res, 401, { error: "Mot de passe incorrect." });
			}
			return;
		}
		if (req.method === "POST" && url.pathname === "/api/auth/config") {
			if (!isAuthenticated(req, data)) {
				sendJson(res, 401, { error: "Authentification requise." });
				return;
			}
			const body = await readJson(req);
			const enabled = body.enabled === true;
			const password = typeof body.password === "string" ? body.password : "";
			if (enabled && !password && !data.hash) {
				sendJson(res, 400, { error: "Un mot de passe est requis pour activer la protection." });
				return;
			}
			const nextData = { ...data, enabled };
			if (password) {
				nextData.salt = crypto.randomBytes(16).toString("hex");
				nextData.hash = hashPassword(password, nextData.salt);
				nextData.secret = crypto.randomBytes(32).toString("hex");
			}
			await saveData(nextData);
			sendJson(res, 200, { enabled });
			return;
		}
		sendJson(res, 404, { error: "Endpoint introuvable." });
	} catch (error) {
		sendJson(res, 400, { error: error instanceof Error ? error.message : "Requête invalide." });
	}
}