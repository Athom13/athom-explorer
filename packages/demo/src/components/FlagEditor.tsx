import { createStore, css, type Component } from "dreamland/core";
import type { ScramjetFlags } from "@mercuryworkshop/scramjet";
import { defaultConfigDev } from "@mercuryworkshop/scramjet";
import { cachePlugin, controller } from "..";

const flagStore = createStore<ScramjetFlags>(
	{
		...defaultConfigDev.flags,
	},
	{
		ident: "scramjet-flags",
		backing: "localstorage",
		autosave: "auto",
	}
);

// Flag descriptions for better UX
const flagDescriptions: Record<keyof ScramjetFlags, string> = {
		syncxhr: "Activer la prise en charge de XMLHttpRequest synchrone",
		disableComputedWrap: "Ignorer l’interception JS profonde pour de meilleures performances",
		cleanErrors: "Empêcher les sites de détecter les frames de pile Scramjet",
	sourcemaps:
			"Empêcher les sites de détecter les transformations JavaScript (au prix des performances)",
	destructureRewrites:
			"Activer la réécriture de la syntaxe de déstructuration ES6 (expérimental)",
	allowInvalidJs:
			"Laisser passer le JavaScript invalide au lieu de générer une erreur",
	allowFailedIntercepts:
			"En cas d’échec d’interception, appeler l’API avec les données originales",
	encapsulateWorkers:
			"Encapsuler les scripts Worker dans des URL data pour éviter les problèmes de portée",
	scramitize:
			"Déclencher le débogueur si ‘scramjet’ ou l’emplacement réel est détecté",
		rewriterLogs: "Activer les journaux du réécriveur (débogage)",
		captureErrors: "Capturer et gérer les erreurs JavaScript (débogage)",
		debugTrampolines: "Afficher les API proxyfiées dans les piles d’appels (débogage)",
	debugSourceURL:
		"Permettre au débogueur de reconnaître les URL source JavaScript (débogage)",
};

const FlagEditor: Component<
	{
		inline?: boolean;
	},
	{},
	{
		isOpen: boolean;
		cacheBustStatus: string;
	}
> = function (cx) {
	this.isOpen = false;
	this.cacheBustStatus = "";

	const toggleFlag = (flag: keyof ScramjetFlags, value: boolean) => {
		flagStore[flag] = value;
		Object.assign(controller.scramjetConfig.flags, flagStore);
	};

	const resetToDefaults = () => {
		Object.assign(flagStore, {
			...defaultConfigDev.flags,
		});
		Object.assign(controller.scramjetConfig.flags, flagStore);
	};

	const bustCache = async () => {
		this.cacheBustStatus = "Busting…";
		try {
			const ok = await cachePlugin.bust();
			this.cacheBustStatus = ok ? "Cache cleared" : "Nothing to clear";
		} catch (err) {
			console.error("[FlagEditor] cache bust failed:", err);
			this.cacheBustStatus = "Bust failed (see console)";
		}
		setTimeout(() => {
			this.cacheBustStatus = "";
		}, 2000);
	};
	cx.mount = async () => {
		await controller.wait();
		Object.assign(controller.scramjetConfig.flags, flagStore);
	};

	return (
		<div
			class={use(this.inline).map(
				(inline) => `flag-editor ${inline ? "inline" : ""}`
			)}
		>
			<button
				class="toggle-button"
				on:click={() => {
					this.isOpen = !this.isOpen;
				}}
			>
				{use(this.isOpen).map((open) => (open ? "▼" : "▶"))} Éditeur d’options
			</button>
			{use(this.isOpen).andThen(
				<div class="editor-panel">
					<div class="header">
						<h3>Options Scramjet</h3>
						<div class="header-actions">
							<button class="cache-bust-button" on:click={bustCache}>
								Vider le cache
							</button>
							<button class="reset-button" on:click={resetToDefaults}>
								Réinitialiser
							</button>
						</div>
					</div>
					{use(this.cacheBustStatus).andThen(
						<div class="cache-bust-status">{use(this.cacheBustStatus)}</div>
					)}
					<div class="flags-list">
						{(Object.keys(flagStore) as Array<keyof ScramjetFlags>).map(
							(flag) => (
								<label class="flag-item">
									<input
										type="checkbox"
										checked={use(flagStore[flag])}
										on:change={(e: Event) =>
											toggleFlag(flag, (e.target as HTMLInputElement).checked)
										}
									/>
									<div class="flag-info">
										<span class="flag-name">{flag}</span>
										<span class="flag-desc">{flagDescriptions[flag]}</span>
									</div>
								</label>
							)
						)}
					</div>
				</div>
			)}
		</div>
	);
};

