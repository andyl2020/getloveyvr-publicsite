[CmdletBinding()]
param(
  [switch]$PassThru
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$localBwsDir = Join-Path $repoRoot ".tools\bws"
$localBws = Join-Path $localBwsDir "bws.exe"

function Write-Result {
  param([string]$Path)

  if ($PassThru) {
    Write-Output $Path
    return
  }

  Write-Host "bws is available at $Path"
}

$pathCommand = Get-Command bws -ErrorAction SilentlyContinue
if ($pathCommand) {
  Write-Result $pathCommand.Source
  exit 0
}

if (Test-Path $localBws) {
  Write-Result $localBws
  exit 0
}

New-Item -ItemType Directory -Path $localBwsDir -Force | Out-Null

$headers = @{ "User-Agent" = "getloveyvr-publicsite" }
$releasesUrl = "https://api.github.com/repos/bitwarden/sdk-sm/releases?per_page=30"
$releases = Invoke-RestMethod -Uri $releasesUrl -Headers $headers
$release = @($releases | Where-Object { $_.tag_name -match "^bws-v" } | Sort-Object -Property published_at -Descending)[0]

if (-not $release) {
  throw "Could not find a Bitwarden Secrets Manager CLI release in bitwarden/sdk-sm."
}

$arch = if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") { "aarch64" } else { "x86_64" }
$assetPattern = "bws-$arch-pc-windows-msvc-*.zip"
$asset = @($release.assets | Where-Object { $_.name -like $assetPattern })[0]

if (-not $asset) {
  throw "Could not find a Windows bws asset matching $assetPattern in $($release.tag_name)."
}

$zipPath = Join-Path $localBwsDir $asset.name
$extractDir = Join-Path $localBwsDir "extract"
$checksumPath = Join-Path $localBwsDir "bws-sha256-checksums.txt"
$checksumAsset = @($release.assets | Where-Object { $_.name -like "bws-sha256-checksums-*.txt" })[0]

Write-Host "Downloading Bitwarden Secrets Manager CLI $($release.tag_name)..."
Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $zipPath -Headers $headers

if ($checksumAsset) {
  Invoke-WebRequest -Uri $checksumAsset.browser_download_url -OutFile $checksumPath -Headers $headers
  $expectedLine = Get-Content $checksumPath | Where-Object { $_ -like "*$($asset.name)" } | Select-Object -First 1

  if ($expectedLine) {
    $expectedHash = ($expectedLine -split "\s+")[0].ToLowerInvariant()
    $actualHash = (Get-FileHash -Path $zipPath -Algorithm SHA256).Hash.ToLowerInvariant()

    if ($actualHash -ne $expectedHash) {
      throw "Checksum validation failed for $($asset.name)."
    }
  }
}

if (Test-Path $extractDir) {
  Remove-Item -LiteralPath $extractDir -Recurse -Force
}

Expand-Archive -Path $zipPath -DestinationPath $extractDir -Force
$downloadedBws = Get-ChildItem -Path $extractDir -Recurse -Filter "bws.exe" | Select-Object -First 1

if (-not $downloadedBws) {
  throw "Downloaded archive did not contain bws.exe."
}

Copy-Item -LiteralPath $downloadedBws.FullName -Destination $localBws -Force
Remove-Item -LiteralPath $extractDir -Recurse -Force
Remove-Item -LiteralPath $zipPath -Force
if (Test-Path $checksumPath) {
  Remove-Item -LiteralPath $checksumPath -Force
}

Write-Result $localBws
