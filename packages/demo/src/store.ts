import { createStore } from "dreamland/core";

export type AvailableTransports = "libcurl" | "epoxy";

export const AVAILABLE_TRANSPORTS: ReadonlyArray<{
	value: AvailableTransports;
	label: string;
}> = [
	{ value: "libcurl", label: "Libcurl" },
	{ value: "epoxy", label: "Epoxy" },
];
const DEFAULT_WISP_URL = import.meta.env.VITE_WISP_URL || "wss://anura.pro";
export const DEFAULT_WISP_SERVERS = [
	DEFAULT_WISP_URL,
	"wss://aaa-hurricane-tuner-volunteers.trycloudflare.com/",
	"wss://explorer.athom.lol/wisp/",
	"wss://anura.pro/",
].filter((url, index, list) => list.indexOf(url) === index);
const DEFAULT_TRANSPORT: AvailableTransports = "libcurl";
const DEFAULT_HOME_URL = "https://google.com";
const DEFAULT_MAX_REQUESTS = 200;
const DEFAULT_PANIC_KEY = "";
const DEFAULT_PANIC_URLS = "https://classroom.google.com/";
const DEFAULT_TAB_CLOAK_PRESET = "athom";
const DEFAULT_CUSTOM_TAB_NAME = "";
const DEFAULT_CUSTOM_ICON_URL = "";

export const demoSettingsStore = createStore(
	{
		transport: DEFAULT_TRANSPORT as AvailableTransports,
		wispUrl: DEFAULT_WISP_URL,
		wispServers: DEFAULT_WISP_SERVERS,
		homeUrl: DEFAULT_HOME_URL,
		maxRequests: DEFAULT_MAX_REQUESTS,
		panicKey: DEFAULT_PANIC_KEY,
		panicUrls: DEFAULT_PANIC_URLS,
		tabCloakPreset: DEFAULT_TAB_CLOAK_PRESET,
		customTabName: DEFAULT_CUSTOM_TAB_NAME,
		customIconUrl: DEFAULT_CUSTOM_ICON_URL,
	},
	{
		ident: "scramjet-demo-settings",
		backing: "localstorage",
		autosave: "auto",
	}
);

export function normalizeWispUrl(value: string) {
	const trimmed = value.trim();
	if (!trimmed) {
		throw new TypeError("Wisp URL is required.");
	}

	let normalized = trimmed;
	if (!normalized.startsWith("ws://") && !normalized.startsWith("wss://")) {
		normalized = `ws://${normalized}`;
	}

	const parsed = new URL(normalized);
	if (!parsed.pathname || parsed.pathname === "") {
		parsed.pathname = "/";
	}
	if (!parsed.pathname.endsWith("/")) {
		parsed.pathname = `${parsed.pathname}/`;
	}

	return parsed.toString();
}

export function normalizeHomeUrl(value: string) {
	const trimmed = value.trim();
	if (!trimmed) {
		throw new TypeError("Home page URL is required.");
	}

	const normalized = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)
		? trimmed
		: `https://${trimmed}`;

	return new URL(normalized).toString();
}

export function normalizeTransport(value: string): AvailableTransports {
	if (AVAILABLE_TRANSPORTS.some((t) => t.value === value)) {
		return value as AvailableTransports;
	}
	throw new TypeError(`Unknown transport: ${value}`);
}

export function normalizeMaxRequests(value: string | number) {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) {
		throw new TypeError("Request log limit must be a number.");
	}

	const rounded = Math.round(parsed);
	if (rounded < 10 || rounded > 5000) {
		throw new RangeError("Request log limit must be between 10 and 5000.");
	}

	return rounded;
}

export function normalizePanicUrls(value: string) {
	const urls = value
		.split(",")
		.map((url) => url.trim())
		.filter(Boolean)
		.map(normalizeHomeUrl);
	if (!urls.length) {
		throw new TypeError("Au moins une URL d’urgence est requise.");
	}
	return urls.join(",");
}

export function normalizeTabCloakPreset(value: string) {
	if (["none", "google", "wikipedia","athom", "custom"].includes(value)) return value;
	throw new TypeError("Preset de camouflage inconnu.");
}

export function normalizeOptionalText(value: string) {
	return value.trim();
}

export function normalizeIconUrl(value: string) {
	const trimmed = value.trim();
	if (!trimmed) return "";
	return new URL(trimmed, window.location.href).toString();
}

export const demoSettingsDefaults = {
	wispUrl: normalizeWispUrl(DEFAULT_WISP_URL),
	wispServers: DEFAULT_WISP_SERVERS.map(normalizeWispUrl),
	transport: DEFAULT_TRANSPORT,
	homeUrl: normalizeHomeUrl(DEFAULT_HOME_URL),
	maxRequests: DEFAULT_MAX_REQUESTS,
	panicKey: DEFAULT_PANIC_KEY,
	panicUrls: normalizePanicUrls(DEFAULT_PANIC_URLS),
	tabCloakPreset: DEFAULT_TAB_CLOAK_PRESET,
	customTabName: DEFAULT_CUSTOM_TAB_NAME,
	customIconUrl: DEFAULT_CUSTOM_ICON_URL,
};
