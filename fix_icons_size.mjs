import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'frontend', 'public', 'icons');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.svg'));

let updated = 0;

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Use a very safe viewBox that centers at (55, 55) and gives plenty of room
    // Bounds: X from 12 to 98 (width 86), Y from 12 to 98 (height 86)
    content = content.replace(/viewBox="[^"]+"/, 'viewBox="12 12 86 86"');

    fs.writeFileSync(filePath, content, 'utf8');
    updated++;
}

console.log(`Successfully updated ${updated} icons sizes.`);
