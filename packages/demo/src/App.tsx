import { css, type Component } from "dreamland/core";
import FlagEditor from "./components/FlagEditor";
import BrowserView, { BrowserTabs } from "./pages/BrowserView";
import RequestViewer from "./pages/RequestViewer";
import PlaygroundView from "./pages/Playground";
import SettingsView from "./pages/SettingsPage";
import { Omnibox } from "./pages/BrowserView";
import { requestsState } from "./pages/RequestViewer";

const App: Component<
	{},
	{},
	{
		activeTab: "browser" | "requests" | "playground" | "settings";
	}
> = function (cx) {
	this.activeTab ??= "browser";
	const site = (
		<div class="app-content">
			<div class="top-bar">
				<div class="tab-bar">
					<button
						class={use(this.activeTab).map(
							(tab) => `tab-button ${tab === "browser" ? "active" : ""}`
						)}
						on:click={() => {
							this.activeTab = "browser";
						}}
					>
						Navigateur
					</button>
					<button
						class={use(this.activeTab).map(
							(tab) => `tab-button ${tab === "requests" ? "active" : ""}`
						)}
						on:click={() => {
							this.activeTab = "requests";
						}}
					>
						Requêtes{" "}
						{use(requestsState.requests).map((requests) =>
							requests.length ? `(${requests.length})` : ""
						)}
					</button>
					<button
						class={use(this.activeTab).map(
							(tab) => `tab-button ${tab === "playground" ? "active" : ""}`
						)}
						on:click={() => {
							this.activeTab = "playground";
						}}
					>
						Atelier
					</button>
					<button
						class={use(this.activeTab).map(
							(tab) => `tab-button ${tab === "settings" ? "active" : ""}`
						)}
						on:click={() => {
							this.activeTab = "settings";
						}}
					>
						Paramètres
					</button>
				</div>
				<div class="top-actions">
					<FlagEditor inline={true} />
				</div>
			</div>
			{use(this.activeTab).map((tab) =>
				tab === "browser" ? (
					<div class="browser-chrome">
						<BrowserTabs />
						<Omnibox />
					</div>
				) : null
			)}
			<div
				class={use(this.activeTab).map(
					(tab) =>
						`tab-panel browser-panel ${tab === "browser" ? "active" : ""}`
				)}
			>
				<BrowserView
					active={use(this.activeTab).map((tab) => tab === "browser")}
				/>
			</div>
			<div
				class={use(this.activeTab).map(
					(tab) =>
						`tab-panel requests-panel ${tab === "requests" ? "active" : ""}`
				)}
			>
				<RequestViewer
					active={use(this.activeTab).map((tab) => tab === "requests")}
				/>
			</div>
			<div
				class={use(this.activeTab).map(
					(tab) =>
						`tab-panel playground-panel ${tab === "playground" ? "active" : ""}`
				)}
			>
				<PlaygroundView
					active={use(this.activeTab).map((tab) => tab === "playground")}
				/>
			</div>
			<div
				class={use(this.activeTab).map(
					(tab) =>
						`tab-panel settings-tab ${tab === "settings" ? "active" : ""}`
				)}
			>
				<SettingsView />
			</div>
		</div>
	);
	return <div class="app-shell">{site}</div>;
};

