import { css, type Component } from "dreamland/core";
import { controller, getTransport } from "..";
import {
	AVAILABLE_TRANSPORTS,
	type AvailableTransports,
	demoSettingsDefaults,
	demoSettingsStore,
	normalizeHomeUrl,
	normalizeIconUrl,
	normalizeMaxRequests,
	normalizeOptionalText,
	normalizePanicUrls,
	normalizeTabCloakPreset,
	normalizeTransport,
	normalizeWispUrl,
} from "../store";

const SettingsView: Component<
	{},
	{
		wispUrlInput: string;
		transportInput: AvailableTransports;
		homeUrlInput: string;
		maxRequestsInput: string;
		panicKeyInput: string;
		panicUrlsInput: string;
		tabCloakPresetInput: string;
		customTabNameInput: string;
		customIconUrlInput: string;
		authEnabled: boolean;
		authPasswordInput: string;
		authPasswordConfirmation: string;
		status: string;
		error: string;
	},
	{}
> = function () {
	this.wispUrlInput ??= demoSettingsStore.wispUrl;
	this.transportInput ??= demoSettingsStore.transport;
	this.homeUrlInput ??= demoSettingsStore.homeUrl;
	this.maxRequestsInput ??= String(demoSettingsStore.maxRequests);
	this.panicKeyInput ??= demoSettingsStore.panicKey;
	this.panicUrlsInput ??= demoSettingsStore.panicUrls;
	this.tabCloakPresetInput ??= demoSettingsStore.tabCloakPreset;
	this.customTabNameInput ??= demoSettingsStore.customTabName;
	this.customIconUrlInput ??= demoSettingsStore.customIconUrl;
	this.authEnabled ??= false;
	this.authPasswordInput ??= "";
	this.authPasswordConfirmation ??= "";
	this.status ??= "";
	this.error ??= "";
	void fetch("/api/auth/status")
		.then((response) => response.json())
		.then((auth: { enabled: boolean }) => { this.authEnabled = auth.enabled; })
		.catch(() => {});

	const syncInputsFromStore = () => {
		this.wispUrlInput = demoSettingsStore.wispUrl;
		this.transportInput = demoSettingsStore.transport;
		this.homeUrlInput = demoSettingsStore.homeUrl;
		this.maxRequestsInput = String(demoSettingsStore.maxRequests);
		this.panicKeyInput = demoSettingsStore.panicKey;
		this.panicUrlsInput = demoSettingsStore.panicUrls;
		this.tabCloakPresetInput = demoSettingsStore.tabCloakPreset;
		this.customTabNameInput = demoSettingsStore.customTabName;
		this.customIconUrlInput = demoSettingsStore.customIconUrl;
	};

	const applyTabCloak = () => {
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
		const name =
			demoSettingsStore.tabCloakPreset === "custom"
				? demoSettingsStore.customTabName || document.title
				: preset?.name || document.title;
		document.title = name;
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
	};

	const applySettings = async () => {
		this.error = "";
		this.status = "Application des paramètres...";

		try {
			const nextWispUrl = normalizeWispUrl(this.wispUrlInput);
			const nextTransport = normalizeTransport(this.transportInput);
			const nextHomeUrl = normalizeHomeUrl(this.homeUrlInput);
			const nextMaxRequests = normalizeMaxRequests(this.maxRequestsInput);
			const nextPanicKey = normalizeOptionalText(this.panicKeyInput);
			const nextPanicUrls = normalizePanicUrls(this.panicUrlsInput);
			const nextTabCloakPreset = normalizeTabCloakPreset(this.tabCloakPresetInput);
			const nextCustomTabName = normalizeOptionalText(this.customTabNameInput);
			const nextCustomIconUrl = normalizeIconUrl(this.customIconUrlInput);
			if (this.authPasswordInput !== this.authPasswordConfirmation) {
				throw new TypeError("Les mots de passe ne correspondent pas.");
			}
			const authResponse = await fetch("/api/auth/config", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ enabled: this.authEnabled, password: this.authPasswordInput }),
			});
			if (!authResponse.ok) {
				const body = (await authResponse.json()) as { error?: string };
				throw new Error(body.error || "Impossible de modifier la protection.");
			}
			this.authPasswordInput = "";
			this.authPasswordConfirmation = "";
			const wispChanged = nextWispUrl !== demoSettingsStore.wispUrl;
			const transportChanged = nextTransport !== demoSettingsStore.transport;

			demoSettingsStore.wispUrl = nextWispUrl;
			demoSettingsStore.transport = nextTransport;
			demoSettingsStore.homeUrl = nextHomeUrl;
			demoSettingsStore.maxRequests = nextMaxRequests;
			demoSettingsStore.panicKey = nextPanicKey;
			demoSettingsStore.panicUrls = nextPanicUrls;
			demoSettingsStore.tabCloakPreset = nextTabCloakPreset;
			demoSettingsStore.customTabName = nextCustomTabName;
			demoSettingsStore.customIconUrl = nextCustomIconUrl;

			this.wispUrlInput = nextWispUrl;
			this.transportInput = nextTransport;
			this.homeUrlInput = nextHomeUrl;
			this.maxRequestsInput = String(nextMaxRequests);
			this.panicKeyInput = nextPanicKey;
			this.panicUrlsInput = nextPanicUrls;
			this.tabCloakPresetInput = nextTabCloakPreset;
			this.customTabNameInput = nextCustomTabName;
			this.customIconUrlInput = nextCustomIconUrl;
			applyTabCloak();

			if (wispChanged || transportChanged) {
				controller.setTransport(getTransport());
			}
			this.status =
				wispChanged || transportChanged
					? "Paramètres enregistrés. Le transport est mis à jour pour les prochaines requêtes."
					: "Paramètres enregistrés.";
		} catch (error) {
			this.status = "";
			this.error =
				error instanceof Error ? error.message : "Impossible d’appliquer les paramètres.";
		}
	};

	const resetDefaults = async () => {
		this.error = "";
		this.status = "Réinitialisation des paramètres...";
		this.wispUrlInput = demoSettingsDefaults.wispUrl;
		this.transportInput = demoSettingsDefaults.transport;
		this.homeUrlInput = demoSettingsDefaults.homeUrl;
		this.maxRequestsInput = String(demoSettingsDefaults.maxRequests);
		this.panicKeyInput = demoSettingsDefaults.panicKey;
		this.panicUrlsInput = demoSettingsDefaults.panicUrls;
		this.tabCloakPresetInput = demoSettingsDefaults.tabCloakPreset;
		this.customTabNameInput = demoSettingsDefaults.customTabName;
		this.customIconUrlInput = demoSettingsDefaults.customIconUrl;
		await applySettings();
	};

	return (
		<div class="settings-panel">
			<div class="settings-header">
					<h2>Paramètres de la démo</h2>
				<p>
					Modifiez les paramètres d’exécution sans reconstruire la démo. Les changements Wisp
					s’appliquent uniquement aux prochaines requêtes.
				</p>
			</div>

			<label class="field">
					<span class="label">Serveur Wisp</span>
				<input
					type="text"
					value={use(this.wispUrlInput)}
					spellcheck={false}
					on:input={(e: InputEvent) => {
						this.wispUrlInput = (e.target as HTMLInputElement).value;
					}}
				/>
				<span class="hint">Exemple : ws://localhost:4142/</span>
			</label>

			<label class="field">
				<span class="label">Transport</span>
				<select
					value={use(this.transportInput)}
					on:change={(e: Event) => {
						this.transportInput = (e.target as HTMLSelectElement)
							.value as AvailableTransports;
					}}
				>
					{AVAILABLE_TRANSPORTS.map((option) => (
						<option value={option.value}>{option.label}</option>
					))}
				</select>
				<span class="hint">
					Client de transport utilisé pour envoyer les requêtes via Wisp.
				</span>
			</label>

			<label class="field">
				<span class="label">URL de la page d’accueil</span>
				<input
					type="text"
					value={use(this.homeUrlInput)}
					spellcheck={false}
					on:input={(e: InputEvent) => {
						this.homeUrlInput = (e.target as HTMLInputElement).value;
					}}
				/>
				<span class="hint">
					Utilisée comme URL par défaut du navigateur et envoyée dans la barre d’adresse.
				</span>
			</label>

			<label class="field">
				<span class="label">Limite du journal des requêtes</span>
				<input
					type="number"
					min="10"
					max="5000"
					step="10"
					value={use(this.maxRequestsInput)}
					on:input={(e: InputEvent) => {
						this.maxRequestsInput = (e.target as HTMLInputElement).value;
					}}
				/>
				<span class="hint">
					Nombre maximal de requêtes capturées conservées en mémoire.
				</span>
			</label>

			<div class="settings-section">
				<h3>Protection par mot de passe</h3>
				<p class="section-description">Le mot de passe est conservé uniquement par le serveur. La session reste valide 30 jours.</p>
				<label class="checkbox-label">
					<input type="checkbox" checked={use(this.authEnabled)} on:change={(event: Event) => {
						this.authEnabled = (event.target as HTMLInputElement).checked;
					}} />
					Activer la protection
				</label>
				<label class="field">
					<span class="label">Nouveau mot de passe (facultatif)</span>
					<input type="password" value={use(this.authPasswordInput)} autocomplete="new-password" on:input={(event: InputEvent) => {
						this.authPasswordInput = (event.target as HTMLInputElement).value;
					}} />
				</label>
				<label class="field">
					<span class="label">Confirmation</span>
					<input type="password" value={use(this.authPasswordConfirmation)} autocomplete="new-password" on:input={(event: InputEvent) => {
						this.authPasswordConfirmation = (event.target as HTMLInputElement).value;
					}} />
				</label>
			</div>

			<div class="settings-section">
				<h3>Touche d’urgence</h3>
				<p class="section-description">
					Ouvre rapidement une autre adresse lorsque la touche choisie est pressée.
				</p>
				<label class="field">
					<span class="label">Touche d’urgence</span>
					<input
						type="text"
						value={use(this.panicKeyInput)}
						placeholder="Exemple : Escape"
						on:input={(e: InputEvent) => {
							this.panicKeyInput = (e.target as HTMLInputElement).value;
						}}
					/>
				</label>
				<label class="field">
					<span class="label">Adresses d’urgence</span>
					<input
						type="text"
						value={use(this.panicUrlsInput)}
						placeholder="https://classroom.google.com/"
						on:input={(e: InputEvent) => {
							this.panicUrlsInput = (e.target as HTMLInputElement).value;
						}}
					/>
					<span class="hint">Séparez plusieurs adresses par des virgules.</span>
				</label>
			</div>

			<div class="settings-section">
				<h3>Camouflage de l’onglet</h3>
				<p class="section-description">Change le titre et l’icône visibles dans l’onglet.</p>
				<label class="field">
					<span class="label">Profil</span>
					<select
						value={use(this.tabCloakPresetInput)}
						on:change={(e: Event) => {
							this.tabCloakPresetInput = (e.target as HTMLSelectElement).value;
						}}
					>
						<option value="none">Aucun</option>
						<option value="google">Google</option>
						<option value="athom">Athom</option>
						<option value="wikipedia">Wikipedia</option>
						<option value="custom">Personnalisé</option>
					</select>
				</label>
				<label class="field">
					<span class="label">Nom personnalisé (facultatif)</span>
					<input
						type="text"
						value={use(this.customTabNameInput)}
						on:input={(e: InputEvent) => {
							this.customTabNameInput = (e.target as HTMLInputElement).value;
						}}
					/>
				</label>
				<label class="field">
					<span class="label">URL de l’icône personnalisée (facultatif)</span>
					<input
						type="url"
						value={use(this.customIconUrlInput)}
						on:input={(e: InputEvent) => {
							this.customIconUrlInput = (e.target as HTMLInputElement).value;
						}}
					/>
				</label>
			</div>

			<div class="actions">
				<button type="button" class="primary" on:click={applySettings}>
					Appliquer
				</button>
				<button type="button" on:click={resetDefaults}>
					Réinitialiser
				</button>
				<button
					type="button"
					on:click={() => {
						syncInputsFromStore();
						this.error = "";
						this.status = "Les champs ont été restaurés aux paramètres enregistrés.";
					}}
				>
					Revert Inputs
				</button>
			</div>

			{use(this.error).map((error) =>
				error ? <div class="message error">{error}</div> : null
			)}
			{use(this.status).map((status) =>
				status ? <div class="message status">{status}</div> : null
			)}
		</div>
	);
};

