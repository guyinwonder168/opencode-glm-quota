#!/usr/bin/env node

/**
 * GLM Quota Plugin Installer
 *
 * This script installs the GLM Quota Plugin integration files into the user's
 * OpenCode configuration directory (~/.config/opencode/).
 *
 * Usage:
 *   node bin/install.js              # Interactive install (ask before overwriting)
 *   node bin/install.js --force      # Force overwrite existing files
 *   node bin/install.js uninstall    # Remove integration files and config
 */

import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'
import { parse as parseJsonc } from 'jsonc-parser'

// ==========================================
// CONSTANTS
// ==========================================

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const SOURCE_DIR = path.join(__dirname, '..', 'integration')
const COMMAND_FILE = path.join(SOURCE_DIR, 'command', 'glm_quota.md')
const SKILL_FILE = path.join(SOURCE_DIR, 'skills', 'glm-quota', 'SKILL.md')
const AGENT_FILE = path.join(SOURCE_DIR, 'agents', 'glm-quota-exec.md')

const CONFIG_DIR = path.join(os.homedir(), '.config', 'opencode')
const TARGET_COMMAND = path.join(CONFIG_DIR, 'command', 'glm_quota.md')
const TARGET_SKILL = path.join(CONFIG_DIR, 'skills', 'glm-quota', 'SKILL.md')
const TARGET_AGENT = path.join(CONFIG_DIR, 'agents', 'glm-quota-exec.md')

// Check which config file exists (opencode.json or opencode.jsonc)
const TARGET_CONFIG_JSON = path.join(CONFIG_DIR, 'opencode.json')
const TARGET_CONFIG_JSONC = path.join(CONFIG_DIR, 'opencode.jsonc')
let TARGET_CONFIG = null
if (fileExists(TARGET_CONFIG_JSON)) {
  TARGET_CONFIG = TARGET_CONFIG_JSON
} else if (fileExists(TARGET_CONFIG_JSONC)) {
  TARGET_CONFIG = TARGET_CONFIG_JSONC
} else {
  // Default to opencode.json if neither exists
  TARGET_CONFIG = TARGET_CONFIG_JSON
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Ensure directory exists, create if missing
 */
function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

/**
 * Check if file exists
 */
function fileExists(filePath) {
  return fs.existsSync(filePath)
}

/**
 * Copy file from source to destination
 */
function copyFile(source, destination) {
  ensureDirectory(path.dirname(destination))
  fs.copyFileSync(source, destination)
}

/**
 * Remove file if it exists
 */
function removeFile(filePath, label) {
  if (fileExists(filePath)) {
    fs.unlinkSync(filePath)
    console.log(`  ✓ Removed ${label}`)
  } else {
    console.log(`  ⊙ Not found ${label}`)
  }
}

/**
 * Remove directory if it exists
 */
function removeDirectory(dirPath, label) {
  if (fileExists(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true })
    console.log(`  ✓ Removed ${label}`)
  } else {
    console.log(`  ⊙ Not found ${label}`)
  }
}

/**
 * Parse JSON or JSONC file
 */
