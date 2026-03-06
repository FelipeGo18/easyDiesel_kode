import fs from 'fs';
import path from 'path';

const outDir = path.join(process.cwd(), 'frontend', 'public', 'icons');

function getSvg(id, label, paths) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="25 25 60 60" fill="none">\n' +
        '<defs>\n' +
        '  <style>\n' +
        '    .s      { stroke: #F5A623; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; fill: none; }\n' +
        '    .s-thin { stroke: #F5A623; stroke-width: 1.2; stroke-linecap: round; stroke-linejoin: round; fill: none; }\n' +
        '    .s-dim  { stroke: #F5A623; stroke-width: 1.2; stroke-linecap: round; fill: none; opacity: 0.4; }\n' +
        '    .f      { fill: #F5A623; }\n' +
        '    .f-bg   { fill: #2a1a00; }\n' +
        '  </style>\n' +
        '</defs>\n' +
        '<g id="icon-' + id + '">\n' +
        '  ' + paths + '\n' +
        '</g>\n' +
        '</svg>';
}

const icons = [
    { id: 'plus', label: 'ADD', paths: '<path class="s" d="M55 40 L55 70 M40 55 L70 55"/>' },
    { id: 'pencil', label: 'EDIT', paths: '<path class="s" d="M45 75 L35 75 L35 65 L60 40 L70 50 Z"/><line x1="55" y1="45" x2="65" y2="55" class="s"/>' },
    { id: 'close', label: 'CLOSE', paths: '<path class="s" d="M45 45 L65 65 M65 45 L45 65"/>' },
    { id: 'search', label: 'SEARCH', paths: '<circle cx="48" cy="48" r="10" class="s"/><line x1="55" y1="55" x2="65" y2="65" class="s"/>' },
    { id: 'chevron-left', label: 'BACK', paths: '<path class="s" d="M60 42 L47 55 L60 68" />' },
    { id: 'chevron-right', label: 'NEXT', paths: '<path class="s" d="M50 42 L63 55 L50 68" />' },
    { id: 'chevron-up', label: 'UP', paths: '<path class="s" d="M42 60 L55 47 L68 60" />' },
    { id: 'chevron-down', label: 'DOWN', paths: '<path class="s" d="M42 50 L55 63 L68 50" />' },
    { id: 'chevrons-up-down', label: 'SORT', paths: '<path class="s" d="M47 47 L55 38 L63 47 M47 63 L55 72 L63 63" />' },
    { id: 'arrow-left', label: 'BACK', paths: '<line x1="68" y1="55" x2="42" y2="55" class="s"/><polyline points="50 47 42 55 50 63" class="s"/>' },
    { id: 'arrow-up-right', label: 'OUT', paths: '<line x1="45" y1="65" x2="65" y2="45" class="s"/><polyline points="50 45 65 45 65 60" class="s"/>' },
    { id: 'arrow-down-left', label: 'IN', paths: '<line x1="65" y1="45" x2="45" y2="65" class="s"/><polyline points="60 65 45 65 45 50" class="s"/>' },
    { id: 'mail', label: 'MAIL', paths: '<rect x="38" y="42" width="34" height="26" rx="3" class="s"/><polyline points="38 45 55 58 72 45" class="s"/>' },
    { id: 'lock', label: 'SECURE', paths: '<rect x="42" y="55" width="26" height="18" rx="2" class="s"/><path class="s" d="M47 55 L47 45 C47 40 63 40 63 45 L63 55"/>' },
    { id: 'trending-up', label: 'UP', paths: '<polyline points="38 65 50 52 58 60 70 42" class="s"/><polyline points="62 42 70 42 70 50" class="s"/>' },
    { id: 'trending-down', label: 'DOWN', paths: '<polyline points="38 42 50 55 58 47 70 65" class="s"/><polyline points="62 65 70 65 70 57" class="s"/>' },
    { id: 'minus', label: 'MINUS', paths: '<line x1="40" y1="55" x2="70" y2="55" class="s"/>' },
    { id: 'history', label: 'HISTORY', paths: '<path class="s" d="M38 45 A 16 16 0 1 1 38 65 L38 45"/><path class="s" d="M55 45 L55 55 L62 55"/>' },
    { id: 'clipboard-check', label: 'AUDIT', paths: '<rect x="42" y="38" width="26" height="36" rx="2" class="s"/><path class="s" d="M50 35 L60 35 L60 41 L50 41 Z"/><polyline points="48 57 53 62 62 50" class="s"/>' },
    { id: 'user-x', label: 'BAN', paths: '<circle cx="55" cy="45" r="10" class="s"/><path class="s" d="M40 70 C40 60 70 60 70 70"/><path class="s" d="M72 40 L82 50 M82 40 L72 50"/>' }
];

for (let i = 0; i < icons.length; i++) {
    const icon = icons[i];
    const content = getSvg(icon.id, icon.label, icon.paths);
    fs.writeFileSync(path.join(outDir, icon.id + '.svg'), content);
}
console.log("Successfully generated " + icons.length + " SVG icons.");
