import { css, type Component } from "dreamland/core";

const AuthPage: Component<
	{ onAuthenticated: () => void },
	{
		password: string;
		error: string;
		loading: boolean;
	},
	{}
> = function () {
	this.password ??= "";
	this.error ??= "";
	this.loading ??= false;

	const submit = async () => {
		this.loading = true;
		this.error = "";
		try {
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ password: this.password }),
			});
			if (!response.ok) {
				const body = (await response.json()) as { error?: string };
				throw new Error(body.error || "Impossible de se connecter.");
			}
			this.onAuthenticated();
		} catch (error) {
			this.error = error instanceof Error ? error.message : "Impossible de se connecter.";
		} finally {
			this.loading = false;
		}
	};

	return (
		<main class="auth-page">
			<div class="auth-content">
				<h1>Athom Explorer</h1>
				<p class="auth-subtitle">Un explorateur conçu pour travailler sur mes projets.</p>
				<form class="auth-form" on:submit={(event: SubmitEvent) => { event.preventDefault(); void submit(); }}>
					<input
						class="auth-input"
						type="password"
						value={use(this.password)}
						autocomplete="current-password"
						placeholder="Entrez votre mot de passe"
						autofocus
						on:input={(event: InputEvent) => { this.password = (event.target as HTMLInputElement).value; }}
					/>
					<button class="auth-button" type="submit" disabled={use(this.loading)}>
						{use(this.loading).map((loading) => loading ? "Connexion..." : "Se connecter")}
					</button>
				</form>
				{use(this.error).map((error) => error ? <p class="auth-error">{error}</p> : null)}
			</div>
			<div class="auth-moon" aria-hidden="true"></div>
			<div class="auth-wave" aria-hidden="true"></div>
		</main>
	);
};

AuthPage.style = css`
	:scope {
		position: fixed;
		inset: 0;
		z-index: 100;
		overflow: hidden;
		background: #111;
		color: #f7f7f7;
		font-family: Arial, Helvetica, sans-serif;
	}
	.auth-content {
		position: relative;
		z-index: 2;
		width: min(920px, calc(100% - 48px));
		margin: 18vh auto 0;
		text-align: center;
	}
	h1 {
		margin: 0;
		font-size: clamp(3rem, 8vw, 6.2rem);
		font-weight: 900;
		line-height: 0.98;
		white-space: nowrap;
		text-transform: uppercase;
		transition: transform 180ms ease, text-shadow 180ms ease;
	}
	h1:hover {
		transform: scale(1.035);
		text-shadow: 0 0 8px rgb(255 255 255 / 35%), 0 0 24px rgb(255 255 255 / 18%);
	}
	.auth-subtitle {
		margin: 14px 0 20px;
		color: #5f5f5f;
		font-size: clamp(0.8rem, 1.4vw, 1rem);
	}
	.auth-form {
		display: flex;
		gap: 10px;
		width: min(920px, 100%);
	}
	.auth-input {
		flex: 1;
		height: 84px;
		padding: 0 28px;
		border: 1px solid #4a4a4a;
		border-radius: 9px;
		background: #353535;
		box-shadow: 0 8px 24px rgb(0 0 0 / 18%);
		color: #f0f0f0;
		font: inherit;
		font-size: 1rem;
		text-align: center;
		outline: none;
	}
	.auth-button {
		padding: 0 22px;
		border: 1px solid #777;
		border-radius: 9px;
		background: #242424;
		color: #f0f0f0;
		font: inherit;
		cursor: pointer;
	}
	.auth-button:disabled { opacity: 0.6; cursor: wait; }
	.auth-error { color: #e7b0b0; }
	.auth-moon {
		position: absolute;
		top: 42px;
		right: 7%;
		width: clamp(54px, 7vw, 92px);
		aspect-ratio: 1;
		border-radius: 50%;
		background: #f4f1dc;
		box-shadow: 0 0 18px rgb(244 241 220 / 55%), 0 0 48px rgb(244 241 220 / 18%);
	}
	.auth-moon::after {
		position: absolute;
		top: -7%;
		right: -7%;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background: #111;
		content: "";
	}
	.auth-wave {
		position: absolute;
		left: -8%;
		bottom: -185px;
		width: 116%;
		height: 310px;
		border-radius: 50% 50% 0 0 / 28% 28% 0 0;
		background: #242424;
		transform: rotate(-3deg);
	}
	@media (max-width: 600px) {
		.auth-content { margin-top: 120px; }
		.auth-form { flex-direction: column; }
		.auth-input { height: 64px; }
		.auth-button { min-height: 48px; }
	}
`;

export default AuthPage;