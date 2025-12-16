$filePath = "c:\Users\Suraj\OneDrive\Desktop\MindScape\src\lib\mindscape-data.ts"
$content = Get-Content $filePath -Raw

# Replace pattern: tags array followed by closing brace (without isExpanded)
# Match: tags: [...] followed by whitespace and }
# Replace with: tags: [...], isExpanded: false }

$pattern = '(?m)(tags:\s*\[[^\]]+\])(\s*)(\})'
$replacement = {
    param($match)
    $tags = $match.Groups[1].Value
    $ws = $match.Groups[2].Value
    $brace = $match.Groups[3].Value
    
    # Add comma, newline with indentation, isExpanded, newline, and closing brace
    return "$tags,`r`n                            isExpanded: false`r`n                        $brace"
}

$newContent = [regex]::Replace($content, $pattern, $replacement)
Set-Content -Path $filePath -Value $newContent -NoNewline

Write-Output "Successfully added isExpanded to all subcategories"
