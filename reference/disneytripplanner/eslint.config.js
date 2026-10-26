import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

// Convention checks (DTP-104). Each selector below turns a rule from CLAUDE.md
// or the shared policy into a lint error. A rule that needs judgement is not
// here; it stays with the Standards reviewer. ESLint replaces a rule's options
// wholesale when a later config block sets the same rule, so the lists are
// assembled here and each block gets its complete list.
const sharedSyntax = [
  // R4
  {
    selector:
      "CallExpression[callee.name=/^(confirm|alert|prompt)$/], " +
      "CallExpression[callee.object.name=/^(window|globalThis)$/][callee.property.name=/^(confirm|alert|prompt)$/]",
    message: 'No browser dialogs: use showConfirm() from confirm.ts (shared policy: Confirm dialogs).',
  },
  // R3. A selector cannot see types, so this also flags new Date(someNumber) and new Date(otherDate);
  // build those from separate numbers or through a utils.ts helper instead.
  {
    selector:
      "NewExpression[callee.name='Date'][arguments.length=1], " +
      "CallExpression[callee.object.name='Date'][callee.property.name='parse']",
    message:
      'Never build a Date from a stored datetime string; use a parse helper from utils.ts (shared policy: Datetime handling).',
  },
  // R5
  {
    selector: "JSXAttribute[name.name='style']",
    message: 'No inline style= attributes: give it a named class in the stylesheet (shared policy: CSS).',
  },
  // R6
  {
    selector:
      "CallExpression[callee.name='fetch'], " +
      "CallExpression[callee.object.name=/^(window|globalThis)$/][callee.property.name='fetch'], " +
      "NewExpression[callee.name=/^(XMLHttpRequest|WebSocket|EventSource)$/], " +
      "MemberExpression[object.name='navigator'][property.name='sendBeacon']",
    message:
      'No network calls from the frontend: the only network activity is the park-hours fetch in the Rust backend.',
  },
]
// R1
const invokeOutsideApi = {
  selector: "CallExpression[callee.name='invoke']",
  message: 'Never call invoke() outside src/api.ts: add a wrapper there and call it through api.',
}
// R2. src/api.ts: "one line per command. No logic, no transformation."
const apiEntry = "VariableDeclarator[id.name='api'] > ObjectExpression > Property"
const thinApiSyntax = [
  {
    selector: `${apiEntry}[value.type!='ArrowFunctionExpression']`,
    message: 'Every api entry must be an arrow function wrapping one invoke() call.',
  },
  {
    selector: `${apiEntry} > ArrowFunctionExpression[body.type!='CallExpression']`,
    message: "An api entry's body must be a single direct invoke() call, with no block and no logic.",
  },
  {
    selector: `${apiEntry} > ArrowFunctionExpression > CallExpression.body:not([callee.name='invoke'])`,
    message: 'An api entry must call invoke() directly, with no chaining or other calls.',
  },
  {
    selector:
      `${apiEntry} > ArrowFunctionExpression > CallExpression.body ` +
      ':matches(CallExpression, ConditionalExpression, LogicalExpression, BinaryExpression, AwaitExpression, TemplateLiteral, ArrowFunctionExpression)',
    message: 'No logic or transformation inside an api entry: pass the arguments through unchanged.',
  },
]
// R6
const iconLibraries = {
  group: [
    'react-icons', 'react-icons/*', '@fortawesome/*', '@heroicons/*', '@phosphor-icons/*',
    '@tabler/icons', '@tabler/icons-react', '@mui/icons-material', '@mui/icons-material/*',
  ],
  message: 'Icons come from lucide-react only.',
}
const restrictedImports = (extra = []) => ({ patterns: [iconLibraries, ...extra] })

export default tseslint.config(
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // This app's established pattern (see POLICY.md's "Data fetching"
      // component pattern, and PEER_REVIEW.md's 0.29.0 entry) is resetting
      // local state via a useEffect keyed on a changed id/prop -- e.g. every
      // edit sheet reseeding its draft when the item being edited changes.
      // That's exactly what this rule flags. Disabled rather than refactored
      // across the ~12 components that rely on it.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    ignores: ['src/api.ts'],
    rules: {
      'no-restricted-syntax': ['error', invokeOutsideApi, ...sharedSyntax],
      'no-restricted-imports': [
        'error',
        restrictedImports([{ group: ['@tauri-apps/*'], message: 'Only src/api.ts talks to the Tauri backend.' }]),
      ],
    },
  },
  {
    files: ['src/api.ts'],
    rules: {
      'no-restricted-syntax': ['error', ...thinApiSyntax, ...sharedSyntax],
      'no-restricted-imports': ['error', restrictedImports()],
    },
  },
)
