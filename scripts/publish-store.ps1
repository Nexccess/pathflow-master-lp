param(
    [Parameter(Mandatory = $true)]
    [string]$LeadId,

    [string]$SourceRoot = "C:\PathFlow\generated\integrated-lp",

    [string]$RepoRoot = "C:\Nexcess\pathflow-master-lp"
)

$ErrorActionPreference = "Stop"

$source = Join-Path $SourceRoot "$LeadId\product"
$destRoot = Join-Path $RepoRoot "p"
$dest = Join-Path $destRoot $LeadId

Write-Host "=== PATHFLOW STORE PUBLISH PREP ==="
Write-Host "Lead ID :" $LeadId
Write-Host "Source  :" $source
Write-Host "Dest    :" $dest

if (-not (Test-Path $source)) {
    throw "Source product not found: $source"
}

if (-not (Test-Path (Join-Path $source "index.html"))) {
    throw "index.html not found in source product."
}

if (Test-Path $dest) {
    throw "Destination already exists. Stop to prevent overwrite: $dest"
}

New-Item -ItemType Directory -Force -Path $destRoot | Out-Null
New-Item -ItemType Directory -Force -Path $dest | Out-Null

Copy-Item (Join-Path $source "*") $dest -Recurse -Force

$sourceFiles = Get-ChildItem $source -Recurse -File
$destFiles = Get-ChildItem $dest -Recurse -File

$sourceBytes = ($sourceFiles | Measure-Object Length -Sum).Sum
$destBytes = ($destFiles | Measure-Object Length -Sum).Sum

Write-Host ""
Write-Host "=== COPY VERIFY ==="
Write-Host "Source files :" $sourceFiles.Count
Write-Host "Dest files   :" $destFiles.Count
Write-Host "Source bytes :" $sourceBytes
Write-Host "Dest bytes   :" $destBytes

if ($sourceFiles.Count -ne $destFiles.Count) {
    throw "File count mismatch."
}

if ($sourceBytes -ne $destBytes) {
    throw "Byte size mismatch."
}

Write-Host ""
Write-Host "=== PUBLISH PATH READY ==="
Write-Host $dest
Write-Host ""
Write-Host "Public URL:"
Write-Host "https://sample.pathflow.org/p/$LeadId/"
