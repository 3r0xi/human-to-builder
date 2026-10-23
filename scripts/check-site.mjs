import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');
const required = [
  'index.html', 'assets/styles.css', 'assets/app.js', 'assets/city.js',
  'assets/content.js', 'assets/favicon.svg', 'assets/social-card.svg', '.nojekyll'
];
for (const path of required) assert.ok(existsSync(join(root, path)), 'Missing file: ' + path);
const html = read('index.html');
const css = read('assets/styles.css');
assert.ok(css.trim().length > 1000, 'Stylesheet appears incomplete.');
assert.match(html, /<html\b[^>]*\blang=["']en["']/i, 'Set the document language to English.');
assert.match(html, /<title>[^<]{10,}<\/title>/i, 'Provide a descriptive page title.');
const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map((match) => match[0]);
assert.ok(metas.some((tag) => /\bname=["']description["']/i.test(tag) && /\bcontent=["'][^"']{30,}["']/i.test(tag)), 'Provide a useful meta description.');
assert.ok(metas.some((tag) => /\bname=["']viewport["']/i.test(tag)), 'Provide a viewport meta tag.');
assert.match(html, /<main\b[^>]*\bid=["'][^"']+["']/i, 'Provide a main landmark with an ID.');
assert.ok(!/\bhref\s*=\s*["']\s*#\s*["']/i.test(html), 'Replace placeholder fragment links.');
assert.ok(!/\b(?:href|src)\s*=\s*["']\s*javascript:/i.test(html), 'Do not use javascript URLs.');

for (const path of ['assets/app.js', 'assets/city.js', 'assets/content.js']) {
  new vm.Script(read(path), { filename: path });
}
const context = vm.createContext({ window: {} });
new vm.Script(read('assets/content.js'), { filename: 'assets/content.js' }).runInContext(context, { timeout: 1000 });
const data = context.window.PORTFOLIO_DATA;
assert.ok(data && typeof data === 'object', 'PORTFOLIO_DATA is missing.');
for (const [name, minimum] of [['chapters', 5], ['projects', 4], ['skills', 4]]) {
  assert.ok(Array.isArray(data[name]) && data[name].length >= minimum, name + ' content is incomplete.');
}
for (const name of ['chapters', 'projects']) {
  const ids = data[name].map((item) => item.id);
  assert.ok(ids.every((id) => typeof id === 'string' && /^[a-z][a-z0-9-]*$/.test(id)), name + ' require stable lowercase IDs.');
  assert.equal(new Set(ids).size, ids.length, name + ' IDs must be unique.');
}
for (const project of data.projects) {
  for (const key of ['title', 'summary', 'status', 'problem', 'outcome', 'boundary']) {
    assert.ok(typeof project[key] === 'string' && project[key].trim(), 'Project ' + project.id + ' is missing ' + key);
  }
  assert.ok(Array.isArray(project.stack) && project.stack.length, 'Project stack is missing: ' + project.id);
  assert.ok(Array.isArray(project.approach) && project.approach.length, 'Project approach is missing: ' + project.id);
}
const htmlIds = [...html.matchAll(/\sid=["']([^"']+)["']/gi)].map((match) => match[1]);
assert.equal(new Set(htmlIds).size, htmlIds.length, 'Static HTML IDs must be unique.');
const knownIds = new Set([...htmlIds, ...data.chapters.map((item) => item.id), ...data.projects.map((item) => item.id)]);
const anchors = [...html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)].map((match) => match[0]);
assert.ok(anchors.some((tag) => /skip/i.test(tag) && /\bhref=["']#[^"']+["']/i.test(tag)), 'Provide a keyboard skip link.');

function checkReference(reference, source) {
  const value = reference.trim();
  assert.ok(value, 'Empty URL in ' + source);
  if (/^(?:https?:|mailto:|tel:|data:|blob:)/i.test(value)) return;
  if (value.startsWith('//')) return;
  if (value.startsWith('#')) {
    const id = decodeURIComponent(value.slice(1));
    assert.ok(knownIds.has(id), 'Unknown anchor ' + value + ' in ' + source);
    return;
  }
  const path = decodeURIComponent(value.split(/[?#]/, 1)[0]);
  const base = source === 'assets/styles.css' ? join(root, 'assets') : root;
  const target = resolve(base, path);
  assert.ok(target === root || target.startsWith(root + sep), 'Reference escapes site root: ' + value);
  assert.ok(existsSync(target), 'Missing local URL ' + value + ' in ' + source);
}
for (const match of html.matchAll(/\b(?:href|src)=["']([^"']*)["']/gi)) checkReference(match[1], 'index.html');
for (const match of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) checkReference(match[1], 'assets/styles.css');

const publicFiles = required.filter((path) => path !== '.nojekyll');
for (const path of publicFiles) {
  const text = read(path);
  assert.ok(!/https:\/\/github\.com\/3r0xi\/(?:Yula-v2|yula-aria-content-factory|yula-aria-website)(?:[/'"#\s]|$)/i.test(text), 'Private repository URL in public file: ' + path);
  assert.ok(!/(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|sk-proj-[A-Za-z0-9_-]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/.test(text), 'Possible credential in public file: ' + path);
}
assert.match(css, /prefers-reduced-motion/, 'Respect the operating system reduced-motion preference.');
assert.match(html, /<noscript\b/i, 'Provide content or guidance when JavaScript is disabled.');
console.log('PASS — static files, JavaScript syntax, content contracts, local links, accessibility basics, and public-source checks.');
console.log('These checks do not replace visual or interactive browser QA.');