function parseConfig(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return parseJsonc(content)
  } catch (error) {
    throw new Error(`Failed to parse ${filePath}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Write JSON file
 */
function writeConfig(filePath, data) {
  ensureDirectory(path.dirname(filePath))
  const json = JSON.stringify(data, null, 2) + '\n'
  fs.writeFileSync(filePath, json)
  console.log(`  ✓ Wrote ${filePath} (${json.length} bytes)`)
}

/**
 * Deep merge objects
 */
function deepMerge(target, source) {
  const result = { ...target }

  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && key in result && result[key] instanceof Object) {
      result[key] = deepMerge(result[key], source[key])
    } else {
      result[key] = source[key]
    }
  }

  return result
}

/**
 * Prompt user for confirmation
 */
function promptConfirm(message) {
  process.stdout.write(`${message} (y/N) `)
  const response = process.stdin.read()
  return response?.trim().toLowerCase() === 'y'
}

// ==========================================
// INSTALLATION FUNCTIONS
// ==========================================

/**
 * Install command file
 */
function installCommand(force) {
  if (fileExists(TARGET_COMMAND) && !force) {
    if (!promptConfirm(`Command file exists: ${TARGET_COMMAND}\nOverwrite?`)) {
      console.log(`  ⊘ Skipped ${TARGET_COMMAND}`)
      return
    }
  }

  copyFile(COMMAND_FILE, TARGET_COMMAND)
  console.log(`  ✓ Created ${TARGET_COMMAND}`)
}

/**
 * Install skill file
 */
function installSkill(force) {
  if (fileExists(TARGET_SKILL) && !force) {
    if (!promptConfirm(`Skill directory exists: ${path.dirname(TARGET_SKILL)}\nOverwrite?`)) {
      console.log(`  ⊘ Skipped ${TARGET_SKILL}`)
      return
    }
  }

  copyFile(SKILL_FILE, TARGET_SKILL)
  console.log(`  ✓ Created ${path.join(path.basename(path.dirname(TARGET_SKILL)), path.basename(TARGET_SKILL))}`)
}

/**
 * Install agent file
 */
function installAgent(force) {
  if (fileExists(TARGET_AGENT) && !force) {
    if (!promptConfirm(`Agent file exists: ${TARGET_AGENT}\nOverwrite?`)) {
      console.log(`  ⊘ Skipped ${TARGET_AGENT}`)
      return
    }
  }

  copyFile(AGENT_FILE, TARGET_AGENT)
  console.log(`  ✓ Created ${TARGET_AGENT}`)
}

/**
 * Update plugin configuration and cleanup old JSON agent
 */
function updatePluginConfig() {
  // Parse existing config if it exists
  let existingConfig = {}
  if (fileExists(TARGET_CONFIG)) {
    existingConfig = parseConfig(TARGET_CONFIG)
  }

  const PLUGIN_NAME = 'opencode-glm-quota'

  // CLEANUP: Remove old JSON agent config if it exists (migration from v1.3.x)
  if (existingConfig.agent && existingConfig.agent['glm-quota-exec']) {
    delete existingConfig.agent['glm-quota-exec']
    if (Object.keys(existingConfig.agent).length === 0) {
      delete existingConfig.agent
    }
    console.log('  ✓ Removed old JSON agent config (migrated to Markdown)')
  }

  // OpenCode config key is "plugin" (singular). Migrate legacy "plugins" entries.
  const plugin = Array.isArray(existingConfig.plugin) ? [...existingConfig.plugin] : []
  const legacyPlugins = Array.isArray(existingConfig.plugins) ? existingConfig.plugins : []

  if (legacyPlugins.length > 0) {
    for (const name of legacyPlugins) {
      if (typeof name === 'string' && !plugin.includes(name)) {
        plugin.push(name)
      }
    }
    delete existingConfig.plugins
    console.log('  ✓ Migrated legacy plugins array to plugin')
  }

  // Only add if not already present
  if (!plugin.includes(PLUGIN_NAME)) {
    plugin.push(PLUGIN_NAME)
    console.log(`  ✓ Added ${PLUGIN_NAME} to plugin array`)
  } else {
    console.log(`  ⊙ Plugin ${PLUGIN_NAME} already in plugin array`)
  }

  existingConfig.plugin = plugin

  // Write config back to same file (opencode.json or opencode.jsonc)
  writeConfig(TARGET_CONFIG, existingConfig)
  console.log(`  ✓ Updated ${path.basename(TARGET_CONFIG)}`)
}

/**
 * Remove plugin configuration and agent configuration
 */
function removeConfig() {
  if (!fileExists(TARGET_CONFIG)) {
    console.log(`  ⊙ Config not found: ${TARGET_CONFIG}`)
    return
  }

  const PLUGIN_NAME = 'opencode-glm-quota'
  const existingConfig = parseConfig(TARGET_CONFIG)
  let changed = false

  if (Array.isArray(existingConfig.plugin)) {
    const next = existingConfig.plugin.filter((name) => name !== PLUGIN_NAME)
    if (next.length !== existingConfig.plugin.length) {
      existingConfig.plugin = next
      changed = true
      console.log('  ✓ Removed plugin from plugin array')
    }
  }

  if (Array.isArray(existingConfig.plugins)) {
    const next = existingConfig.plugins.filter((name) => name !== PLUGIN_NAME)
    if (next.length !== existingConfig.plugins.length) {
      existingConfig.plugins = next
      changed = true
      console.log('  ✓ Removed plugin from plugins array')
    }
  }

  if (existingConfig.agent && existingConfig.agent['glm-quota-exec']) {
    delete existingConfig.agent['glm-quota-exec']
    if (Object.keys(existingConfig.agent).length === 0) {
      delete existingConfig.agent
    }
    changed = true
    console.log('  ✓ Removed glm-quota-exec agent config')
  }

  if (changed) {
    writeConfig(TARGET_CONFIG, existingConfig)
    console.log(`  ✓ Updated ${path.basename(TARGET_CONFIG)}`)
  } else {
    console.log('  ⊙ No config changes needed')
  }
}

/**
 * Remove npm package
 */
function removePackage(globalFlag) {
  const args = ['remove', 'opencode-glm-quota']
  if (globalFlag) {
    args.push('--global')
  }

  const result = spawnSync('npm', args, { stdio: 'inherit' })
  if (result.status !== 0) {
    console.log('  ⊙ npm remove failed, remove manually if needed')
  }
}

/**
 * Uninstall integration files and configuration
 */
function uninstall(globalFlag) {
  removeFile(TARGET_COMMAND, TARGET_COMMAND)
  removeDirectory(path.dirname(TARGET_SKILL), path.dirname(TARGET_SKILL))
  removeFile(TARGET_AGENT, TARGET_AGENT)
  removeConfig()
  removePackage(globalFlag)
}

// ==========================================
// MAIN INSTALLATION FUNCTION
// ==========================================

/**
 * Main installer function
 */
function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2)
    const isUninstall = args.includes('uninstall')
    const forceFlag = args.includes('--force')
    const globalFlag = args.includes('--global') || args.includes('-g')

    if (isUninstall) {
      console.log('✓ Uninstalling GLM Quota Plugin...\n')
      uninstall(globalFlag)
      console.log()
      console.log('✓ Uninstall complete!')
      return
    }

    console.log('✓ Installing GLM Quota Plugin...\n')

    // Install integration files
    installCommand(forceFlag)
    installSkill(forceFlag)
    installAgent(forceFlag)
    updatePluginConfig()

    console.log()
    console.log('✓ Installation complete!')
    console.log('✓ Restart OpenCode to use /glm_quota command')

  } catch (error) {
    console.error(`\n✗ Installation failed: ${error instanceof Error ? error.message : String(error)}`)
    console.error('✗ Check file permissions and try again')
    process.exit(1)
  }
}

// Run installer
main()
