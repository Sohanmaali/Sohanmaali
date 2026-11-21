// Generates the SVG assets used by README.md (v5: the v4 terminal + contribution city, with
// larger type and every item from the original README: full about list, full tech stack,
// GitHub stats, languages, streak, trophies, top contributed repos and a dev quote).
// Edit PROFILE below, then run:  node scripts/build-readme.mjs
//
// Live data: when GITHUB_TOKEN is set (the GitHub Actions workflow sets it) the stats, city,
// trophies and repos are filled from the GitHub API. Without a token they stay empty, and
// files that already hold real numbers are never overwritten.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROFILE = {
  name: 'Sohan Maali',
  handle: 'Sohanmaali',
  user: 'sohanmaali',
  host: 'github',
  initials: 'SM',
  tagline: 'full stack web developer',
  // neofetch lines: [key, value]
  info: [
    ['Name', 'Sohan Maali'],
    ['Role', 'Full Stack Developer'],
    ['Work', 'Liyansh Solution Pvt. Ltd.'],
    ['Building', 'Keepvio · keepvio.com'],
    ['Studying', 'MCA · UIT RGPV, Bhopal'],
    ['Learning', 'AI/ML · advanced NestJS'],
    ['Ask me', 'Java · MERN · .NET'],
    ['Motto', 'self learner, always learning new things'],
    ['Status', 'open to collaborate'],
  ],
  about: [
    'Full Stack Developer specializing in ReactJS, NextJS, NestJS, Dotnet and MongoDB/MySQL',
    'Passionate about building scalable applications and interactive UIs with Core UI, Tailwind CSS and Redux',
    'Learning advanced NestJS and database optimization',
    'Currently working on Keepvio (keepvio.com)',
    'Pursuing my Master of Computer Application at University Institute of Technology, RGPV Bhopal',
    'Currently learning AI/ML',
    'Currently working at Liyansh Solution Private Limited',
    'Interested in knowing new things',
    'Looking to collaborate',
    'All of my projects are available at sohanmaali.com',
    'Ask me about Java, MERN and Dot Net',
    'Reach me at sohanmaali4@gmail.com',
    'Fun fact: I think I am so funny',
  ],
  stack: [
    ['backend', ['Node.js', 'Express', 'TypeScript', 'NestJS', '.NET Core', 'JWT', 'Java', 'Hibernate', 'Spring', 'Spring Boot', 'Microservices']],
    ['frontend', ['JavaScript', 'React', 'Next.js', 'React Router', 'Redux', 'HTML5', 'CSS3', 'Tailwind CSS', 'Bootstrap', 'jQuery', 'Core UI']],
    ['database', ['MongoDB', 'MySQL', 'Oracle', 'PostgreSQL']],
    ['ai_ml', ['Python', 'NumPy', 'Pandas', 'TensorFlow']],
    ['tools', ['VS Code', 'NetBeans', 'Eclipse', 'IntelliJ IDEA', 'Spring Tool Suite 4', 'Swagger', 'Git', 'GitHub', 'Figma', 'Canva', 'Postman', 'Jira', 'Adobe Photoshop']],
  ],
  // file name -> [title, handle shown under it] (links live in README.md)
  links: {
    portfolio: ["Portfolio", "sohanmaali.com"],
    linkedin: ["LinkedIn", "in/sohan-maali1"],
    instagram: ["Instagram", "@sohan_maali.1"],
    x: ["X / Twitter", "@sohanmaali7"],
    gfg: ["GeeksforGeeks", "sohanmaali1"],
    email: ["Email", "sohanmaali4@gmail.com"],
    resume: ["Resume", "view the PDF"],
  },
  // shown one after another, a few seconds each; the starting quote changes daily
  quotes: [
    ['Talk is cheap. Show me the code.', 'Linus Torvalds'],
    ['Premature optimization is the root of all evil.', 'Donald Knuth'],
    ['Simplicity is prerequisite for reliability.', 'Edsger W. Dijkstra'],
    ['Programs must be written for people to read, and only incidentally for machines to execute.', 'Harold Abelson'],
    ['Any fool can write code that a computer can understand. Good programmers write code that humans can understand.', 'Martin Fowler'],
    ['Make it work, make it right, make it fast.', 'Kent Beck'],
    ['Controlling complexity is the essence of computer programming.', 'Brian Kernighan'],
    ['The best way to predict the future is to invent it.', 'Alan Kay'],
    ["Code is like humor. When you have to explain it, it's bad.", 'Cory House'],
    ['Truth can only be found in one place: the code.', 'Robert C. Martin'],
    ['Walking on water and developing software from a specification are easy if both are frozen.', 'Edward V. Berard'],
    ['Debugging is twice as hard as writing the code in the first place.', 'Brian Kernighan'],
  ],
};

// One dark palette for both GitHub themes: a terminal and a night city read best dark.
const C = {
  bg: '#0b0d17', bar: '#151827', panel: '#11142233', tile: '#131627', border: '#262a3d', text: '#d8dee9', muted: '#7c849b',
  cyan: '#5ee7ff', magenta: '#ff6ac1', green: '#5af78e', yellow: '#f3f99d', purple: '#b48cff', orange: '#ff9f43',
};
// Contribution tower colours: one hue per palette, darker = fewer, brighter = more.
// Index 0 is an empty day. Change CITY_COLOR to switch palette.
const CITY_COLOR = process.env.CITY_COLOR ?? 'green';
const RAMPS = {
  green: ['#1a1e30', '#167a3a', '#22a447', '#3ccf62', '#7dffa0'],
  cyan: ['#1a1e30', '#1f7f96', '#2ba6c0', '#45cfe8', '#9af6ff'],
  pink: ['#1a1e30', '#a02e74', '#cf3f93', '#f25bb0', '#ffa3da'],
  orange: ['#1a1e30', '#a85c12', '#d47a18', '#f59a2c', '#ffd08a'],
  purple: ['#1a1e30', '#5a3fb0', '#7655d8', '#9577f5', '#cdb9ff'],
};
const RAMP = RAMPS[CITY_COLOR] ?? RAMPS.green;

