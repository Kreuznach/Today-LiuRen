/**
 * scripts/run-tests.mjs — 별도 테스트 러너 설치 없이 테스트를 실행한다.
 * Rimora(D:\Projects\CodingLan\Rimora)의 테스트 러너 방식을 그대로 이식했다.
 */
import { build } from 'esbuild'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const outDir = path.resolve('node_modules/.cache/today-liuren-tests')
fs.mkdirSync(outDir, { recursive: true })

const suites = ['engine.test.ts', 'content.test.ts']

await build({
  entryPoints: suites.map(name => path.resolve('tests', name)),
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  outdir: outDir,
  outExtension: { '.js': '.mjs' },
  logLevel: 'warning',
})

let failed = 0
for (const name of suites) {
  const outfile = path.join(outDir, name.replace(/\.ts$/, '.mjs'))
  const suite = await import(`${pathToFileURL(outfile).href}?t=${Date.now()}`)
  failed += await suite.run()
}

process.exit(failed > 0 ? 1 : 0)
