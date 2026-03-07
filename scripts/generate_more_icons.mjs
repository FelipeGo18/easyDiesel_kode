import fs from 'fs';
import path from 'path';

const outDir = path.join(process.cwd(), 'frontend', 'public', 'icons');

function getSvg(id, label, paths) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="25 25 60 60" fill="none">
<defs>
  <style>
    .s      { stroke: #F5A623; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; fill: none; }
    .s-thin { stroke: #F5A623; stroke-width: 1.2; stroke-linecap: round; stroke-linejoin: round; fill: none; }
    .f      { fill: #F5A623; }
  </style>
</defs>
<g id="icon-${id}">
  ${paths}
</g>
</svg>`;
}

const icons = [
  { id: 'pie-chart', label: 'PIE', paths: '<circle cx="55" cy="55" r="15" class="s"/><path class="s" d="M55 40 L55 55 L70 55"/>' },
  { id: 'spreadsheet', label: 'EXCEL', paths: '<rect x="40" y="35" width="30" height="40" rx="2" class="s"/><line x1="40" y1="45" x2="70" y2="45" class="s"/><line x1="40" y1="55" x2="70" y2="55" class="s"/><line x1="40" y1="65" x2="70" y2="65" class="s"/><line x1="50" y1="45" x2="50" y2="75" class="s"/>' },
  { id: 'calendar', label: 'DATE', paths: '<rect x="40" y="40" width="30" height="30" rx="3" class="s"/><line x1="40" y1="48" x2="70" y2="48" class="s"/><line x1="48" y1="36" x2="48" y2="44" class="s"/><line x1="62" y1="36" x2="62" y2="44" class="s"/>' },
  { id: 'download', label: 'D/L', paths: '<path class="s" d="M55 35 L55 65 M45 55 L55 65 L65 55 M40 75 L70 75"/>' },
  { id: 'refresh', label: 'SYNC', paths: '<path class="s" d="M42 45 A 12 12 0 0 1 68 45 L64 49 M68 65 A 12 12 0 0 1 42 65 L46 61"/>' },
  { id: 'user', label: 'USER', paths: '<circle cx="55" cy="45" r="9" class="s"/><path class="s" d="M40 70 A 15 15 0 0 1 70 70"/>' },
  { id: 'arrow-right', label: 'NEXT', paths: '<line x1="42" y1="55" x2="68" y2="55" class="s"/><polyline points="60 47 68 55 60 63" class="s"/>' },
  { id: 'login', label: 'LOGIN', paths: '<path class="s" d="M60 40 L70 40 L70 70 L60 70 M45 45 L55 55 L45 65 M35 55 L55 55"/>' },
  { id: 'navigation', label: 'NAV', paths: '<polygon points="55 35 70 75 55 65 40 75" class="s" stroke-linejoin="round"/>' },
  { id: 'newspaper', label: 'NEWS', paths: '<rect x="35" y="40" width="40" height="30" rx="2" class="s"/><line x1="40" y1="48" x2="65" y2="48" class="s"/><line x1="40" y1="56" x2="55" y2="56" class="s"/>' },
  { id: 'shield', label: 'GUARD', paths: '<path class="s" d="M40 35 L70 35 L70 50 C 70 65 55 75 55 75 C 55 75 40 65 40 50 Z"/>' },
  { id: 'activity', label: 'PULSE', paths: '<polyline points="35 55 45 55 50 40 60 70 65 55 75 55" class="s"/>' },
  { id: 'clock', label: 'TIME', paths: '<circle cx="55" cy="55" r="16" class="s"/><polyline points="55 45 55 55 62 55" class="s"/>' },
  { id: 'database', label: 'DB', paths: '<ellipse cx="55" cy="40" rx="14" ry="5" class="s"/><path class="s" d="M41 40 L41 70 A 14 5 0 0 0 69 70 L69 40"/><path class="s" d="M41 55 A 14 5 0 0 0 69 55"/>' },
  { id: 'eye', label: 'VIEW', paths: '<path class="s" d="M35 55 Q 55 35 75 55 Q 55 75 35 55 Z"/><circle cx="55" cy="55" r="5" class="s"/>' },
  { id: 'globe', label: 'WEB', paths: '<circle cx="55" cy="55" r="16" class="s"/><ellipse cx="55" cy="55" rx="6" ry="16" class="s"/><line x1="39" y1="55" x2="71" y2="55" class="s"/>' },
  { id: 'bar-chart', label: 'STATS', paths: '<line x1="40" y1="70" x2="70" y2="70" class="s"/><rect x="43" y="55" width="6" height="15" class="f"/><rect x="52" y="45" width="6" height="25" class="f"/><rect x="61" y="35" width="6" height="35" class="f"/>' },
];

for (let i = 0; i < icons.length; i++) {
  const icon = icons[i];
  const content = getSvg(icon.id, icon.label, icon.paths);
  fs.writeFileSync(path.join(outDir, icon.id + '.svg'), content);
}
console.log("Successfully generated " + icons.length + " more SVG icons.");
