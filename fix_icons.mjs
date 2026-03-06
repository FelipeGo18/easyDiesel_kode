import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'frontend', 'public', 'icons');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.svg'));

let updated = 0;

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Setup a snug viewBox (5 5 100 100) to keep everything centered and proportionally large
    content = content.replace(/viewBox="[^"]+"/, 'viewBox="5 5 100 100"');

    // 2. Remove ANY path with the specific hexagon 'd' string
    content = content.replace(/<path[^>]*d="M55 5 L98 30 L98 80 L55 105 L12 80 L12 30 Z"[^>]*\/>/g, '');

    // 3. Remove ANY path that specifically has the hex class in case it's declared differently
    content = content.replace(/<path[^>]*class="hex"[^>]*\/>/g, '');

    // 4. Remove styles related to hexagon and labels globally
    content = content.replace(/\.hex\s*\{[^}]+\}/g, '');
    content = content.replace(/\.lbl\s*\{[^}]+\}/g, '');

    // 5. Remove text label
    content = content.replace(/<text[^>]*class="lbl"[^>]*>.*?<\/text>/g, '');

    fs.writeFileSync(filePath, content, 'utf8');
    updated++;
}

console.log(`Successfully updated ${updated} icons to remove borders and adjust size.`);
