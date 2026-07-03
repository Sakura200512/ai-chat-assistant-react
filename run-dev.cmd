@echo off
setlocal

set "PATH=C:\Users\20771\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;C:\Users\20771\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin;%PATH%"
pnpm dev --host 127.0.0.1 --port 5173
