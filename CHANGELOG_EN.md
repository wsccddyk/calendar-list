# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [9.9.4] - 2026-04-19

### Bug Fixes

- **Update Check Dialog** — Replaced the outdated "No update found" dialog with a **version comparison dialog** (showing local vs server version) for clearer status communication
- **Auto Start Fix** — Fixed the registry write failure issue:
  - Added `name` parameter so registry key is "任务清单" instead of default `electron.app.Electron`
  - Auto-cleanup of legacy incorrect registry entries at startup
  - Added registry verification logging after writing
- **404/403 Error Handling** — Server 404/403 responses now treated as "no update available" instead of error, avoiding misleading messages

---

## [9.9.3] - 2026-04-19

### Features

- **Update Check Optimization**: Switching update servers now aborts previous check automatically; added countdown display showing "waiting Xs"

### Bug Fixes

- Fixed undeclared variables in update check (`_checkingForUpdate`, `_currentUpdateCheckId`, `__updateTimer`)

---
