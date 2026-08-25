<#
.SYNOPSIS
  GitHub Releases 의 2GiB 제한을 넘는 파일을 .001 / .002 … 파트로 쪼개고,
  src/content.json 에 붙여넣을 parts[] JSON 조각을 만들어 준다.

.DESCRIPTION
  GitHub Releases 는 "에셋 1개당 2GiB"가 플랫폼 하드 리밋이다.
  저장소 설정으로 못 늘리고, 웹 UI든 API든 그 이상은 업로드가 거부된다.
  그래서 큰 패치는 파트로 나눠 올리고, 받는 사람은 파트를 한 폴더에 모아 다시 합친다.

  여기서 만드는 파트는 원본을 그대로 잘라낸 것(raw split)이라 재압축이 없다.
  합치는 법은 셋 다 동일한 결과:
    · 7-Zip 으로 .001 파일을 열거나 "여기에 압축 풀기"
    · 같이 만들어지는 join.bat 을 파트와 같은 폴더에서 실행
    · 명령프롬프트에서  copy /b 이름.zip.001+이름.zip.002 이름.zip

.EXAMPLE
  .\scripts\split-release.ps1 -Path "D:\patch\PS3.The.Fighting.KR_v2.0.zip" -Tag "ippo-v2.0"

.EXAMPLE
  # 파트 크기를 직접 정하고 싶을 때 (기본 1900MB)
  .\scripts\split-release.ps1 -Path ".\big.zip" -Tag "ippo-v2.0" -VolumeSizeMB 1500
#>

[CmdletBinding()]
param(
  # 쪼갤 원본 파일 (2GiB 넘는 zip 등)
  [Parameter(Mandatory = $true)]
  [string]$Path,

  # 릴리스 태그. content.json 에 넣을 다운로드 URL 을 만드는 데 쓴다.
  [Parameter(Mandatory = $true)]
  [string]$Tag,

  # owner/repo
  [string]$Repo = "wandererB/wanderer-arbor",

  # 파트 1개 크기(MB). 2048 미만이어야 한다. 업로드 여유를 두고 기본 1900.
  [int]$VolumeSizeMB = 1900,

  # 분할 결과를 놓을 폴더 (기본: 원본 옆 <파일이름>_parts)
  [string]$OutDir
)

$ErrorActionPreference = "Stop"

# ---- 사전 확인 ----------------------------------------------------------
if ($VolumeSizeMB -lt 1 -or $VolumeSizeMB -ge 2048) {
  throw "VolumeSizeMB 는 1 이상 2048 미만이어야 합니다. GitHub 에셋 한도가 2GiB 입니다. (지금: $VolumeSizeMB)"
}

$src = Get-Item -LiteralPath $Path
if ($src.PSIsContainer) { throw "폴더가 아니라 파일을 지정하세요: $Path" }

if (-not $OutDir) { $OutDir = Join-Path $src.DirectoryName ($src.BaseName + "_parts") }
if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }
$OutDir = (Resolve-Path $OutDir).Path

$srcMB = [math]::Round($src.Length / 1MB, 1)
Write-Host "원본  : $($src.Name)  ($srcMB MB)"
Write-Host "분할  : ${VolumeSizeMB}MB 씩 -> $OutDir"
if ($src.Length -lt 2GB) {
  Write-Warning "이 파일은 2GiB 미만이라 굳이 나눌 필요가 없습니다. 그래도 진행합니다."
}

# ---- 분할 ---------------------------------------------------------------
# 7-Zip CLI 의 -tsplit 은 읽기 전용(만들기 미지원)이라 직접 자른다.
# 결과 바이트는 7-Zip GUI 의 "파일 분할"과 동일해서 .001 을 7-Zip 으로 열면 그대로 합쳐진다.
$target = Join-Path $OutDir $src.Name
Get-ChildItem -LiteralPath $OutDir -Filter "$($src.Name).*" -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -match '\.\d{3}$' } | Remove-Item -Force

$volBytes = [int64]$VolumeSizeMB * 1MB
$in = [System.IO.File]::OpenRead($src.FullName)
try {
  $buf = New-Object byte[] (4MB)
  $index = 0
  while ($in.Position -lt $in.Length) {
    $index++
    $partPath = "{0}.{1:D3}" -f $target, $index
    $out = [System.IO.File]::Create($partPath)
    try {
      [int64]$written = 0
      while ($written -lt $volBytes) {
        $toRead = [int][math]::Min([int64]$buf.Length, $volBytes - $written)
        $read = $in.Read($buf, 0, $toRead)
        if ($read -le 0) { break }
        $out.Write($buf, 0, $read)
        $written += $read
      }
    } finally { $out.Dispose() }
    $pct = [int](100 * $in.Position / $in.Length)
    Write-Progress -Activity "분할 중" -Status "$([System.IO.Path]::GetFileName($partPath)) ($pct%)" -PercentComplete $pct
  }
} finally { $in.Dispose() }
Write-Progress -Activity "분할 중" -Completed