const W = 840;
const PAD = 30;
const CW = 0.6; // monospace advance, in em
const SIZE = 15; // body text
const WEEKS = 26;
const MONO = "ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,'Liberation Mono',monospace";

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const tw = (s, size = SIZE, ls = 0) => s.length * (size * CW + ls);
const n1 = (v) => Number(v).toFixed(1);
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const hex = (c) => `#${c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
const shade = (h, f) => hex(rgb(h).map((v) => v * f));
const mix = (a, b, k) => { const A = rgb(a), B = rgb(b); return hex(A.map((v, i) => v + (B[i] - v) * k)); };
const cut = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const num = (v) => Number(v).toLocaleString('en-US');

function wrap(text, cols) {
  const lines = [];
  let cur = '';
  for (const word of text.split(' ')) {
    if (cur && cur.length + 1 + word.length > cols) { lines.push(cur); cur = word; } else cur = cur ? `${cur} ${word}` : word;
  }
  if (cur) lines.push(cur);
  return lines;
}

// Monospace text with a forced width, so layout is identical whatever font the viewer has.
function mono(x, y, s, o = {}) {
  const size = o.size ?? SIZE;
  const a = [
    `x="${x}"`, `y="${y}"`, `font-size="${size}"`, `fill="${o.fill ?? C.text}"`,
    `textLength="${n1(tw(s, size, o.ls ?? 0))}"`, 'lengthAdjust="spacing"',
  ];
  if (o.weight) a.push(`font-weight="${o.weight}"`);
  if (o.anchor) a.push(`text-anchor="${o.anchor}"`);
  return `<text ${a.join(' ')}>${esc(s)}</text>`;
}

function svg(w, h, label, inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">
<title>${esc(label)}</title>
<style>
text{font-family:${MONO}}
.f{animation:f .45s ease-out both}
.on{animation:on .01s steps(1) both}
.px{animation:px .5s ease-out both}
.cur{animation:blink 1s steps(1) infinite}
.tw{animation:tw 3.2s ease-in-out infinite}
.grow{transform-box:fill-box;transform-origin:bottom;animation:grow .7s cubic-bezier(.2,.8,.2,1) both}
.wide{transform-box:fill-box;transform-origin:left;animation:wide .7s cubic-bezier(.2,.8,.2,1) both}
@keyframes f{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
@keyframes on{from{opacity:0}to{opacity:1}}
@keyframes px{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
@keyframes blink{50%{opacity:0}}
@keyframes tw{50%{opacity:.15}}
@keyframes grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes wide{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
${inner}
</svg>
`;
}

const fade = (delay, inner) => `<g class="f" style="animation-delay:${delay.toFixed(2)}s">${inner}</g>`;

// Terminal window chrome.
function win(h, title) {
  let o = `<rect x=".5" y=".5" width="${W - 1}" height="${h - 1}" rx="12" fill="${C.bg}" stroke="${C.border}"/>`;
  o += `<path d="M1 40V12.5A11.5 11.5 0 0 1 12.5 1H${W - 12.5}A11.5 11.5 0 0 1 ${W - 1} 12.5V40Z" fill="${C.bar}"/>`;
  o += `<line x1="1" x2="${W - 1}" y1="40.5" y2="40.5" stroke="${C.border}"/>`;
  [C.magenta, C.yellow, C.green].forEach((c, i) => { o += `<circle cx="${24 + i * 20}" cy="20.5" r="6" fill="${c}"/>`; });
  o += mono(W / 2, 25.5, title, { size: 14, fill: C.muted, anchor: 'middle' });
  return o;
}

// "user@host:~$ " prompt; returns the markup and the x where the command starts.
function prompt(x, y) {
  const who = `${PROFILE.user}@${PROFILE.host}`, cw = SIZE * CW;
  const o = mono(x, y, who, { fill: C.green, weight: 700 }) + mono(n1(x + who.length * cw), y, ':~$', { fill: C.muted });
  return [o, x + (who.length + 4) * cw];
}

// A command that types itself; returns markup and the time typing ends.
function typed(x, y, cmd, start) {
  const cw = SIZE * CW, step = 0.06;
  let o = '';
  [...cmd].forEach((ch, i) => {
    if (ch !== ' ') o += `<text class="on" x="${n1(x + i * cw)}" y="${y}" font-size="${SIZE}" font-weight="600" fill="${C.text}" style="animation-delay:${(start + i * step).toFixed(2)}s">${esc(ch)}</text>`;
  });
  return [o, start + cmd.length * step];
}

// Window with a typed command on the first line; returns [markup, time the command finishes].
function shell(cmd) {
  const [pr, cx0] = prompt(PAD, 74);
  const [t, t0] = typed(cx0, 74, cmd, 0.4);
  return [pr + t, t0 + 0.25];
}

