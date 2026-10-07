$ErrorActionPreference = 'Stop'
$museFolder = $PSScriptRoot
$museNode = 'C:\Users\richa\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
if (-not (Test-Path -LiteralPath $museNode)) { $museNode = (Get-Command node -ErrorAction Stop).Source }
$museReady = $false
try { $museResult = Invoke-RestMethod -Uri 'http://127.0.0.1:3008/api/status' -TimeoutSec 2; $museReady = $museResult.app -eq 'muse-local' } catch {}
if (-not $museReady) {
 New-Item -ItemType Directory -Force -Path (Join-Path $museFolder 'data') | Out-Null
 Start-Process -FilePath $museNode -ArgumentList ('"' + (Join-Path $museFolder 'server.mjs') + '"') -WorkingDirectory $museFolder -WindowStyle Hidden -RedirectStandardOutput (Join-Path $museFolder 'data\server.log') -RedirectStandardError (Join-Path $museFolder 'data\server-errors.log')
 for ($museAttempt = 0; $museAttempt -lt 40; $museAttempt++) {
  try { $museResult = Invoke-RestMethod -Uri 'http://127.0.0.1:3008/api/status' -TimeoutSec 1; if ($museResult.app -eq 'muse-local') { $museReady = $true; break } } catch {}
  Start-Sleep -Milliseconds 250
 }
}
if (-not $museReady) { throw 'Muse could not start. Check data\server-errors.log.' }
Start-Process 'http://127.0.0.1:3008'