$parts = Get-ChildItem -LiteralPath $OutDir -Filter "$($src.Name).*" |
  Where-Object { $_.Name -match '\.\d{3}$' } | Sort-Object Name
if (-not $parts) { throw "분할 결과 파일이 없습니다." }

$totalParts = ($parts | Measure-Object -Property Length -Sum).Sum
if ($totalParts -ne $src.Length) {
  throw "분할 결과 크기가 원본과 다릅니다 ($totalParts vs $($src.Length)). 디스크 여유 공간을 확인하세요."
}

Write-Host ""
Write-Host "--- 만들어진 파트 ---"
$parts | ForEach-Object { "{0,-56} {1,8} MB" -f $_.Name, [math]::Round($_.Length / 1MB, 1) }

# 합친 결과가 원본과 같은지 확인할 수 있게 원본 해시를 남긴다.
$sha = (Get-FileHash -LiteralPath $src.FullName -Algorithm SHA256).Hash
Set-Content -Path (Join-Path $OutDir "SHA256.txt") -Value "$sha  $($src.Name)" -Encoding utf8
Write-Host ""
Write-Host "SHA256 (원본): $sha"

# ---- 7-Zip 없이도 합칠 수 있는 join.bat ------------------------------------
# copy /b 는 "a+b+c" 처럼 통째로 묶으면 파일 하나로 보므로 이름마다 따로 따옴표를 친다.
$plus = ($parts | ForEach-Object { '"' + $_.Name + '"' }) -join "+"
$bat = @(
  '@echo off'
  'rem 파트를 모두 이 폴더에 모아두고 이 파일을 더블클릭하세요.'
  'cd /d "%~dp0"'
  "copy /b $plus `"$($src.Name)`""
  'if errorlevel 1 ( echo. & echo 합치기 실패: 파트가 모두 있는지 확인하세요. ) else ( echo. & echo 완료: %~dp0' + $src.Name + ' )'
  'pause'
) -join "`r`n"
Set-Content -Path (Join-Path $OutDir "join.bat") -Value $bat -Encoding oem

# ---- content.json 에 붙여넣을 조각 ----------------------------------------
$base = "https://github.com/$Repo/releases/download/$Tag"
$n = $parts.Count
$items = @()
for ($i = 0; $i -lt $n; $i++) {
  $items += [ordered]@{
    label = "파트 $($i + 1)/$n"
    url   = "$base/$($parts[$i].Name)"
    size  = "약 $([math]::Round($parts[$i].Length / 1MB, 0))MB"
  }
}
$json = $items | ConvertTo-Json -Depth 4
if ($n -eq 1) { $json = "[$json]" }   # 항목이 1개면 ConvertTo-Json 이 배열을 벗겨낸다
Set-Content -Path (Join-Path $OutDir "content-parts.json") -Value $json -Encoding utf8

Write-Host ""
Write-Host "--- src/content.json 해당 항목에 넣을 내용 ($OutDir\content-parts.json 에도 저장됨) ---"
Write-Host ""
Write-Host ('"size": "약 ' + $srcMB + 'MB (분할 ' + $n + '개)",')
Write-Host ('"parts": ' + $json + ',')
Write-Host ""
Write-Host "--- 다음 할 일 ---"
Write-Host "1. GitHub 저장소 > Releases > 태그 '$Tag' 로 릴리스를 만든다(또는 기존 릴리스 Edit)."
Write-Host ("2. $OutDir 안의 .001 ~ .{0:D3} 파일을 전부 에셋으로 올린다. (원본은 올리지 않는다)" -f $n)
Write-Host "   join.bat / SHA256.txt 도 같이 올려두면 받는 사람이 편하다."
Write-Host "3. 위 size / parts 를 src/content.json 의 해당 항목에 넣고 커밋·푸시하면 사이트가 자동 배포된다."
Write-Host "   (기존 'url' 키는 지운다 - parts 가 있으면 url 대신 파트 버튼이 표시된다)"
