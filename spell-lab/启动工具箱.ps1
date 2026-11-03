param([ValidateSet('preview','test','build')][string]$Action='preview')
$ErrorActionPreference='Stop'
$node = (Get-Command node -ErrorAction Stop).Source
Push-Location $PSScriptRoot
try {
 switch ($Action) {
  'preview' {
   & $node 'node_modules/vite/bin/vite.js' build --logLevel warn
   if($LASTEXITCODE -ne 0){throw ('Build failed: '+$LASTEXITCODE)}
   & $node 'node_modules/vite/bin/vite.js' preview --host 127.0.0.1 --port 5187 --strictPort
  }
  'build' { & $node 'node_modules/vite/bin/vite.js' build }
  'test' { foreach($taskCheck in @('smoke.mjs','verify-spell-physics.mjs','verify-multiplayer.mjs')) { & $node $taskCheck; if($LASTEXITCODE -ne 0){throw ('Check failed: '+$taskCheck)} } }
 }
 if($LASTEXITCODE -ne 0){throw "Tool exited with code $LASTEXITCODE"}
} finally { Pop-Location }