const tile = (x, y, w, h) => `<rect x="${n1(x)}" y="${y}" width="${n1(w)}" height="${h}" rx="10" fill="${C.tile}" stroke="${C.border}"/>`;
const label = (x, y, s, o = {}) => mono(x, y, s, { size: 11.5, fill: C.muted, ls: 1.2, weight: 600, ...o });

const GLYPHS = {
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
};

function hero() {
  const p = PROFILE, H = 456;
  const [head, t0] = shell('neofetch');
  let o = win(H, `${p.user}@${p.host}: ~`) + head;

  // pixel monogram with a hard shadow
  const px = 22, ax = 40, ay = 112, cols = p.initials.length * 6 - 1;
  let shadow = '', pixels = '';
  [...p.initials].forEach((ch, gi) => {
    (GLYPHS[ch] ?? []).forEach((row, r) => [...row].forEach((bit, c0) => {
      if (bit !== '#') return;
      const c = gi * 6 + c0, x = ax + c * px, y = ay + r * px;
      const k = (c / (cols - 1)) * 0.75 + (r / 6) * 0.25;
      const delay = (t0 + c * 0.03 + r * 0.04).toFixed(2);
      shadow += `<rect class="px" style="animation-delay:${delay}s" x="${x + 6}" y="${y + 6}" width="${px - 3}" height="${px - 3}" rx="4" fill="#1c2036"/>`;
      pixels += `<rect class="px" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${px - 3}" height="${px - 3}" rx="4" fill="${mix(C.cyan, C.magenta, k)}"/>`;
    }));
  });
  o += shadow + pixels;
  o += fade(t0 + 0.8, mono(ax + (cols * px) / 2, ay + 7 * px + 30, p.tagline, { size: 13, fill: C.muted, anchor: 'middle', ls: 0.6 }));

  // info column
  const ix = 322, cw = SIZE * CW, who = `${p.user}@${p.host}`;
  let d = t0 + 0.1, y = 122;
  o += fade(d, mono(ix, y, who, { fill: C.cyan, weight: 700 }) + mono(ix, y + 20, '-'.repeat(who.length), { fill: C.muted }));
  y += 20;
  p.info.forEach(([k, v], i) => {
    d += 0.08; y += 26;
    const last = i === p.info.length - 1, vx = ix + (k.length + 2) * cw;
    let row = mono(ix, y, k, { fill: C.magenta, weight: 700 }) + mono(n1(ix + k.length * cw), y, ':', { fill: C.muted });
    if (last) row += `<circle cx="${n1(vx + 5)}" cy="${y - 5}" r="5" fill="${C.green}"/>`;
    row += mono(n1(vx + (last ? 18 : 0)), y, v, { fill: last ? C.green : C.text });
    o += fade(d, row);
  });
  y += 20;
  let pal = '';
  [C.muted, C.magenta, C.orange, C.yellow, C.green, C.cyan, C.purple, C.text].forEach((c, i) => { pal += `<rect x="${ix + i * 30}" y="${y}" width="30" height="16" fill="${c}"/>`; });
  o += fade(d + 0.12, pal);

  const [pr2, cx2] = prompt(PAD, H - 24);
  o += fade(d + 0.3, `${pr2}<rect class="cur" x="${n1(cx2)}" y="${H - 38}" width="9" height="17" fill="${C.cyan}"/>`);
  return svg(W, H, `${p.name}: ${p.info.map(([k, v]) => `${k} ${v}`).join(', ')}`, o);
}

