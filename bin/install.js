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
 */

import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { parse as parseJsonc } from 'jsonc-parser'

// ==========================================
// CONSTANTS
// ==========================================

const __filename = decodeURIComponent(new URL(import.meta.url).pathname)
const __dirname = path.dirname(__filename)
const SOURCE_DIR = path.join(__dirname, '..', 'integration')
const COMMAND_FILE = path.join(SOURCE_DIR, 'command', 'glm_quota.md')
const SKILL_FILE = path.join(SOURCE_DIR, 'skill', 'glm-quota-skill.md')
const AGENT_CONFIG = path.join(SOURCE_DIR, 'opencode.jsonc')

const CONFIG_DIR = path.join(os.homedir(), '.config', 'opencode')
const TARGET_COMMAND = path.join(CONFIG_DIR, 'command', 'glm_quota.md')
const TARGET_SKILL = path.join(CONFIG_DIR, 'skill', 'glm-quota-skill.md')

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
    if (!promptConfirm(`Skill file exists: ${TARGET_SKILL}\nOverwrite?`)) {
      console.log(`  ⊘ Skipped ${TARGET_SKILL}`)
      return
    }
  }

  copyFile(SKILL_FILE, TARGET_SKILL)
  console.log(`  ✓ Created ${TARGET_SKILL}`)
}

/**
 * Merge agent configuration and add plugin to plugins array
 */
function mergeConfig() {
  // Parse existing config if it exists (same file type will be written)
  let existingConfig = {}
  if (fileExists(TARGET_CONFIG)) {
    existingConfig = parseConfig(TARGET_CONFIG)
  }

  // Parse new agent config from integration
  const newConfig = parseConfig(AGENT_CONFIG)

  // Merge agent definitions first
  const mergedConfig = deepMerge(existingConfig, newConfig)

  // Ensure plugins array exists and add our plugin
  if (!mergedConfig.plugins) {
    mergedConfig.plugins = []
  }

  const PLUGIN_NAME = 'opencode-glm-quota'

  // Handle both "plugin" array and "agent" section
  // Check for "plugin" array first (user's config uses this)
  const pluginArrayName = mergedConfig.plugin ? 'plugin' : 'plugins'
  const plugins = Array.isArray(mergedConfig[pluginArrayName]) ? mergedConfig[pluginArrayName] : []

  // Only add if not already present
  if (!plugins.includes(PLUGIN_NAME)) {
    plugins.push(PLUGIN_NAME)
    mergedConfig[pluginArrayName] = plugins
    console.log(`  ✓ Added ${PLUGIN_NAME} to ${pluginArrayName} array`)
  } else {
    console.log(`  ⊙ Plugin ${PLUGIN_NAME} already in ${pluginArrayName} array`)
  }

  // Write merged config back to the same file (opencode.json or opencode.jsonc)
  writeConfig(TARGET_CONFIG, mergedConfig)
  console.log(`  ✓ Merged configuration into ${path.basename(TARGET_CONFIG)}`)
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
    const forceFlag = args.includes('--force')

    console.log('✓ Installing GLM Quota Plugin...\n')

    // Install integration files
    installCommand(forceFlag)
    installSkill(forceFlag)
    mergeConfig()

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