App.style = css`
	@import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,400,0,0");

	:scope {
		width: 100vw;
		height: 100vh;
		display: flex;
		flex-direction: column;
		margin: 0;
		overflow: hidden;
		position: absolute;
		top: 0;
		left: 0;

		padding: 0;
		background:
			radial-gradient(circle at 15% 0%, #252525 0, transparent 38%),
			#080808;
		box-sizing: border-box;
	}
	.app-content {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		min-width: 0;
		min-height: 0;
	}
	.material-symbols-outlined {
		font-family: "Material Symbols Outlined";
		font-weight: normal;
		font-style: normal;
		font-size: 11px;
		line-height: 1;
		letter-spacing: normal;
		text-transform: none;
		display: inline-block;
		white-space: nowrap;
		word-wrap: normal;
		direction: ltr;
		-webkit-font-smoothing: antialiased;
	}
	.top-bar {
		display: flex;
		align-items: stretch;
		gap: 8px;
		margin: 6px 8px 0;
		padding: 4px;
		border: 1px solid rgb(255 255 255 / 12%);
		border-radius: 12px;
		background: rgb(25 25 25 / 72%);
		box-shadow: 0 8px 24px rgb(0 0 0 / 24%);
		backdrop-filter: blur(14px);
	}
	.tab-bar {
		display: flex;
		flex: 1;
		align-items: stretch;
		gap: 4px;
		min-width: 0;
	}
	.tab-button {
		border: 1px solid rgb(255 255 255 / 8%);
		background: rgb(255 255 255 / 3%);
		color: #a8a8a8;
		padding: 0.24em 0.62em;
		border-radius: 9px;
		cursor: pointer;
		font-size: 0.84em;
		line-height: 1.2;
		min-height: 28px;
		margin: 0;
		white-space: nowrap;
		display: inline-flex;
		align-items: center;
	}
	.tab-button:hover {
		background: rgb(255 255 255 / 10%);
		border-color: rgb(255 255 255 / 18%);
		color: #d0d0d0;
	}
	.tab-button.active {
		background: rgb(255 255 255 / 14%);
		color: #fff;
		border-color: rgb(255 255 255 / 28%);
		box-shadow: inset 0 1px rgb(255 255 255 / 16%), 0 4px 12px rgb(0 0 0 / 18%);
	}
	.top-actions {
		display: flex;
		align-items: center;
		margin-left: auto;
		padding: 0 0.35em;
		min-height: 28px;
	}
	.browser-chrome {
		display: flex;
		flex-direction: column;
		min-width: 0;
		margin: 6px 8px 6px;
		border: 1px solid rgb(255 255 255 / 12%);
		border-radius: 12px;
		overflow: hidden;
		background: rgb(20 20 20 / 60%);
		box-shadow: 0 8px 24px rgb(0 0 0 / 20%);
		backdrop-filter: blur(14px);
	}
	.tab-panel {
		flex: 1;
		width: 100%;
		min-width: 0;
		min-height: 0;
		display: none;
	}
	.tab-panel.active {
		display: flex;
	}
	.requests-panel {
		flex-direction: column;
	}
	.playground-panel {
		width: 100%;
		min-width: 0;
		min-height: 0;
	}
	.settings-tab {
		width: 100%;
		min-width: 0;
		min-height: 0;
	}
	.password-gate {
		position: relative;
		width: 100vw;
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: clamp(72px, 18vh, 155px) 24px 240px;
		background:
			radial-gradient(circle at 50% 0%, rgb(255 255 255 / 10%), transparent 42%),
			linear-gradient(180deg, #101010 0%, #090909 50%, #111 100%);
		color: #f4f4f4;
		font-family: Arial, Helvetica, sans-serif;
		overflow: hidden;
	}
	.password-sky {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background:
			radial-gradient(circle at 50% 10%, rgb(255 255 255 / 3%) 0%, transparent 28%),
			linear-gradient(180deg, rgb(255 255 255 / 0%) 0%, rgb(255 255 255 / 2%) 100%);
	}
	.password-content {
		position: relative;
		z-index: 1;
		width: min(920px, 100%);
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}
	.password-content h1 {
		margin: 0;
		font-size: clamp(3rem, 8vw, 6.2rem);
		font-weight: 900;
		letter-spacing: -0.04em;
		line-height: 0.98;
		text-transform: uppercase;
		white-space: nowrap;
	}
	.password-content p {
		margin: 14px 0 20px;
		color: #8d8d8d;
		font-size: clamp(0.8rem, 1.4vw, 1rem);
	}
	.password-moon {
		position: absolute;
		top: 34px;
		right: 7%;
		width: clamp(54px, 7vw, 92px);
		aspect-ratio: 1;
		border-radius: 50%;
		background: #f4f1dc;
		box-shadow:
			0 0 18px rgb(244 241 220 / 55%),
			0 0 48px rgb(244 241 220 / 18%);
	}
	.password-moon::after {
		content: "";
		position: absolute;
		top: -8%;
		right: -8%;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background: #0d0d0d;
	}
	.password-star {
		position: absolute;
		width: 2px;
		height: 2px;
		border-radius: 50%;
		background: #fff;
		box-shadow: 0 0 5px 1px rgb(255 255 255 / 55%);
	}
	.password-form {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		gap: 12px;
		width: min(920px, 100%);
		height: 84px;
		padding: 0 18px 0 22px;
		border: 1px solid rgb(255 255 255 / 14%);
		border-radius: 10px;
		background: rgb(53 53 53 / 92%);
		box-shadow: 0 8px 24px rgb(0 0 0 / 18%);
		box-sizing: border-box;
	}
	.password-form input,
	.password-form button {
		font: inherit;
		box-sizing: border-box;
	}
	.password-form input {
		flex: 1;
		height: 100%;
		padding: 0 16px;
		border: 0;
		background: transparent;
		color: #f0f0f0;
		font-size: 1rem;
		text-align: center;
		outline: none;
	}
	.password-form input::placeholder {
		color: #b8b8b8;
	}
	.password-form button {
		height: 56px;
		padding: 0 22px;
		border: 1px solid rgb(255 255 255 / 12%);
		border-radius: 9px;
		background: rgb(255 255 255 / 10%);
		color: #f4f4f4;
		cursor: pointer;
		transition: background 120ms ease, border-color 120ms ease;
	}
	.password-form button:hover {
		border-color: rgb(255 255 255 / 26%);
		background: rgb(255 255 255 / 14%);
	}
	.password-error {
		margin-top: 12px;
		color: #f2b0b0;
		font-size: 0.88rem;
	}
`;
export default App;
