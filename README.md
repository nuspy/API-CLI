# API-CLI

Orchestrazione multi-agente per i CLI di AI coding (Claude, Codex, Gemini, Droid), con due interfacce:

- **War Room** (`webapp/`): web app React + Express/WebSocket in cui piu agenti collaborano in una chat condivisa, a round successivi, fino a convergenza (`[PASS]`) o stop manuale. Ogni round crea un git checkpoint nella working directory, con undo dell'ultimo round.
- **PSLLMKit** (modulo PowerShell, v0.3.0): gateway REST verso i CLI tool. Ogni app puo girare come server HTTP indipendente oppure essere invocata direttamente.

La documentazione completa (in italiano) e in [`readme.html`](readme.html).

## Prerequisiti

- Node.js >= 18 (War Room)
- PowerShell >= 7.0 (PSLLMKit)
- Git nel PATH
- Almeno uno dei CLI supportati, gia installato e autenticato: `claude`, `codex` (`OPENAI_API_KEY`), `gemini` (`GEMINI_API_KEY`), `droid`

## War Room

```powershell
cd webapp
npm install
npm run dev      # Vite su http://localhost:5173, backend Express + WS su http://localhost:3001
```

Produzione: `npm run build` poi `npm start` (tutto su http://localhost:3001).

## PSLLMKit

```powershell
Import-Module .\PSLLMKit.psd1
Start-LLMServer -App claude -Port 8081
Get-LLMServerStatus
Invoke-LLMPrompt -App claude -Prompt "Spiega il pattern Observer in 3 righe"
Stop-LLMServer -All
```

Endpoint di ogni server: `POST /api/prompt`, `GET /api/status`, `POST /api/session/reset`, `GET /api/health`.

## Struttura

```
PSLLMKit.psd1 / .psm1   manifest e loader del modulo
Private/                configurazione, server HTTP, esecuzione processi
Public/                 Start/Stop-LLMServer, Get-LLMServerStatus, Invoke-LLMPrompt
Tests/Unit/             test Pester
webapp/src/server/      orchestratore, adapter dei CLI, WebSocket, git checkpoint
webapp/src/client/      frontend React
readme.html             documentazione completa
```