FlagEditor.style = css`
	:scope {
		position: fixed;
		top: 1em;
		right: 1em;
		z-index: 1000;
		background: rgb(20 20 20 / 72%);
		border: 1px solid rgb(255 255 255 / 16%);
		border-radius: 12px;
		color: white;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
		font-size: 14px;
		max-width: 400px;
		box-shadow: 0 8px 24px rgb(0 0 0 / 28%);
		backdrop-filter: blur(14px);
	}

	:scope.inline {
		position: relative;
		display: flex;
		align-items: center;
		background: transparent;
		border: none;
		box-shadow: none;
		max-width: none;
	}

	.toggle-button {
		width: 100%;
		padding: 0.75em 1em;
		background: #333;
		border: none;
		border-radius: 8px 8px 0 0;
		color: white;
		cursor: pointer;
		font-size: 14px;
		font-weight: 500;
		text-align: left;
		transition: background 0.2s;
	}

	:scope.inline .toggle-button {
		padding: 0.35em 0.7em;
		background: rgb(255 255 255 / 7%);
		border: 1px solid rgb(255 255 255 / 14%);
		border-radius: 8px;
		font-size: 0.8em;
		line-height: 1.2;
		min-height: 28px;
		display: inline-flex;
		align-items: center;
	}

	:scope.inline .toggle-button:hover {
		background: #222;
	}

	.toggle-button:hover {
		background: #444;
	}

	.editor-panel {
		padding: 1em;
		border-top: 1px solid #444;
		max-height: 60vh;
		overflow-y: auto;
	}

	:scope.inline .editor-panel {
		position: absolute;
		top: calc(100% + 0.35em);
		right: 0;
		min-width: 320px;
		background: rgba(0, 0, 0, 0.95);
		border: 1px solid #444;
		border-radius: 8px;
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
		z-index: 1000;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1em;
	}

	.header h3 {
		margin: 0;
		font-size: 16px;
		font-weight: 600;
	}

	.reset-button {
		padding: 0.4em 0.8em;
		background: #555;
		border: 1px solid #666;
		border-radius: 4px;
		color: white;
		cursor: pointer;
		font-size: 12px;
		transition: background 0.2s;
	}

	.reset-button:hover {
		background: #666;
	}

	.header-actions {
		display: flex;
		gap: 0.4em;
	}

	.cache-bust-button {
		padding: 0.4em 0.8em;
		background: #7a2e2e;
		border: 1px solid #9a3a3a;
		border-radius: 4px;
		color: white;
		cursor: pointer;
		font-size: 12px;
		transition: background 0.2s;
	}

	.cache-bust-button:hover {
		background: #9a3a3a;
	}

	.cache-bust-status {
		font-size: 12px;
		color: #aaa;
		text-align: right;
		margin-bottom: 0.5em;
		font-family: "Courier New", monospace;
	}

	.flags-list {
		display: flex;
		flex-direction: column;
		gap: 0.75em;
	}

	.flag-item {
		display: flex;
		align-items: flex-start;
		gap: 0.75em;
		cursor: pointer;
		padding: 0.5em;
		border-radius: 4px;
		transition: background 0.2s;
	}

	.flag-item:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.flag-item input[type="checkbox"] {
		margin-top: 0.2em;
		cursor: pointer;
		flex-shrink: 0;
	}

	.flag-info {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
		flex: 1;
	}

	.flag-name {
		font-weight: 500;
		color: #fff;
		font-family: "Courier New", monospace;
		font-size: 13px;
	}

	.flag-desc {
		font-size: 12px;
		color: #aaa;
		line-height: 1.4;
	}
`;

export default FlagEditor;
