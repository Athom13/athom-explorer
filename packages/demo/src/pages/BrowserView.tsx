import {
	css,
	type Component,
	createState,
} from "dreamland/core";
import {
	CatchEscapedLinksPlugin,
	UrlWatcherPlugin,
} from "@mercuryworkshop/scramjet-utils";
import { rewriteUrl, versionInfo } from "@mercuryworkshop/scramjet";
import { cachePlugin, controller } from "..";
import { demoSettingsStore } from "../store";
import homepage from "./homepage.html?raw";
import type { Frame } from "@mercuryworkshop/scramjet-controller";

const COMET_SETTINGS_STORAGE_KEY = "scramjet-demo-comet-settings";

export const browserState = createState({
	url: demoSettingsStore.homeUrl,
	inputUrl: demoSettingsStore.homeUrl,
	frame: null! as Frame,
	tabs: [] as BrowserTab[],
	activeTabId: "",
});

export type BrowserTab = {
	id: string;
	url: string;
	proxyUrl: string;
	title: string;
	frame: Frame;
	iframe: HTMLIFrameElement;
};

export let addTab = () => {};
export let closeTab = (_id: string) => {};
export let selectTab = (_id: string) => {};
export let navigateTo = (_url: string) => {};

export const Omnibox: Component = function (cx) {
	const navigate = () => {
		navigateTo(browserState.inputUrl);
	};
	return (
		<form
			class="url-form"
			on:submit={(e: SubmitEvent) => {
				e.preventDefault();
				navigate();
			}}
		>
			<div class="browser-omnibox-shell">
				<div class="omnibox-nav" aria-hidden="true">
					<button
						type="button"
						class="nav-btn"
						on:click={() => browserState.frame?.back()}
					>
						<span class="material-symbols-outlined">arrow_back</span>
					</button>
					<button
						type="button"
						class="nav-btn"
						on:click={() => browserState.frame?.forward()}
					>
						<span class="material-symbols-outlined">arrow_forward</span>
					</button>
					<button
						type="button"
						class="nav-btn"
						on:click={() => browserState.frame?.reload()}
					>
						<span class="material-symbols-outlined">refresh</span>
					</button>
				</div>
				<input
					id="search"
					class="url-input"
					type="text"
					value={use(browserState.inputUrl)}
					on:input={(event: InputEvent) => {
						browserState.inputUrl = (event.target as HTMLInputElement).value;
					}}
					spellcheck="false"
					placeholder="Saisissez une URL ou recherchez..."
				/>
			</div>
		</form>
	);
};

export const BrowserTabs: Component = function () {
	return (
		<div class="browser-tabs">
			{use(browserState.tabs).map((tabs) =>
				tabs.map((tab) => (
					<div
						class={use(browserState.activeTabId).map(
							(activeTabId) =>
								`browser-tab ${activeTabId === tab.id ? "active" : ""}`
						)}
						on:click={() => selectTab(tab.id)}
					>
						<span class="browser-tab-title">{tab.title}</span>
						<button
							type="button"
							class="browser-tab-close"
							aria-label="Fermer l'onglet"
							on:click={(event: MouseEvent) => {
								event.stopPropagation();
								closeTab(tab.id);
							}}
						>
							<span class="material-symbols-outlined">close</span>
						</button>
					</div>
				))
			)}
			<button
				type="button"
				class="browser-tab-new"
				aria-label="Nouvel onglet"
				on:click={() => addTab()}
			>
				<span class="material-symbols-outlined">add</span>
			</button>
		</div>
	);
};

BrowserTabs.style = css`
	:scope {
		display: flex;
		align-items: stretch;
		gap: 2px;
		min-height: 30px;
		padding: 2px 4px 0;
		background: rgb(255 255 255 / 3%);
		border-bottom: 1px solid rgb(255 255 255 / 10%);
		overflow-x: auto;
	}
	.browser-tab {
		display: flex;
		align-items: center;
		gap: 0.35em;
		min-width: 120px;
		max-width: 220px;
		padding: 0 0.35em 0 0.65em;
		background: rgb(255 255 255 / 5%);
		border: 1px solid rgb(255 255 255 / 10%);
		border-radius: 9px 9px 0 0;
		color: #9ca3af;
		cursor: pointer;
		box-shadow: inset 0 1px rgb(255 255 255 / 5%);
	}
	.browser-tab.active {
		background: rgb(255 255 255 / 14%);
		border-color: rgb(255 255 255 / 25%);
		color: #f3f4f6;
		box-shadow: inset 0 1px rgb(255 255 255 / 18%), 0 4px 12px rgb(0 0 0 / 18%);
	}
	.browser-tab-title {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.78em;
	}
	.browser-tab-close,
	.browser-tab-new {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		padding: 0;
		border: 0;
		border-radius: 3px;
		background: transparent;
		color: #8f8f8f;
		cursor: pointer;
	}
	.browser-tab-close:hover,
	.browser-tab-new:hover {
		background: rgb(255 255 255 / 14%);
		color: #fff;
	}
`;

