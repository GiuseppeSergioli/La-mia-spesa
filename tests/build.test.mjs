import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { Script } from 'node:vm';
test('standalone demo compiles as one classic script with no external assets',async()=>{
  execFileSync(process.execPath,[new URL('../scripts/build-demo.mjs',import.meta.url).pathname]);
  const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
  const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);assert.doesNotThrow(()=>new Script(script));
  assert.ok(script.includes('window.SPESINA_STATIC=true;'));
  assert.equal(/<script[^>]+src=/.test(html),false);
  assert.equal(/<link[^>]+stylesheet/.test(html),false);
  assert.equal(/@import/.test(html),false);
  assert.ok(Buffer.byteLength(html)<512*1024);
});
