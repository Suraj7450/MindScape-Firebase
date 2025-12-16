const fs = require('fs');

const filePath = 'c:\\Users\\Suraj\\OneDrive\\Desktop\\MindScape\\src\\lib\\mindscape-data.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Replace all occurrences of tags array followed by closing brace with tags array, isExpanded, then closing brace
// This regex matches: tags: [...], followed by newline and closing brace
const regex = /(tags:\s*\[[^\]]+\])(\s*\r?\n\s*)(})/g;
const replacement = '$1,$2                            isExpanded: false$2$3';

content = content.replace(regex, replacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully added isExpanded property to all subcategories');
