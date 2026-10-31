# Scheduled scraper runner: fetches latest lottery results into public/data/lottery_history.csv
# Keep this file ASCII-only: Windows PowerShell 5.1 reads BOM-less scripts as the ANSI code page.
Set-Location $PSScriptRoot
$log = Join-Path $PSScriptRoot 'scrape.log'

# node prints UTF-8; decode it as UTF-8 and write the whole log as UTF-8
# (the old `*>>` redirection wrote UTF-16 and garbled every Chinese line)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

"==== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') scrape start ====" | Out-File $log -Append -Encoding utf8
node scraper.mjs 2>&1 | ForEach-Object { "$_" } | Out-File $log -Append -Encoding utf8
"==== exit code: $LASTEXITCODE ====" | Out-File $log -Append -Encoding utf8
