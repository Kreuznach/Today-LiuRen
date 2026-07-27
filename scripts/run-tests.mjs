/**
 * scripts/run-tests.mjs — 별도 테스트 러너 설치 없이 엔진 테스트를 실행한다.
 * Rimora(D:\Projects\CodingLan\Rimora)의 테스트 러너 방식을 그대로 이식했다.
 */
import { build } from 'esbuild'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const outDir = path.resolve('node_modules/.cache/today-liuren-tests')
fs.mkdirSync(outDir, { recursive: true })
const outfile = path.join(outDir, 'suite.mjs')

await build({
  entryPoints: [path.resolve('tests/engine.test.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  outfile,
  logLevel: 'warning',
})

const suite = await import(`${pathToFileURL(outfile).href}?t=${Date.now()}`)
const failed = await suite.run()

process.exit(failed > 0 ? 1 : 0)
