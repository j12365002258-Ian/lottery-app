# Scheduled scraper runner: fetches latest lottery results into public/data/lottery_history.csv
Set-Location $PSScriptRoot
$log = Join-Path $PSScriptRoot 'scrape.log'
"==== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') scrape start ====" | Out-File $log -Append -Encoding utf8
node scraper.mjs *>> $log
"==== exit code: $LASTEXITCODE ====" | Out-File $log -Append -Encoding utf8
