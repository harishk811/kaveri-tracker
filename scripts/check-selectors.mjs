#!/usr/bin/env node
// Selector-safety check — flags zustand selectors that return a NEW reference
// on every call (Object.values, filters, maps, spread, `?? []` fallbacks).
// These break useSyncExternalStore's snapshot caching and cause the
// "Maximum update depth exceeded" crash that blanked the whole app.
// Exits non-zero when a dangerous selector is found.
//
// Run: npm run check:selectors

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname, '..', 'src')

const DANGEROUS = [
  { name: 'Object.values(...) in selector', re: /useStore\(\(s\) => [^)]*Object\.values\(/ },
  { name: 'array literal in selector', re: /useStore\(\(s\) => \[/ },
  { name: '.filter/.map/.sort/.slice/.reduce in selector', re: /useStore\(\(s\) => [^)]*\.(filter|map|sort|slice|reduce)\(/ },
  { name: '`?? []` fallback in selector', re: /useStore\(\(s\) => [^)]*\?\? \[\]/ },
  { name: 'spread in selector', re: /useStore\(\(s\) => [^)]*\.\.\./ },
]

const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f)
  return statSync(p).isDirectory() ? walk(p) : (f.endsWith('.tsx') || f.endsWith('.ts') ? [p] : [])
})

let bad = 0
for (const file of walk(ROOT)) {
  const src = readFileSync(file, 'utf8')
  for (const { name, re } of DANGEROUS) {
    const lines = src.split('\n')
    for (const m of src.matchAll(new RegExp(re.source, 'g'))) {
      const lineNo = src.slice(0, m.index).split('\n').length
      const line = lines[lineNo - 1].trim()
      if (line.includes('?? []')) {
        // ?? [] outside a selector callback is fine; only flag useStore ones
        if (!line.includes('useStore')) continue
      }
      console.log(`DANGEROUS (${name}): ${file.replace(ROOT, 'src')}:${lineNo}`)
      console.log(`    ${line}`)
      bad++
    }
  }
}
if (bad > 0) {
  console.log(`\n${bad} dangerous selector(s) found — fix before shipping (see "Maximum update depth exceeded" crash).`)
  process.exit(1)
}
console.log('Selectors OK — no uncached-snapshot patterns.')