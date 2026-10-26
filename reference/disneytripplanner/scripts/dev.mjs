// `npm run dev`. In the main folder it is plain `tauri dev`. Inside a git worktree it runs the dev
// server on a port of its own, so the worktree's app can run next to the real app in the main folder
// (which holds port 5173). The port comes from the number at the end of the worktree
// folder's name (for example .../worktrees/DTP-101 -> 5274). The worktree keeps its own
// data folder and its own Rust build folder, so nothing is shared with the main folder.
import { execFileSync, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

const MAIN_PORT = 5173

function git(arg) {
  try {
    return execFileSync('git', ['rev-parse', '--path-format=absolute', arg], { encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
}

const tauri = path.join('node_modules', '@tauri-apps', 'cli', 'tauri.js')
if (!existsSync(tauri)) {
  console.error('node_modules is missing here. Run npm install first.')
  process.exit(1)
}

const args = ['dev', ...process.argv.slice(2)]
const env = { ...process.env }
const inWorktree = git('--git-dir') !== git('--git-common-dir')

if (inWorktree) {
  const folder = path.basename(process.cwd())
  const match = folder.match(/(\d+)$/)
  if (!match) {
    console.error(`Cannot pick a dev port: the worktree folder "${folder}" does not end in a change number.`)
    process.exit(1)
  }
  // 1..1000 above the main folder's port, so it can never be the main folder's own.
  const port = MAIN_PORT + 1 + ((Number(match[1]) - 1 + 1000) % 1000)
  console.log(`Worktree ${folder}: dev server on port ${port} (the main folder keeps ${MAIN_PORT}).`)
  args.push('--config', JSON.stringify({ build: { devUrl: `http://localhost:${port}` } }))
  env.DTP_DEV_PORT = String(port)
}

const child = spawn(process.execPath, [tauri, ...args], { stdio: 'inherit', env })
child.on('exit', (code) => process.exit(code ?? 1))
