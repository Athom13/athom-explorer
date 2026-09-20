FROM node:22-slim

RUN apt-get update && apt-get install -y \
    git curl python3 make g++ pkg-config libssl-dev binaryen \
    && rm -rf /var/lib/apt/lists/*

# Install the Rust toolchain required by the Scramjet rewriter.
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain nightly
ENV PATH="/root/.cargo/bin:${PATH}"
RUN rustup target add wasm32-unknown-unknown --toolchain nightly
RUN rustup component add rust-src --toolchain nightly

RUN cargo install wasm-bindgen-cli --version 0.2.105
RUN cargo install --git https://github.com/r58playz/wasm-snip wasm-snip

RUN npm install -g pnpm serve

WORKDIR /app
COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @mercuryworkshop/scramjet run rewriter:build
RUN pnpm --filter @mercuryworkshop/scramjet run build

ARG VITE_WISP_URL=wss://anura.pro
ENV VITE_WISP_URL=${VITE_WISP_URL}
RUN pnpm --filter @mercuryworkshop/scramjet-demo build

FROM node:22-slim AS runtime
WORKDIR /app
COPY --from=0 /app/packages/demo/dist ./dist
COPY --from=0 /app/auth-server.ts ./auth-server.ts
COPY --from=0 /app/production-server.ts ./production-server.ts

ENV SCRAMJET_AUTH_FILE=/data/.scramjet-auth.json
ENV DIST_DIR=/app/dist
VOLUME ["/data"]
EXPOSE 4141
CMD ["node", "--no-warnings=ExperimentalWarning", "production-server.ts"]