Omnibox.style = css`
	:scope {
		display: flex;
		align-items: center;
		/*padding: 0.25em 0.45em;*/
		background: #0f0f0f;
		border-bottom: 1px solid #2a2a2a;
		min-width: 0;
		width: 100%;
	}
	.browser-omnibox-shell {
		display: flex;
		width: 100%;
		align-items: center;
		gap: 0.35em;
		min-width: 0;
		border: 0;
		background: transparent;
		padding: 0;
		flex: 1;
	}
	.omnibox-nav {
		display: flex;
		align-items: center;
		gap: 0.15em;
		padding-right: 0.25em;
		border-right: 1px solid #2a2a2a;
	}
	.nav-btn {
		border: 0;
		background: transparent;
		color: #8f8f8f;
		width: 1.5em;
		height: 1.5em;
		padding: 0;
		border-radius: 3px;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
	.nav-btn:hover {
		background: #1f1f1f;
		color: #d0d0d0;
	}
	.browser-omnibox-shell .material-symbols-outlined {
		font-size: 15px !important;
		line-height: 1 !important;
		font-variation-settings:
			"OPSZ" 20,
			"wght" 300,
			"FILL" 0,
			"GRAD" 0;
	}
	.url-input {
		box-sizing: border-box;
		width: 100%;
		padding: 0.22em 0.18em;
		font-size: 0.9em;
		border: 1px solid transparent;
		border-radius: 3px;
		background: transparent;
		color: #e5e7eb;
		outline: none;
	}
	.url-input::placeholder {
		color: #6f7680;
	}
`;

const BrowserView: Component<
	{
		active: boolean;
	},
	{},
	{
		tabContainer: HTMLDivElement;
	}
