import { describe, test, afterEach } from 'node:test'
import assert from 'node:assert'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { spawnSync } from 'node:child_process'

const PLUGIN_NAME = 'opencode-glm-quota'
const createdHomes: string[] = []

function createTempHome(): string {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'glm-quota-installer-'))
  createdHomes.push(tempHome)
  return tempHome
}

function runInstaller(tempHome: string): void {
  const result = spawnSync('node', ['bin/install.js', '--force'], {
    cwd: process.cwd(),
    encoding: 'utf-8',
    env: {
      ...process.env,
      HOME: tempHome,
      USERPROFILE: tempHome
    }
  })

  assert.strictEqual(
    result.status,
    0,
    `Installer failed.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
  )
}

function readConfig(tempHome: string): Record<string, unknown> {
  const configPath = path.join(tempHome, '.config', 'opencode', 'opencode.json')
  assert.ok(fs.existsSync(configPath), `Expected config file to exist: ${configPath}`)
  const content = fs.readFileSync(configPath, 'utf-8')
  return JSON.parse(content) as Record<string, unknown>
}

afterEach(() => {
  while (createdHomes.length > 0) {
    const tempHome = createdHomes.pop()
    if (!tempHome) {
      continue
    }
    fs.rmSync(tempHome, { recursive: true, force: true })
  }
})

describe('Installer config key handling', () => {
  test('fresh install writes plugin key (not plugins)', () => {
    const tempHome = createTempHome()

    runInstaller(tempHome)
    const config = readConfig(tempHome)

    const pluginArray = config.plugin
    assert.ok(Array.isArray(pluginArray), 'Expected "plugin" to be an array')
    assert.ok(pluginArray.includes(PLUGIN_NAME), `Expected plugin array to include ${PLUGIN_NAME}`)
    assert.strictEqual(
      Object.prototype.hasOwnProperty.call(config, 'plugins'),
      false,
      'Expected "plugins" key to be absent'
    )
  })

  test('migrates legacy plugins key into plugin key', () => {
    const tempHome = createTempHome()
    const configDir = path.join(tempHome, '.config', 'opencode')
    fs.mkdirSync(configDir, { recursive: true })
    fs.writeFileSync(
      path.join(configDir, 'opencode.json'),
      JSON.stringify({ plugins: ['existing-plugin'] }, null, 2) + '\n'
    )

    runInstaller(tempHome)
    const config = readConfig(tempHome)

    const pluginArray = config.plugin
    assert.ok(Array.isArray(pluginArray), 'Expected "plugin" to be an array')
    assert.ok(pluginArray.includes('existing-plugin'), 'Expected legacy plugin value to be preserved')
    assert.ok(pluginArray.includes(PLUGIN_NAME), `Expected plugin array to include ${PLUGIN_NAME}`)
    assert.strictEqual(
      Object.prototype.hasOwnProperty.call(config, 'plugins'),
      false,
      'Expected legacy "plugins" key to be removed'
    )
  })
})
