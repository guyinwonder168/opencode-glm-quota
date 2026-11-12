import { mkdtempSync, rmSync } from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

/**
 * Test isolation for credential discovery.
 *
 * Points XDG_DATA_HOME at a fresh temp dir so `getCredentialsFromOpenCodeDb()`
 * never reads the developer's real `~/.local/share/opencode/opencode.db`
 * (which exists on machines running OpenCode v2 and would otherwise win over
 * the ZAI_API_KEY environment stubs used in tests).
 */

const previousXdgDataHome = process.env.XDG_DATA_HOME
let tempDir: string | undefined

export function isolateCredentialStore(): void {
  tempDir = mkdtempSync(path.join(os.tmpdir(), 'glm-quota-test-'))
  process.env.XDG_DATA_HOME = tempDir
}

export function restoreCredentialStore(): void {
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true })
  }
  tempDir = undefined
  if (previousXdgDataHome === undefined) {
    delete process.env.XDG_DATA_HOME
  } else {
    process.env.XDG_DATA_HOME = previousXdgDataHome
  }
}
