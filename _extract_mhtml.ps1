$bytes = [System.IO.File]::ReadAllBytes('D:\ec\tengxun\插件初始化.mhtml')
$content = [System.Text.Encoding]::UTF8.GetString($bytes)
$idx = $content.IndexOf('<body')
if ($idx -lt 0) { $idx = $content.IndexOf('<div') }
if ($idx -ge 0) {
    $body = $content.Substring($idx, [Math]::Min(150000, $content.Length - $idx))
    $cleaned = [regex]::Replace($body, '<[^>]+>', ' ')
    $cleaned = $cleaned.Replace('&nbsp;', ' ')
    $cleaned = $cleaned.Replace('&lt;', '<')
    $cleaned = $cleaned.Replace('&gt;', '>')
    $cleaned = $cleaned.Replace('&amp;', '&')
    $lines = $cleaned -split '\n' | ForEach-Object { $_.Trim() } | Where-Object { $_.Length -gt 3 }
    $text = $lines -join "`n"
    $text | Out-File -FilePath 'D:\ec\tengxun\_mhtml_extract.txt' -Encoding UTF8
    Write-Host "Done. Lines: $($lines.Count), Length: $($text.Length)"
} else {
    Write-Host "No body found, idx=$idx"
}
