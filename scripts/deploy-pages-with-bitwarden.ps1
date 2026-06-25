[CmdletBinding()]
param(
  [string]$Remote = "origin",
  [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot

function Get-NodeMajor {
  param([string]$NodePath)

  $version = & $NodePath -v
  if ($version -match "^v(?<major>\d+)") {
    return [int]$Matches.major
  }

  return 0
}

function Get-NpmForBuild {
  $node = Get-Command node -ErrorAction SilentlyContinue
  $npm = Get-Command npm.cmd -ErrorAction SilentlyContinue

  if ($node -and $npm -and (Get-NodeMajor $node.Source) -ge 18) {
    return $npm.Source
  }

  $hermesNode = Join-Path $env:LOCALAPPDATA "hermes\node\node.exe"
  $hermesNpm = Join-Path $env:LOCALAPPDATA "hermes\node\npm.cmd"

  if ((Test-Path $hermesNode) -and (Test-Path $hermesNpm) -and (Get-NodeMajor $hermesNode) -ge 18) {
    return $hermesNpm
  }

  throw "Node 18+ is required for the Vite build. Install Node 22 or make sure Hermes Node is available."
}

$npm = Get-NpmForBuild
Write-Host "Using npm for build: $npm"

$npmDir = Split-Path -Parent $npm
$oldPath = $env:PATH

Push-Location $repoRoot
try {
  $env:PATH = "$npmDir;$oldPath"
  & $npm run build
  if ($LASTEXITCODE -ne 0) {
    throw "npm run build failed."
  }
} finally {
  $env:PATH = $oldPath
  Pop-Location
}

& (Join-Path $PSScriptRoot "git-push-with-bitwarden.ps1") -Remote $Remote -Branch $Branch
