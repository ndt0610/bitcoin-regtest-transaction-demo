# Bitcoin Regtest Transaction Demo

A local end-to-end demonstration of Bitcoin transaction construction and confirmation on Bitcoin Core Regtest. The project connects a React interface, FastAPI, Python transaction logic, and a local Bitcoin node.

## Transaction lifecycle

~~~mermaid
flowchart LR
  K[Demo key] --> A[Regtest addresses]
  A --> U[Discover UTXOs]
  U --> S[Select inputs and calculate fee]
  S --> G[Build and sign]
  G --> P[Preflight and broadcast]
  P --> M[Mempool]
  M --> B[Mine a block]
  B --> C[Confirm and inspect change]
~~~

The demo supports P2PKH, P2WPKH, and P2SH-P2WPKH flows. It exposes inputs, scripts, signatures, fees, raw transaction data, TXID, and confirmation state to make the lifecycle inspectable.

## Run

Requirements: Python 3.11+, Node.js, and Bitcoin Core with Regtest enabled. The application is restricted to Regtest and does not support Mainnet.

1. Copy .env.example to .env and set local RPC credentials. Keep .env private.
2. Configure Bitcoin Core with bitcoin.conf.example.
3. Start Bitcoin Core with bitcoind -regtest.
4. Start the API: python -m uvicorn api:app --reload.
5. Start the interface: cd frontend; npm install; npm run dev.

See HUONG-DAN-CHAY.md for the full setup and walkthrough.

## Verify

    python -m pytest
    cd frontend
    npm run lint
    npm run build

A real Regtest E2E run requires a local Bitcoin Core node. The committed report describes the latest local run; it does not represent Mainnet activity.

## Safety and scope

- Regtest only; startup rejects other Bitcoin network settings.
- Use disposable Regtest keys and data. Do not reuse Mainnet secrets.
- Private keys are held in the local client flow and are not persisted by the app.
- This is a single-key educational wallet flow. It does not implement Taproot, HD wallets, BIP39, multisig, PSBT, or RBF.
- This demo is not a production wallet or custody service.

## Project layout

- frontend/ — React/Vite interface.
- api.py and main.py — FastAPI endpoints.
- address/, crypto/, transaction/ — address handling, signing, and transaction construction.
- network/ — Bitcoin Core Regtest RPC.
- tests/ — unit tests using fake RPC services.
