[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectId,

  [string]$Key = "GETLOVEYVR_GITHUB_TOKEN",

  [string]$PlaceholderValue = "REPLACE_WITH_GITHUB_FINE_GRAINED_PAT"
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($env:BWS_ACCESS_TOKEN)) {
  throw "BWS_ACCESS_TOKEN is not set. Create a Bitwarden Secrets Manager machine-account access token, then set it in this shell before running this script."
}

$bws = & (Join-Path $PSScriptRoot "ensure-bws.ps1") -PassThru
$note = "GitHub token for pushing getloveyvr-publicsite over HTTPS. Replace the placeholder value with the real GitHub PAT in Bitwarden."

function Invoke-BwsJson {
  param([string[]]$Arguments)

  $output = & $bws @Arguments --output json 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "bws command failed. Confirm the access token has read/write access to project $ProjectId."
  }

  return $output | ConvertFrom-Json
}

$existingSecrets = @(Invoke-BwsJson @("secret", "list", $ProjectId))
$existing = $existingSecrets | Where-Object { $_.key -eq $Key } | Select-Object -First 1

if ($existing) {
  Write-Host "Bitwarden secret already exists: key=$Key id=$($existing.id)"
  Write-Host "Edit that secret value in Bitwarden and set it to your GitHub personal access token."
  exit 0
}

$created = Invoke-BwsJson @("secret", "create", $Key, $PlaceholderValue, $ProjectId, "--note", $note)

Write-Host "Created Bitwarden secret: key=$($created.key) id=$($created.id)"
Write-Host "Replace its value in Bitwarden with your GitHub personal access token before pushing."