> = function (cx) {
	cx.mount = async () => {
		await controller.wait();
		let realHomepage = homepage;
		realHomepage = realHomepage.replaceAll(
			"{{SCRAMJET_VERSION}}",
			String(versionInfo.version)
		);
		realHomepage = realHomepage.replaceAll(
			"{{SCRAMJET_BUILD}}",
			String(versionInfo.build)
		);
		realHomepage = realHomepage.replaceAll(
			"{{SCRAMJET_DATE_PRETTY}}",
			new Date(versionInfo.date).toLocaleString(undefined, {
				dateStyle: "short",
				timeStyle: "short",
			})
		);
		const homepageBytes = new TextEncoder().encode(realHomepage);
		const homepageBinary = Array.from(homepageBytes, (byte) =>
			String.fromCharCode(byte)
		).join("");
		const homepageSource = `data:text/html;base64,${btoa(homepageBinary)}`;
		const initialGoto = new URL(location.href).searchParams.get("goto");

		const encodeForFrame = (frame: Frame, url: string) =>
			rewriteUrl(url, frame.context, {
				//@ts-expect-error
				origin: new URL(location.href),
				//@ts-expect-error
				base: new URL(location.href),
			});

		const updateActiveTab = (tab: BrowserTab) => {
			browserState.activeTabId = tab.id;
			browserState.frame = tab.frame;
			browserState.url = tab.url;
			browserState.inputUrl = tab.url;
			for (const current of browserState.tabs) {
				current.iframe.style.display = current.id === tab.id ? "block" : "none";
			}
		};

		const onHomeSearch = (event: MessageEvent) => {
			const sourceTab = browserState.tabs.find(
				(tab) => tab.iframe.contentWindow === event.source
			);
			if (!sourceTab) {
				return;
			}

			if (
				event.data?.type === "scramjet-home-search" &&
				typeof event.data.url === "string"
			) {
				navigateTo(event.data.url);
				return;
			}

			if (event.data?.type === "scramjet-comet-settings-load-request") {
				let settings: unknown = null;
				try {
					const saved = localStorage.getItem(COMET_SETTINGS_STORAGE_KEY);
					settings = saved ? JSON.parse(saved) : null;
				} catch {
					settings = null;
				}
				event.source?.postMessage(
					{ type: "scramjet-comet-settings-load", settings },
					{ targetOrigin: "*" }
				);
				return;
			}

			if (
				event.data?.type === "scramjet-comet-settings-save" &&
				event.data.settings &&
				typeof event.data.settings === "object"
			) {
				try {
					localStorage.setItem(
						COMET_SETTINGS_STORAGE_KEY,
						JSON.stringify(event.data.settings)
					);
				} catch {
					// Persistence is optional if storage is disabled.
				}
			}
		};
		window.addEventListener("message", onHomeSearch);

		const createTab = (url: string, isNewTab = false) => {
			const iframe = document.createElement("iframe");
			iframe.title = "Browser tab";
			iframe.style.display = "none";
			iframe.style.position = "absolute";
			iframe.style.inset = "0";
			iframe.style.width = "100%";
			iframe.style.height = "100%";
			iframe.style.border = "none";
			this.tabContainer.append(iframe);

			const tab: BrowserTab = {
				id: crypto.randomUUID(),
				url,
				proxyUrl: isNewTab ? homepageSource : "",
				title: "Nouvel onglet",
				frame: null! as Frame,
				iframe,
			};
			const updateTabTitle = () => {
				try {
					const pageTitle = iframe.contentDocument?.title.trim();
					if (pageTitle) {
						tab.title = pageTitle;
						browserState.tabs = [...browserState.tabs];
						return;
					}
				} catch {
					// Cross-origin pages may not expose their document title.
				}
				try {
					tab.title = new URL(tab.url).hostname || "Nouvel onglet";
				} catch {
					tab.title = "Nouvel onglet";
				}
				browserState.tabs = [...browserState.tabs];
			};
			iframe.addEventListener("load", updateTabTitle);
			const urlWatcher = new UrlWatcherPlugin((nextUrl) => {
				tab.url = nextUrl;
				tab.proxyUrl = tab.frame.element.src;
				updateTabTitle();
				if (browserState.activeTabId === tab.id) {
					browserState.url = nextUrl;
					browserState.inputUrl = nextUrl;
				}
				browserState.tabs = [...browserState.tabs];
			});
			const catchEscapedLinks = new CatchEscapedLinksPlugin(
				(nextUrl) =>
					new URL(`/?goto=${encodeURIComponent(nextUrl.href)}`, location.origin)
			);
			tab.frame = controller.createFrame(iframe, {
				plugins: [cachePlugin, urlWatcher, catchEscapedLinks],
			});
			iframe.src = homepageSource;
			if (!isNewTab) tab.proxyUrl = encodeForFrame(tab.frame, url);
			browserState.tabs = [...browserState.tabs, tab];
			updateActiveTab(tab);
			if (!isNewTab) tab.frame.go(url);
		};

		addTab = () => createTab("", true);
		selectTab = (id) => {
			const tab = browserState.tabs.find((current) => current.id === id);
			if (tab) updateActiveTab(tab);
		};
		closeTab = (id) => {
			if (browserState.tabs.length === 1) return;
			const index = browserState.tabs.findIndex((tab) => tab.id === id);
			const closingActiveTab = browserState.activeTabId === id;
			const remaining = browserState.tabs.filter((tab) => tab.id !== id);
			browserState.tabs.find((tab) => tab.id === id)?.iframe.remove();
			browserState.tabs = remaining;
			if (closingActiveTab) {
				updateActiveTab(remaining[Math.max(0, index - 1)]);
			}
		};
		navigateTo = (rawUrl) => {
			const tab = browserState.tabs.find(
				(current) => current.id === browserState.activeTabId
			);
			if (!tab) return;
			const url = rawUrl.trim().startsWith("http")
				? rawUrl.trim()
				: `https://${rawUrl.trim()}`;
			tab.url = url;
			tab.proxyUrl = encodeForFrame(tab.frame, url);
			tab.frame.go(url);
			demoSettingsStore.homeUrl = url;
			browserState.url = url;
			browserState.inputUrl = url;
			browserState.tabs = [...browserState.tabs];
		};

		createTab("", true);
		if (initialGoto) {
			navigateTo(initialGoto);
			history.replaceState(null, "", location.href.split("?")[0]);
		}
	};

	return (
		<div
			class={use(this.active).map(
				(active) => `tab-panel browser-view ${active ? "active" : ""}`
			)}
		>
			<div class="browser-frame-container" this={use(this.tabContainer)}></div>
		</div>
	);
};

BrowserView.style = css`
	:scope {
		flex: 1;
		width: 100%;
		min-width: 0;
		min-height: 0;
		display: none;
		flex-direction: column;
	}
	:scope.active {
		display: flex;
	}
	.browser-frame-container {
		position: relative;
		flex: 1;
		min-width: 0;
		min-height: 0;
	}

	iframe {
		position: absolute;
		inset: 0;
		background: white;
		width: 100%;
		height: 100%;
		border: none;
	}
`;

export default BrowserView;