SettingsView.style = css`
	:scope {
		display: block;
		flex: 1;
		min-width: 0;
		min-height: 0;
		margin: 8px;
		padding: 16px;
		background: rgb(255 255 255 / 5%);
		border: 1px solid rgb(255 255 255 / 14%);
		border-radius: 14px;
		box-shadow: 0 10px 28px rgb(0 0 0 / 22%);
		backdrop-filter: blur(14px);
		color: #e5e7eb;
		overflow: auto;
		font-family:
			system-ui,
			-apple-system,
			"Segoe UI",
			sans-serif;
		box-sizing: border-box;
	}

	.settings-header {
		margin-bottom: 16px;
		padding-bottom: 12px;
		border-bottom: 1px solid #222;
	}

	.settings-header h2 {
		margin: 0 0 6px;
		font-size: 1rem;
		font-weight: 600;
	}

	.settings-header p {
		margin: 0;
		color: #a8a8a8;
		line-height: 1.45;
		font-size: 0.84rem;
	}

	.settings-section {
		max-width: 720px;
		margin: 22px 0 0;
		padding-top: 16px;
		border-top: 1px solid rgb(255 255 255 / 10%);
	}

	.settings-section h3 {
		margin: 0 0 5px;
		font-size: 0.92rem;
		font-weight: 600;
	}

	.section-description {
		margin: 0 0 14px;
		color: #a8a8a8;
		font-size: 0.82rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-bottom: 14px;
		max-width: 720px;
	}

	.checkbox-field {
		margin-bottom: 10px;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.84rem;
		font-weight: 600;
	}

	.checkbox-label input {
		width: auto;
	}

	.label {
		font-size: 0.84rem;
		font-weight: 600;
		color: #e5e7eb;
	}

	input,
	select {
		width: 100%;
		padding: 0.55em 0.65em;
		border: 1px solid rgb(255 255 255 / 14%);
		border-radius: 8px;
		background: rgb(0 0 0 / 18%);
		color: #e5e7eb;
		font: inherit;
		font-size: 0.88rem;
		outline: none;
		box-sizing: border-box;
	}

	input:focus,
	select:focus {
		border-color: #4a4a4a;
	}

	select {
		appearance: none;
		-webkit-appearance: none;
		-moz-appearance: none;
		background-image:
			linear-gradient(45deg, transparent 50%, #8f8f8f 50%),
			linear-gradient(135deg, #8f8f8f 50%, transparent 50%);
		background-position:
			calc(100% - 14px) 50%,
			calc(100% - 9px) 50%;
		background-size:
			5px 5px,
			5px 5px;
		background-repeat: no-repeat;
		padding-right: 28px;
		cursor: pointer;
	}

	.hint {
		color: #8f8f8f;
		font-size: 0.78rem;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 18px;
	}

	button {
		border: 1px solid rgb(255 255 255 / 14%);
		border-radius: 8px;
		background: rgb(255 255 255 / 7%);
		color: #e5e7eb;
		padding: 0.45em 0.8em;
		cursor: pointer;
		font: inherit;
		font-size: 0.82rem;
		line-height: 1.2;
		min-height: 28px;
	}

	button:hover {
		background: #222;
	}

	button.primary {
		border-color: #4a4a4a;
		background: #1f1f1f;
	}

	button.primary:hover {
		background: #262626;
	}

	.message {
		margin-top: 12px;
		padding: 0.65em 0.8em;
		border: 1px solid #2a2a2a;
		background: #111;
		font-size: 0.82rem;
		max-width: 720px;
	}

	.message.error {
		border-color: #5a2a2a;
		color: #e7b0b0;
	}

	.message.status {
		color: #b8c2cc;
	}
`;
export default SettingsView;
