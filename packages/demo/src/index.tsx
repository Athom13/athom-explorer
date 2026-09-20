import LoadInterstitial from "./components/LoadInterstitial";
import App from "./App";
import LibcurlClient from "@mercuryworkshop/libcurl-transport";
import EpoxyClient from "@mercuryworkshop/epoxy-transport";
import { defaultConfigDev } from "@mercuryworkshop/scramjet";
import { Controller } from "@mercuryworkshop/scramjet-controller";
import { HttpCachePlugin } from "@mercuryworkshop/scramjet-utils";
import { demoSettingsStore, normalizeWispUrl } from "./store";
import AuthPage from "./components/AuthPage";

const originalDocumentTitle = document.title;

let app = document.getElementById("app")!;

let controller: InstanceType<typeof Controller>;
const cachePlugin = new HttpCachePlugin();

export function getTransport(): LibcurlClient | EpoxyClient {
	const wispUrl = normalizeWispUrl(demoSettingsStore.wispUrl);
	switch (demoSettingsStore.transport) {
		case "epoxy":
			return new EpoxyClient({ wisp: wispUrl });
		case "libcurl":
		default:
			return new LibcurlClient({ wisp: wispUrl });
	}
}

async function waitForControllerOrReady(timeoutMs = 10000): Promise<void> {
	if (navigator.serviceWorker.controller) return;

	const ready = navigator.serviceWorker.ready.then(() => {});
	const controllerChanged = new Promise<void>((resolve) => {
		const onChange = () => {
			navigator.serviceWorker.removeEventListener("controllerchange", onChange);
			resolve();
		};
		navigator.serviceWorker.addEventListener("controllerchange", onChange, {
			once: true,
		} as any);
	});
	const timeout = new Promise<void>((resolve) =>
		setTimeout(resolve, timeoutMs)
	);

	// Wait for whichever happens first; on timeout we continue to avoid blocking the UI.
	await Promise.race([ready, controllerChanged, timeout]);
}

async function init(): Promise<boolean> {
	const interstitial: any = (
		<LoadInterstitial status={"Loading"}></LoadInterstitial>
	);
	document.body.append(interstitial);
	interstitial.showModal();

	try {
		const registration = await navigator.serviceWorker.register("./sw.js");

		// Non-blocking progress updates on state transitions.
		const updateStatus = (sw: ServiceWorker | null) => {
			if (!sw) return;
			const set = (msg: string) => (interstitial.$.state.status = msg);
			const apply = () => {
				switch (sw.state) {
					case "installing":
						set("Installing service worker...");
						break;
					case "installed":
						set("Service worker installed, waiting to activate...");
						break;
					case "activating":
						set("Activating service worker...");
						break;
					case "activated":
						set("Service worker activated");
						break;
					case "redundant":
						set("Service worker became redundant");
						break;
				}
			};
			apply();
			sw.addEventListener("statechange", apply);
		};

		updateStatus(registration.installing ?? registration.waiting ?? null);

		// Wait for control or readiness with a timeout; don't hang the UI on updates.
		interstitial.$.state.status =
			"Waiting for service worker to take control...";
		await waitForControllerOrReady(10000);
		interstitial.$.state.status =
			"Service worker ready, waiting for controller init";
		const readySw = navigator.serviceWorker.controller ?? registration.active;
		if (!readySw) {
			throw new Error("No service worker available for controller");
		}
		controller = new Controller({
			serviceworker: readySw,
			transport: getTransport(),
			scramjetConfig: defaultConfigDev,
		});
		await controller.wait();
		console.log(controller);
		interstitial.$.state.status = "Controller initialized";
		interstitial.close();
		return true;
	} catch (e) {
		console.error("Error during service worker registration:", e);
		// Always close the modal on error to prevent hanging UI.
		try {
			interstitial.close();
		} catch {}
		app.innerText =
			"Failed to register service worker. Check console for details.";
		return false;
	}
}

async function mount(attempt = 0): Promise<void> {
	try {
		const root = <App />;
		app.replaceWith(root);
	} catch (e) {
		if (attempt < 3 && e instanceof TypeError && e.message.includes("cssRules")) {
			await new Promise((resolve) => setTimeout(resolve, 50));
			app = document.getElementById("app") ?? app;
			return mount(attempt + 1);
		}
		let err = e as any;
		app.replaceWith(
			document.createTextNode(
				`Error mounting: ${"message" in err ? err.message : err}`
			)
		);
		console.error(err);
		throw e;
	}
}

async function requireAuthentication() {
	const response = await fetch("/api/auth/status");
	const status = (await response.json()) as { enabled: boolean; authenticated: boolean };
	if (!status.enabled || status.authenticated) return;
	await new Promise<void>((resolve) => {
		const auth = <AuthPage onAuthenticated={resolve} />;
		document.body.append(auth);
	});
	document.querySelector(".auth-page")?.remove();
}

requireAuthentication().then(async () => {
		if (await init()) await mount();
	});
export { controller, cachePlugin };

function applyTabCloak() {
	const presets: Record<string, { name: string; icon: string }> = {
		google: {
			name: "Google",
			icon: "https://www.google.com/s2/favicons?domain=google.com&sz=64",
		},
		wikipedia: {
			name: "Wikipedia",
			icon: "https://www.google.com/s2/favicons?domain=wikipedia.org&sz=64",
		},
		athom : {
				name: "Athom Explorer",
				icon: "https://cdn-icons-png.flaticon.com/512/639/639347.png",
			},
	};
	const preset = presets[demoSettingsStore.tabCloakPreset];
	document.title =
		demoSettingsStore.tabCloakPreset === "custom"
			? demoSettingsStore.customTabName || originalDocumentTitle
			: preset?.name || originalDocumentTitle;
	const icon =
		demoSettingsStore.tabCloakPreset === "custom"
			? demoSettingsStore.customIconUrl
			: preset?.icon || "";
	let link = document.querySelector<HTMLLinkElement>("link[data-tab-cloak]");
	if (!link) {
		link = document.createElement("link");
		link.dataset.tabCloak = "true";
		link.rel = "icon";
		document.head.append(link);
	}
	link.href = icon;
}

function setupPanicKey() {
	window.addEventListener("keydown", (event) => {
		if (!demoSettingsStore.panicKey || event.key !== demoSettingsStore.panicKey) return;
		const urls = demoSettingsStore.panicUrls.split(",").filter(Boolean);
		const url = urls[Math.floor(Math.random() * urls.length)];
		if (url) window.location.assign(url);
	});
}

applyTabCloak();
setupPanicKey();