function about() {
  const cols = Math.floor((W - PAD * 2) / (SIZE * CW)) - 3, lh = 25, colors = [C.cyan, C.magenta, C.yellow, C.green, C.purple];
  const [head, t0] = shell('cat about.md');
  let o = head, y = 84;
  PROFILE.about.forEach((item, i) => {
    let block = '';
    wrap(item, cols).forEach((ln, j) => {
      y += lh;
      if (j === 0) block += `<path d="M${PAD + 1} ${y - 11}l6 6-6 6" fill="none" stroke="${colors[i % colors.length]}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
      block += mono(PAD + 3 * SIZE * CW, y, ln);
    });
    y += 7;
    o += fade(t0 + i * 0.07, block);
  });
  const H = y + 22;
  return svg(W, H, `About: ${PROFILE.about.join('. ')}`, win(H, '~/about.md') + o);
}

// Skills as colour-coded item slots, grouped by area (the v6 "skill inventory" layout).
function stack() {
  const size = 14, chipH = 32, gap = 8, xMax = W - PAD;
  const colors = [C.green, C.cyan, C.yellow, C.purple, C.magenta];
  const [head, t0] = shell('ls ~/stack/*');
  let o = head, y = 86, n = 0;
  PROFILE.stack.forEach(([group, items], gi) => {
    const color = colors[gi % colors.length];
    y += 26;
    o += `<rect x="${PAD}" y="${y - 11}" width="11" height="11" fill="${color}"/>`;
    o += mono(PAD + 20, y, group.replace('_', ' / ').toUpperCase(), { size: 12.5, fill: color, weight: 700, ls: 2 });
    o += mono(W - PAD, y, `x${items.length}`, { size: 12, fill: C.muted, anchor: 'end' });
    y += 12;
    let x = PAD;
    for (const item of items) {
      const w = tw(item, size) + 28;
      if (x + w > xMax) { x = PAD; y += chipH + gap; }
      o += fade(t0 + n++ * 0.02, `<rect x="${n1(x)}" y="${y}" width="${n1(w)}" height="${chipH}" rx="3" fill="${C.tile}" stroke="${C.border}"/><rect x="${n1(x)}" y="${y}" width="4" height="${chipH}" fill="${color}"/>${mono(n1(x + 16), y + 21, item, { size })}`);
      x += w + gap;
    }
    y += chipH + 12;
  });
  const H = y + 12;
  return svg(W, H, PROFILE.stack.map(([c, items]) => `${c}: ${items.join(', ')}`).join('. '), win(H, '~/stack') + o);
}

// Isometric contribution city. `s` is null until the first sync.
function city(s) {
  const H = 480, ox = 150, oy = 150, SX = 18, SY = 9, hw = 16, hh = 8;
  let o = win(H, '~/contributions — last 26 weeks');
  o += `<defs><radialGradient id="glow" cx=".42" cy=".62" r=".6"><stop offset="0" stop-color="${RAMP[3]}" stop-opacity=".14"/><stop offset=".6" stop-color="${C.purple}" stop-opacity=".05"/><stop offset="1" stop-color="${C.bg}" stop-opacity="0"/></radialGradient></defs>`;
  o += `<rect x="1" y="41" width="${W - 2}" height="${H - 42}" rx="11" fill="url(#glow)"/>`;

  let seed = 7;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let i = 0; i < 46; i++) {
    const x = 16 + rnd() * 600, y = 52 + rnd() * 250, r = 0.6 + rnd() * 0.9;
    o += `<circle${i % 3 === 0 ? ` class="tw" style="animation-delay:${(rnd() * 3).toFixed(1)}s"` : ''} cx="${n1(x)}" cy="${n1(y)}" r="${r.toFixed(2)}" fill="#ffffff" fill-opacity="${(0.25 + rnd() * 0.5).toFixed(2)}"/>`;
  }

  const days = s ? s.days.slice(-WEEKS) : Array.from({ length: WEEKS }, () => Array(7).fill(0));
  const peak = Math.max(...days.flat(), 1);
  // Scale against the 90th percentile of active days, on a square-root curve, so one
  // unusually busy day does not flatten every other tower into the darkest shade.
  const active = days.flat().filter((v) => v > 0).sort((a, b) => a - b);
  const cap = active.length ? active[Math.floor((active.length - 1) * 0.9)] : 1;
  const scale = (v) => Math.sqrt(v / cap);
  const cells = [];
  days.forEach((week, w) => week.forEach((v, dd) => cells.push({ w, d: dd, v })));
  cells.sort((a, b) => a.w + a.d - (b.w + b.d)); // back to front
  for (const { w, d, v } of cells) {
    const x = ox + (w - d) * SX, y = oy + (w + d) * SY;
    const level = v ? Math.min(4, Math.ceil(scale(v) * 4)) : 0;
    const h = v ? 12 + Math.min(scale(v), 1.25) * 58 : 3, top = RAMP[level], t = y - h;
    o += `<g class="grow" style="animation-delay:${(0.2 + (w + d) * 0.03).toFixed(2)}s">`;
    o += `<path d="M${x - hw} ${n1(t + hh)}L${x} ${n1(t + 2 * hh)}V${y + 2 * hh}L${x - hw} ${y + hh}Z" fill="${shade(top, 0.72)}"/>`;
    o += `<path d="M${x} ${n1(t + 2 * hh)}L${x + hw} ${n1(t + hh)}V${y + hh}L${x} ${y + 2 * hh}Z" fill="${shade(top, 0.5)}"/>`;
    o += `<path d="M${x} ${n1(t)}L${x + hw} ${n1(t + hh)}L${x} ${n1(t + 2 * hh)}L${x - hw} ${n1(t + hh)}Z" fill="${top}"/>`;
    o += '</g>';
  }

  [['CONTRIBUTIONS · 1Y', s?.contributions], ['PUBLIC REPOS', s?.repos], ['STARS', s?.stars], ['FOLLOWERS', s?.followers]].forEach(([name, value], i) => {
    const y = 92 + i * 68;
    o += fade(0.3 + i * 0.1, label(W - PAD, y, name, { anchor: 'end' }) + mono(W - PAD, y + 34, s ? num(value) : '—', { size: 30, fill: s ? C.text : C.muted, weight: 700, anchor: 'end' }));
  });

  o += mono(PAD, H - 74, 'one tower per day', { size: 14, weight: 600 });
  o += mono(PAD, H - 53, 'taller and brighter = more contributions', { size: 13, fill: C.muted });
  o += mono(PAD, H - 24, 'less', { size: 12.5, fill: C.muted });
  RAMP.forEach((c, i) => { o += `<rect x="${PAD + 40 + i * 20}" y="${H - 36}" width="16" height="16" rx="3" fill="${c}"/>`; });
  o += mono(PAD + 40 + RAMP.length * 20 + 6, H - 24, 'more', { size: 12.5, fill: C.muted });
  o += mono(W - PAD, H - 24, s ? `peak ${peak} in a day · synced ${s.synced}` : 'empty lot — run the "Update profile README" workflow', { size: 12.5, fill: C.muted, anchor: 'end' });
  return svg(W, H, 'Isometric city built from the last 26 weeks of GitHub contributions, with totals for contributions, repos, stars and followers', o);
}

// Streak tiles, stats list and most-used languages.
function stats(s) {
  const H = 474, iw = W - PAD * 2;
  const [head, t0] = shell('gh stats --me');
  let o = win(H, '~/stats') + head;
  const v = (x) => (s ? num(x) : '—'), ink = s ? C.text : C.muted;

  // streak row
  const sw = (iw - 24) / 3, sy = 98;
  [['TOTAL CONTRIBUTIONS', s?.contributions, 'last 12 months', C.cyan], ['CURRENT STREAK', s?.streak, 'days in a row', C.orange], ['LONGEST STREAK', s?.longest, 'days · last 12 months', C.magenta]].forEach(([name, value, sub, color], i) => {
    const x = PAD + i * (sw + 12);
    o += fade(t0 + i * 0.08, tile(x, sy, sw, 100) + `<rect x="${n1(x + 16)}" y="${sy + 18}" width="4" height="64" rx="2" fill="${color}"/>`
      + label(n1(x + 32), sy + 28, name) + mono(n1(x + 32), sy + 66, v(value), { size: 32, fill: ink, weight: 700 }) + mono(n1(x + 32), sy + 87, sub, { size: 12, fill: C.muted }));
  });

  // stats list
  const py = sy + 114, pw = (iw - 12) / 2, ph = 232;
  let left = tile(PAD, py, pw, ph) + label(PAD + 18, py + 30, 'GITHUB STATS');
  [['Total stars earned', s?.stars], ['Commits · last year', s?.commits], ['Pull requests', s?.prs], ['Issues', s?.issues], ['Contributed to', s?.contributedTo]].forEach(([name, value], i) => {
    const y = py + 66 + i * 34;
    left += mono(PAD + 18, y, name, { size: 14.5, fill: C.text });
    left += mono(PAD + pw - 18, y, v(value), { size: 16, fill: ink, weight: 700, anchor: 'end' });
    if (i < 4) left += `<line x1="${PAD + 18}" x2="${PAD + pw - 18}" y1="${y + 12.5}" y2="${y + 12.5}" stroke="${C.border}"/>`;
  });
  o += fade(t0 + 0.3, left);

  // languages: one stacked bar plus a legend that names every segment
  const lx = PAD + pw + 12, bw = pw - 36;
  let right = tile(lx, py, pw, ph) + label(lx + 18, py + 30, 'MOST USED LANGUAGES');
  right += `<clipPath id="lb"><rect x="${lx + 18}" y="${py + 48}" width="${bw}" height="14" rx="7"/></clipPath>`;
  if (s?.langs.length) {
    let x = lx + 18, bar = '';
    s.langs.forEach((l, i) => {
      const w = (bw * l.pct) / 100, last = i === s.langs.length - 1;
      bar += `<rect x="${n1(x)}" y="${py + 48}" width="${n1(Math.max(last ? w : w - 2, 1))}" height="14" fill="${l.color || C.muted}"/>`;
      x += w;
    });
    right += `<g class="wide" style="animation-delay:${(t0 + 0.5).toFixed(2)}s"><g clip-path="url(#lb)">${bar}</g></g>`;
    s.langs.forEach((l, i) => {
      const ex = lx + 18 + (i % 2) * (bw / 2), ey = py + 100 + Math.floor(i / 2) * 40, name = cut(l.name, 13);
      right += `<circle cx="${n1(ex + 6)}" cy="${ey - 5}" r="6" fill="${l.color || C.muted}"/>`;
      right += mono(n1(ex + 20), ey, name, { size: 14 });
      right += mono(n1(ex + 20), ey + 18, `${l.pct.toFixed(1)}%`, { size: 12.5, fill: C.muted });
    });
  } else {
    right += `<rect x="${lx + 18}" y="${py + 48}" width="${bw}" height="14" rx="7" fill="${C.border}"/>`;
    right += mono(lx + 18, py + 96, 'appears after the first sync', { size: 13.5, fill: C.muted });
  }
  o += fade(t0 + 0.4, right);
  return svg(W, H, 'GitHub stats: contributions, current and longest streak, stars, commits, pull requests, issues and most used languages', o);
}

const TIERS = ['—', 'C', 'B', 'A', 'S', 'SS'];
const TIER_COLORS = [C.muted, C.purple, C.cyan, C.green, C.orange, C.yellow];
const tier = (v, steps) => steps.filter((t) => v >= t).length;

// Achievements as medals (the v6 layout): ribbon, ringed disc with the grade, name and count.
function trophies(s) {
  const H = 296, gap = 10, w = (W - PAD * 2 - gap * 5) / 6, y = 98, h = 166;
  const [head, t0] = shell('ls ~/trophies');
  let o = win(H, '~/trophies') + head;
  const items = [
    ['Stars', s?.stars, [1, 10, 50, 200, 1000]], ['Commits', s?.commits, [1, 100, 500, 1000, 3000]], ['Followers', s?.followers, [1, 10, 50, 200, 1000]],
    ['Repos', s?.repos, [1, 10, 25, 50, 100]], ['Pull reqs', s?.prs, [1, 10, 50, 200, 500]], ['Issues', s?.issues, [1, 10, 50, 200, 500]],
  ];
  let unlocked = 0;
  items.forEach(([name, value, steps], i) => {
    const x = PAD + i * (w + gap), cx = x + w / 2, lv = s ? tier(value, steps) : 0, color = TIER_COLORS[lv];
    if (lv) unlocked++;
    let t = tile(x, y, w, h);
    t += `<path d="M${n1(cx - 15)} ${y + 14}h12l5 26h-12zM${n1(cx + 15)} ${y + 14}h-12l-5 26h12z" fill="${color}" fill-opacity=".35"/>`;
    t += `<circle cx="${n1(cx)}" cy="${y + 62}" r="27" fill="${C.bg}" stroke="${color}" stroke-width="3"/>`;
    t += `<circle cx="${n1(cx)}" cy="${y + 62}" r="20" fill="${color}" fill-opacity=".16" stroke="${color}" stroke-opacity=".6" stroke-dasharray="2 3"/>`;
    t += mono(n1(cx), y + 68.5, TIERS[lv], { size: lv === 5 ? 16 : 19, fill: color, weight: 800, anchor: 'middle' });
    t += mono(n1(cx), y + 118, name, { size: 14, weight: 600, anchor: 'middle' });
    t += mono(n1(cx), y + 144, s ? num(value) : '—', { size: 16, fill: s ? C.text : C.muted, weight: 700, anchor: 'middle' });
    o += fade(t0 + i * 0.08, t);
  });
  o += mono(W - PAD, 74, s ? `${unlocked} of ${items.length} unlocked` : 'locked until first sync', { size: 13, fill: C.muted, anchor: 'end' });
  return svg(W, H, `Achievements: ${items.map(([n]) => n).join(', ')}`, o);
}

function repos(s) {
  const rows = s?.topRepos ?? [], n = Math.max(rows.length, 1), lh = 46, H = 98 + n * lh + 22, cw = SIZE * CW;
  const [head, t0] = shell('git shortlog --top-repos');
  let o = win(H, '~/top-contributed-repos') + head;
  if (!rows.length) {
    o += mono(PAD, 98 + 28, s ? 'no public commit activity in the last 12 months' : 'appears after the first sync', { size: 14, fill: C.muted });
  }
  const peak = Math.max(...rows.map((r) => r.commits), 1), nameW = 30 * cw, bx = PAD + 34 + nameW + 12, bmax = W - PAD - 110 - bx;
  rows.forEach((r, i) => {
    const y = 98 + i * lh;
    let row = mono(PAD, y + 27, `${i + 1}.`, { fill: C.muted });
    row += mono(PAD + 34, y + 27, cut(r.name, 30), { weight: 700, fill: C.cyan });
    row += `<rect x="${n1(bx)}" y="${y + 15}" width="${n1(bmax)}" height="14" rx="4" fill="${C.tile}"/>`;
    row += `<rect class="wide" style="animation-delay:${(t0 + 0.2 + i * 0.08).toFixed(2)}s" x="${n1(bx)}" y="${y + 15}" width="${n1(Math.max((r.commits / peak) * bmax, 6))}" height="14" rx="4" fill="${RAMP[3]}"/>`;
    row += mono(W - PAD, y + 27, `${num(r.commits)} commits`, { size: 13.5, anchor: 'end' });
    o += fade(t0 + i * 0.08, row);
  });
  return svg(W, H, `Top contributed repositories in the last 12 months${rows.length ? `: ${rows.map((r) => r.name).join(', ')}` : ''}`, o);
}

// Quotes rotate inside the image itself, so the card changes while you look at it and
// needs no outside service. The workflow also moves the starting quote on each day.
function quote() {
  const SLOT = 8, all = PROFILE.quotes, n = all.length, day = Math.floor(Date.now() / 86400000);
  const order = all.map((_, i) => all[(i + day) % n]);
  const cols = Math.floor((W - PAD * 2) / (17 * CW)) - 2;
  const wrapped = order.map(([text]) => wrap(`“${text}”`, cols)), rows = Math.max(...wrapped.map((l) => l.length));
  const [head, t0] = shell('fortune');
  const H = 98 + rows * 28 + 58, f = 100 / n;
  let body = `<style>.q{animation:q ${n * SLOT}s linear infinite both}@keyframes q{0%{opacity:0;transform:translateY(6px)}${(f * 0.08).toFixed(2)}%,${(f * 0.92).toFixed(2)}%{opacity:1;transform:none}${f.toFixed(2)}%,100%{opacity:0;transform:translateY(-6px)}}@media (prefers-reduced-motion:reduce){.q{display:none}.q.q0{display:inline}}</style>`;
  order.forEach(([, author], i) => {
    let g = '';
    wrapped[i].forEach((ln, j) => { g += mono(PAD, 98 + 24 + j * 28, ln, { size: 17, fill: C.yellow, weight: 600 }); });
    g += mono(W - PAD, 98 + rows * 28 + 30, `— ${author}`, { size: 14, fill: C.muted, anchor: 'end' });
    body += `<g class="q q${i}" style="animation-delay:${(t0 + i * SLOT).toFixed(2)}s">${g}</g>`;
  });
  return svg(W, H, `Dev quotes: ${order.map(([t, au]) => `${t} — ${au}`).join(' / ')}`, win(H, '~/dev-quote') + head + body);
}

// One-line terminal strip used as a section divider.
function line(cmd, comment) {
  const H = 52;
  let o = `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="10" fill="${C.bg}" stroke="${C.border}"/>`;
  const [pr, cx0] = prompt(22, 32);
  const [typedCmd, t1] = typed(cx0, 32, cmd, 0.4);
  o += pr + typedCmd;
  o += `<rect class="cur" x="${n1(cx0 + (cmd.length + 1) * SIZE * CW)}" y="18" width="9" height="17" fill="${C.cyan}"/>`;
  o += fade(t1 + 0.2, mono(W - 22, 32, `# ${comment}`, { size: 13.5, fill: C.muted, anchor: 'end' }));
  return svg(W, H, `${cmd} — ${comment}`, o);
}

const ICONS = {
  portfolio: { bg: "#0e7490", d: (x, y) => `<circle cx="${x}" cy="${y}" r="10" /><ellipse cx="${x}" cy="${y}" rx="4.5" ry="10" /><path d="M${x - 10} ${y}h20" />` },
  linkedin: { bg: "#0a66c2", text: "in", size: 21 },
  instagram: { bg: "url(#ig)", d: (x, y) => `<rect x="${x - 10}" y="${y - 10}" width="20" height="20" rx="6" /><circle cx="${x}" cy="${y}" r="4.6" /><circle cx="${x + 5.6}" cy="${y - 5.6}" r="1" fill="#fff" />` },
  x: { bg: "#000000", ring: "#3a4056", d: (x, y) => `<path d="M${x - 8} ${y - 8}l16 16M${x + 8} ${y - 8}l-16 16" stroke-width="2.8" />` },
  gfg: { bg: "#2f8d46", text: "GfG", size: 14 },
  email: { bg: "#d9480f", d: (x, y) => `<rect x="${x - 11}" y="${y - 8}" width="22" height="16" rx="2.5" /><path d="M${x - 10} ${y - 6}l10 8 10-8" />` },
  resume: { bg: "#7048e8", d: (x, y) => `<path d="M${x - 8} ${y - 11}h10l6 6v16h-16zM${x + 2} ${y - 11}v6h6M${x - 4} ${y + 1}h8M${x - 4} ${y + 6}h8" />` },
};

// Contact row: full-width, one per line, so the links stack in a column.
function button(key, title, sub) {
  const ic = ICONS[key], w = W, h = 70, cy = 32;
  let o = `<defs><linearGradient id="ig" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#f9a03f"/><stop offset=".5" stop-color="#dd2a7b"/><stop offset="1" stop-color="#8134af"/></linearGradient></defs>`;
  o += `<rect x=".5" y="5.5" width="${w - 1}" height="${h - 6}" rx="12" fill="#05060c" stroke="${C.border}"/>`;
  o += `<rect x=".5" y=".5" width="${w - 1}" height="${h - 7}" rx="12" fill="${C.bar}" stroke="${C.border}"/>`;
  o += `<rect x="12" y="${cy - 22}" width="44" height="44" rx="11" fill="${ic.bg}"${ic.ring ? ` stroke="${ic.ring}"` : ""}/>`;
  o += ic.text
    ? `<text x="34" y="${cy + ic.size * 0.36}" text-anchor="middle" font-size="${ic.size}" font-weight="800" fill="#fff" style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif">${ic.text}</text>`
    : `<g fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ic.d(34, cy)}</g>`;
  o += mono(74, cy + 6, title, { size: 17, weight: 700 });
  o += mono(w - 56, cy + 5.5, sub, { size: 14.5, fill: C.muted, anchor: "end" });
  o += `<path d="M${w - 36} ${cy + 5}l10-10m-8 0h8v8" fill="none" stroke="${C.cyan}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
  return svg(w, h, `${title}: ${sub}`, o);
}

async function fetchStats(token) {
  const query = `query($login:String!){user(login:$login){
    followers{totalCount}
    pullRequests{totalCount}
    issues{totalCount}
    repositoriesContributedTo(contributionTypes:[COMMIT,PULL_REQUEST,ISSUE,REPOSITORY]){totalCount}
    repositories(ownerAffiliations:OWNER,isFork:false,privacy:PUBLIC,first:100){
      totalCount nodes{stargazerCount languages(first:10,orderBy:{field:SIZE,direction:DESC}){edges{size node{name color}}}}}
    contributionsCollection{
      totalCommitContributions restrictedContributionsCount
      commitContributionsByRepository(maxRepositories:25){repository{nameWithOwner isPrivate} contributions{totalCount}}
      contributionCalendar{totalContributions weeks{contributionDays{contributionCount}}}}}}`;
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { authorization: `bearer ${token}`, 'content-type': 'application/json', 'user-agent': 'profile-readme-build' },
    body: JSON.stringify({ query, variables: { login: PROFILE.handle } }),
  });
  const json = await res.json();
  if (!res.ok || json.errors || !json.data?.user) throw new Error(`GitHub API: ${JSON.stringify(json.errors ?? json)}`);
  const u = json.data.user, cc = u.contributionsCollection, cal = cc.contributionCalendar;

  const sizes = new Map();
  for (const repo of u.repositories.nodes) {
    for (const e of repo.languages.edges) {
      const cur = sizes.get(e.node.name) ?? { name: e.node.name, color: e.node.color, size: 0 };
      cur.size += e.size;
      sizes.set(e.node.name, cur);
    }
  }
  const all = [...sizes.values()].sort((a, b) => b.size - a.size);
  const total = all.reduce((sum, l) => sum + l.size, 0) || 1;
  const langs = all.slice(0, 5).map((l) => ({ name: l.name, color: l.color, pct: (l.size / total) * 100 }));
  const rest = all.slice(5).reduce((sum, l) => sum + l.size, 0);
  if (rest) langs.push({ name: 'Other', color: null, pct: (rest / total) * 100 });

  const days = cal.weeks.map((w) => w.contributionDays.map((day) => day.contributionCount));
  return {
    repos: u.repositories.totalCount,
    stars: u.repositories.nodes.reduce((sum, r) => sum + r.stargazerCount, 0),
    followers: u.followers.totalCount,
    prs: u.pullRequests.totalCount,
    issues: u.issues.totalCount,
    contributedTo: u.repositoriesContributedTo.totalCount,
    commits: cc.totalCommitContributions + cc.restrictedContributionsCount,
    contributions: cal.totalContributions,
    langs,
    days,
    ...streaks(days.flat()),
    // private repository names are never published
    topRepos: cc.commitContributionsByRepository.filter((r) => !r.repository.isPrivate).slice(0, 5)
      .map((r) => ({ name: r.repository.nameWithOwner.replace(`${PROFILE.handle}/`, ''), commits: r.contributions.totalCount })),
    synced: new Date().toISOString().slice(0, 10),
  };
}

function streaks(flat) {
  let longest = 0, run = 0;
  for (const v of flat) { run = v ? run + 1 : 0; longest = Math.max(longest, run); }
  let i = flat.length - 1, streak = 0;
  if (i >= 0 && !flat[i]) i--; // today may simply not have happened yet
  for (; i >= 0 && flat[i]; i--) streak++;
  return { streak, longest };
}

// --sample renders made-up numbers for checking the layout; it refuses to write into assets/.
function sampleStats() {
  let seed = 42;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const days = Array.from({ length: 52 }, (_, w) => Array.from({ length: 7 }, (_, d) => {
    const busy = 0.45 + 0.4 * Math.sin(w / 3.2), weekend = d === 0 || d === 6 ? 0.35 : 1;
    return rnd() < 0.22 ? 0 : Math.round(rnd() * rnd() * 16 * busy * weekend);
  }));
  days[40][3] = 43; // one outlier day, as real calendars have
  return {
    repos: 42, stars: 128, followers: 96, prs: 64, issues: 23, contributedTo: 17, commits: 1102, contributions: 1284, days, ...streaks(days.flat()),
    langs: [
      { name: 'TypeScript', color: '#3178c6', pct: 38.2 }, { name: 'JavaScript', color: '#f1e05a', pct: 24.9 },
      { name: 'C#', color: '#178600', pct: 15.4 }, { name: 'Java', color: '#b07219', pct: 11.1 },
      { name: 'HTML', color: '#e34c26', pct: 6.3 }, { name: 'Other', color: null, pct: 4.1 },
    ],
    topRepos: [{ name: 'sample-repo-one', commits: 312 }, { name: 'sample-repo-two', commits: 188 }, { name: 'sample-repo-three', commits: 97 }, { name: 'sample-repo-four', commits: 41 }, { name: 'sample-repo-five', commits: 12 }],
    synced: 'SAMPLE DATA',
  };
}

// --preview: build everything with sample numbers into preview/ and write preview/index.html,
// a local page that lays the README out the way GitHub does. Never upload preview/.
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const preview = process.argv.includes('--preview');
const sample = preview || process.argv.includes('--sample');
const out = preview ? join(root, 'preview', 'assets') : process.env.README_OUT ?? join(root, 'assets');
if (sample && !preview && !process.env.README_OUT) throw new Error('--sample needs README_OUT so sample numbers never land in assets/');
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const data = sample ? sampleStats() : token ? await fetchStats(token) : null;

mkdirSync(out, { recursive: true });
const files = { 'hero.svg': hero(), 'about.svg': about(), 'stack.svg': stack(), 'quote.svg': quote() };
const live = { 'city.svg': city, 'stats.svg': stats, 'trophies.svg': trophies, 'repos.svg': repos };
for (const [file, draw] of Object.entries(live)) if (data || !existsSync(join(out, file))) files[file] = draw(data);
files['line-contact.svg'] = line('./contact --pick-one', 'every card below is a link');
files['line-star.svg'] = line('git star --if-you-liked-it', 'thanks for visiting');
for (const [file, [title, sub]] of Object.entries(PROFILE.links)) files[`key-${file}.svg`] = button(file, title, sub);
for (const [file, content] of Object.entries(files)) writeFileSync(join(out, file), content);
console.log(`Wrote ${Object.keys(files).length} files to ${out}${data ? '' : ' (no token: live cards left as-is or empty)'}`);

if (preview) {
  const blocks = readFileSync(join(root, 'README.md'), 'utf8').replace(/\r\n/g, '\n').replace(/<!--[\s\S]*?-->/g, '')
    .split(/\n{2,}/).map((b) => b.trim()).filter((b) => b && !b.includes('komarev.com'))
    .map((b) => (/^<\/?div/.test(b) ? b : `<p>${b}</p>`)).join('\n');
  const page = `<!doctype html><meta charset="utf-8"><title>README preview (sample data)</title>
<style>body{margin:0;background:#0d1117;color:#e6edf3;font:16px/1.5 -apple-system,Segoe UI,Helvetica,Arial,sans-serif}
.note{background:#3d2f00;color:#ffd166;padding:10px 16px;text-align:center;font-size:14px}
main{max-width:846px;margin:24px auto;padding:24px;border:1px solid #30363d;border-radius:6px}
p{margin:0 0 16px}img{max-width:100%;vertical-align:middle}</style>
<div class="note">Local preview with SAMPLE numbers — not your real GitHub data. <span id="rm"></span></div>
<main>${blocks}</main>
<script>if (matchMedia('(prefers-reduced-motion: reduce)').matches) document.getElementById('rm').textContent = 'Animations are OFF on this device (Windows: Settings > Accessibility > Visual effects > Animation effects), so the typing and quote rotation are frozen.';</script>`;
  writeFileSync(join(root, 'preview', 'index.html'), page);
  console.log(`Open ${join(root, 'preview', 'index.html')} in a browser`);
}
