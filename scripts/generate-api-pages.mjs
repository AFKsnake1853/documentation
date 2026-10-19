// Writes one page per Ankra API endpoint, and the API reference navigation,
// from ankra/api-reference/openapi.json.
//
// Each page is a stub: its `openapi` frontmatter points at one operation, and
// Mintlify draws the rest — parameters, responses, the request example and
// the Try it playground — from the spec. Re-run after replacing the spec:
//
//   node scripts/generate-api-pages.mjs

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const SPEC = 'ankra/api-reference/openapi.json';
const OUT = 'ankra/api-reference/endpoints';

const spec = JSON.parse(readFileSync(SPEC, 'utf8'));
const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Start clean, so an endpoint removed from the spec loses its page.
rmSync(OUT, { recursive: true, force: true });

const groups = new Map(spec.tags.map((tag) => [tag.name, []]));
for (const [path, operations] of Object.entries(spec.paths)) {
  for (const [method, op] of Object.entries(operations)) {
    const dir = `${OUT}/${slug(op.tags[0])}`;
    mkdirSync(dir, { recursive: true });
    const page = `${dir}/${path.slice(1)}`;
    writeFileSync(`${page}.mdx`, `---\nopenapi: "/${SPEC} ${method.toUpperCase()} ${path}"\n---\n`);
    groups.get(op.tags[0]).push(page);
  }
}

const config = JSON.parse(readFileSync('docs.json', 'utf8'));
const reference = config.navigation.tabs
  .flatMap((tab) => tab.groups)
  .find((group) => group.group === 'API reference');
reference.pages = [
  'ankra/api-reference/introduction',
  'ankra/api-reference/authentication',
  ...[...groups].filter(([, pages]) => pages.length).map(([group, pages]) => ({ group, pages })),
];
writeFileSync('docs.json', `${JSON.stringify(config, null, 2)}\n`);

const total = [...groups.values()].reduce((sum, pages) => sum + pages.length, 0);
console.log(`Wrote ${total} endpoint pages in ${groups.size} groups`);
