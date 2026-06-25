[CmdletBinding()]
param(
  [string]$Remote = "origin",
  [string]$Branch = "main",
  [string]$SecretKey = "GETLOVEYVR_GITHUB_TOKEN",
  [string]$SecretId = $env:GETLOVEYVR_GITHUB_TOKEN_SECRET_ID,
  [string]$ProjectId = $env:GETLOVEYVR_BITWARDEN_PROJECT_ID,
  [string]$Username = "x-access-token"
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($env:BWS_ACCESS_TOKEN)) {
  throw "BWS_ACCESS_TOKEN is not set. The Bitwarden Secrets Manager CLI needs a machine-account access token to read secrets."
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$bws = & (Join-Path $PSScriptRoot "ensure-bws.ps1") -PassThru

function Invoke-BwsJson {
  param([string[]]$Arguments)

  $output = & $bws @Arguments --output json 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "bws command failed while reading the GitHub token secret."
  }

  try {
    return $output | ConvertFrom-Json
  } catch {
    throw "bws returned unexpected JSON while reading the GitHub token secret."
  }
}

if (-not [string]::IsNullOrWhiteSpace($SecretId)) {
  $secret = Invoke-BwsJson @("secret", "get", $SecretId)
} else {
  $listArgs = @("secret", "list")
  if (-not [string]::IsNullOrWhiteSpace($ProjectId)) {
    $listArgs += $ProjectId
  }

  $matchingSecrets = @(Invoke-BwsJson $listArgs | Where-Object { $_.key -eq $SecretKey })

  if ($matchingSecrets.Count -eq 0) {
    throw "Could not find Bitwarden secret key '$SecretKey'. Set GETLOVEYVR_GITHUB_TOKEN_SECRET_ID or GETLOVEYVR_BITWARDEN_PROJECT_ID if needed."
  }

  if ($matchingSecrets.Count -gt 1) {
    throw "Found multiple Bitwarden secrets named '$SecretKey'. Set GETLOVEYVR_GITHUB_TOKEN_SECRET_ID to the exact secret id."
  }

  $secret = $matchingSecrets[0]
}

$token = [string]$secret.value
if ([string]::IsNullOrWhiteSpace($token) -or $token -eq "REPLACE_WITH_GITHUB_FINE_GRAINED_PAT") {
  throw "Bitwarden secret '$($secret.key)' still has no usable GitHub token value."
}

$remoteUrl = git -C $repoRoot remote get-url $Remote
if ($LASTEXITCODE -ne 0) {
  throw "Could not read git remote '$Remote'."
}

if ($remoteUrl -notmatch "^https://github\.com/") {
  throw "Remote '$Remote' must use an HTTPS GitHub URL for token auth. Current URL: $remoteUrl"
}

$tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "getloveyvr-git-auth-$PID"
$askPass = Join-Path $tempDir "askpass.cmd"

New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

@"
@echo off
echo %~1 | findstr /I "Username" >nul
if %errorlevel% equ 0 (
  echo %GETLOVEYVR_GIT_USERNAME%
) else (
  echo %GETLOVEYVR_GIT_PASSWORD%
)
"@ | Set-Content -Path $askPass -Encoding ASCII

$oldAskPass = $env:GIT_ASKPASS
$oldPrompt = $env:GIT_TERMINAL_PROMPT
$oldGitUser = $env:GETLOVEYVR_GIT_USERNAME
$oldGitPassword = $env:GETLOVEYVR_GIT_PASSWORD

try {
  $env:GIT_ASKPASS = $askPass
  $env:GIT_TERMINAL_PROMPT = "0"
  $env:GETLOVEYVR_GIT_USERNAME = $Username
  $env:GETLOVEYVR_GIT_PASSWORD = $token

  git -C $repoRoot -c credential.helper= push $Remote $Branch
  if ($LASTEXITCODE -ne 0) {
    throw "git push failed."
  }
} finally {
  $env:GIT_ASKPASS = $oldAskPass
  $env:GIT_TERMINAL_PROMPT = $oldPrompt
  $env:GETLOVEYVR_GIT_USERNAME = $oldGitUser
  $env:GETLOVEYVR_GIT_PASSWORD = $oldGitPassword

  if (Test-Path $tempDir) {
    Remove-Item -LiteralPath $tempDir -Recurse -Force
  }
}
