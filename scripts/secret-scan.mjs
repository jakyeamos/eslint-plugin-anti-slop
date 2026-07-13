import { execFileSync } from 'node:child_process'
import { lstatSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const maxScannableFileBytes = 16 * 1024 * 1024
const patterns = [
  { family: 'provider API key', expression: /(?:sk-ant-|sk-proj-)[A-Za-z0-9_-]{20,}/ },
  { family: 'credential assignment', expression: /(?:API_KEY|SECRET|TOKEN|PRIVATE_KEY|PASSWORD|CLIENT_SECRET|ACCESS_KEY)\s*=\s*["']?[A-Za-z0-9_./+-]{20,}/ },
  { family: 'private key', expression: /-----BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY-----/ },
  { family: 'GitHub token', expression: /(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{20,})/ },
  { family: 'npm token', expression: /npm_[A-Za-z0-9]{20,}/ },
  { family: 'Slack token', expression: /xox[baprs]-[A-Za-z0-9-]{10,}/ },
  { family: 'AWS access key', expression: /(?:AKIA|ASIA)[0-9A-Z]{16}/ },
  { family: 'Google API key', expression: /AIza[A-Za-z0-9_-]{20,}/ },
]

function trackedFiles() {
  try {
    return execFileSync('git', ['ls-files', '-z'], { cwd: root }).toString('utf8').split('\0').filter(Boolean)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    console.error(`Could not enumerate tracked files: ${detail}`)
    process.exit(1)
  }
}

function stagedContents(relativePath) {
  try {
    return execFileSync('git', ['show', `:${relativePath}`], {
      cwd: root,
      maxBuffer: maxScannableFileBytes + 1,
    })
  } catch (error) {
    if (error?.code === 'ENOBUFS' || error?.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') {
      scanLimitError(`staged file ${relativePath}`)
    }
    const detail = error instanceof Error ? error.message : String(error)
    console.error(`Could not read staged file ${relativePath}: ${detail}`)
    process.exit(1)
  }
}

function workingTreeContents(relativePath) {
  const path = resolve(root, relativePath)
  let stat
  try {
    stat = lstatSync(path)
  } catch (error) {
    if (error?.code === 'ENOENT') return null
    const detail = error instanceof Error ? error.message : String(error)
    console.error(`Could not read working-tree file ${relativePath}: ${detail}`)
    process.exit(1)
  }

  if (!stat.isFile() || stat.isSymbolicLink()) return null
  if (stat.size > maxScannableFileBytes) {
    scanLimitError(`working-tree file ${relativePath}`)
  }

  try {
    return readFileSync(path)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    console.error(`Could not read working-tree file ${relativePath}: ${detail}`)
    process.exit(1)
  }
}

function scanContents(relativePath, contents, findings) {
  if (!contents || contents.includes(0)) return

  const text = contents.toString('utf8')
  for (const pattern of patterns) {
    if (pattern.expression.test(text)) {
      findings.push({ path: relativePath, family: pattern.family })
    }
  }
}

function scanLimitError(path) {
  console.error(`Could not scan ${path}: it exceeds the ${maxScannableFileBytes}-byte limit.`)
  process.exit(1)
}

const findings = []
for (const path of trackedFiles()) {
  scanContents(path, stagedContents(path), findings)
  scanContents(path, workingTreeContents(path), findings)
}

if (findings.length > 0) {
  const summary = [...new Map(findings.map((finding) => [`${finding.path}\0${finding.family}`, finding])).values()]
    .map((finding) => `${finding.path} (${finding.family})`)
    .join(', ')
  console.error(`Potential secret literals found in: ${summary}`)
  process.exit(1)
}

console.log('No high-confidence secret literals found in tracked text files.')
