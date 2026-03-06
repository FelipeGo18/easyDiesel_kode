import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'frontend', 'public', 'icons');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.svg'));

let updated = 0;

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Update viewBox
    content = content.replace(/viewBox="[^"]+"/, 'viewBox="25 25 60 60"');

    // 2. Remove hex path (either class="hex" or the specific d string for the hexagon)
    content = content.replace(/<path[^>]*class="hex"[^>]*\/>/g, '');
    content = content.replace(/<path[^>]*d="M55 5 L98 30 L98 80 L55 105 L12 80 L12 30 Z"[^>]*\/>/g, '');

    // 3. Remove style definitions for hex and lbl
    content = content.replace(/\.hex\s*\{[^}]+\}/g, '');
    content = content.replace(/\.lbl\s*\{[^}]+\}/g, '');

    // 4. Remove text label
    content = content.replace(/<text[^>]*class="lbl"[^>]*>.*?<\/text>/g, '');

    fs.writeFileSync(filePath, content, 'utf8');
    updated++;
}

console.log(`Successfully updated ${updated} icons to remove borders and adjust size.`);
