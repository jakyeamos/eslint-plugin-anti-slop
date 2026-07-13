import { RuleTester } from "eslint";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import tsParser from "@typescript-eslint/parser";
import plugin from "../src/index.mjs";

RuleTester.afterAll = undefined;
RuleTester.describe = describe;
RuleTester.it = it;

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2024,
    sourceType: "module",
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

const tsTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2024,
    sourceType: "module",
    parser: tsParser,
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

const settings = {
  "anti-slop": {
    placeholderPatterns: ["coming soon", "todo", "tbd", "lorem ipsum", "placeholder"],
    marketingPatterns: ["powerful", "seamless", "unlock", "supercharge"],
    genericStatLabels: ["performance", "insights", "overview", "analytics", "usage", "activity"],
    actionWords: ["retry", "open", "create", "run", "fix", "clear filter"],
    demoDataModules: ["@/demo", "@/mocks", "@/fixtures"],
    realDataIndicators: ["fetch", "db", "prisma", "trpc"],
    clientOnlyImports: ["next/navigation", "@tanstack/react-query", "recharts"],
  },
};

tester.run("plugin exports", {
  meta: { type: "problem", schema: [] },
  create(context) {
    return {
      Program(node) {
        if (!plugin.configs?.recommended?.rules?.["anti-slop/no-placeholder-copy"]) {
          context.report({ node, message: "missing recommended config" });
        }

        if (plugin.configs?.strict?.rules?.["anti-slop/no-useless-memo"] !== "error") {
          context.report({ node, message: "missing strict config" });
        }

        if (plugin.configs?.recommended?.rules?.["anti-slop/no-gradient-text"] !== "warn") {
          context.report({ node, message: "missing structural UI config" });
        }

        if (plugin.meta?.version !== packageJson.version) {
          context.report({ node, message: "plugin metadata version must match package version" });
        }

        if (plugin.meta?.name !== packageJson.name) {
          context.report({ node, message: "plugin metadata name must match package name" });
        }

        if (plugin.meta?.namespace !== "anti-slop") {
          context.report({ node, message: "plugin metadata namespace must be anti-slop" });
        }

        for (const [ruleName, rule] of Object.entries(plugin.rules)) {
          const expectedUrl = `https://github.com/jakyeamos/eslint-plugin-anti-slop/blob/main/docs/rules/${ruleName}.md`;
          if (rule.meta?.docs?.url !== expectedUrl) {
            context.report({ node, message: `rule ${ruleName} must declare docs url ${expectedUrl}` });
          }

          if (!existsSync(new URL(`../docs/rules/${ruleName}.md`, import.meta.url))) {
            context.report({ node, message: `rule ${ruleName} is missing docs/rules/${ruleName}.md` });
          }
        }
      },
    };
  },
}, {
  valid: ["const ok = true;"],
  invalid: [],
});

tester.run("no-unjustified-use-client", plugin.rules["no-unjustified-use-client"], {
  valid: [
    {
      code: '"use client";\nimport * as React from "react";\nexport function View() { React.useState(false); return <button />; }',
      settings,
    },
    {
      code: '"use client";\nimport React from "react";\nexport function View() { React.useState(false); return <button />; }',
      settings,
    },
    {
      code: '"use client";\nimport React from "react";\nexport function View() { React["useState"](false); return <button />; }',
      settings,
    },
    {
      code: '"use client";\nexport function View() { return <button onClick={() => null}>Save</button>; }',
      settings,
    },
    {
      code: '"use client";\nimport { useEffect as effect } from "react";\nexport function View() { effect(() => {}, []); return <button />; }',
      settings,
    },
    {
      code: '"use client";\nimport { usePathname } from "next/navigation";\nexport function View() { return <p>{usePathname()}</p>; }',
      settings,
    },
    {
      code: '"use client";\nexport function View() { return <p>{window.location.pathname}</p>; }',
      settings,
    },
    {
      code: '"use client";\nimport { useWorkspace } from "./use-workspace";\nexport function View() { const workspace = useWorkspace(); return <p>{workspace.name}</p>; }',
      settings,
    },
    {
      code: '"use client";\nexport function View() { return <p>{globalThis["localStorage"].getItem("theme")}</p>; }',
      settings,
    },
    {
      code: "export function View() { return <section>Server only</section>; }",
      settings,
    },
  ],
  invalid: [
    {
      code: '"use client";\nexport function View() { return <section>Read only</section>; }',
      output: null,
      settings,
      errors: [{ messageId: "unjustified" }],
    },
    {
      code: '"use client";\nexport function View() { const state = props.state; return <section>{state}</section>; }',
      output: null,
      settings,
      errors: [{ messageId: "unjustified" }],
    },
    {
      code: '"use client";\nimport { useState } from "react";\nexport function View() { return <section>Static</section>; }',
      output: null,
      settings,
      errors: [{ messageId: "unjustified" }],
    },
    {
      code: '"use client";\nexport function View() { return <p online="yes">Status</p>; }',
      output: null,
      settings,
      errors: [{ messageId: "unjustified" }],
    },
    {
      code: '"use client";\nimport { useWorkspace } from "./use-workspace";\nconst config = { useWorkspace: false };\nexport function View() { return <p>{String(config.useWorkspace)}</p>; }',
      output: null,
      settings,
      errors: [{ messageId: "unjustified" }],
    },
    {
      code: '"use client";\nconst settings = { window: "server" };\nexport function View() { return <p>{settings.window}</p>; }',
      output: null,
      settings,
      errors: [{ messageId: "unjustified" }],
    },
    {
      code: '"use client";\nexport function View({ window }) { return <p>{window.location}</p>; }',
      output: null,
      settings,
      errors: [{ messageId: "unjustified" }],
    },
  ],
});

tsTester.run("no-unjustified-use-client TypeScript", plugin.rules["no-unjustified-use-client"], {
  valid: [
    {
      code: '"use client";\nimport { useWorkspace } from "./use-workspace";\nexport const workspace = useWorkspace satisfies unknown;',
      settings,
    },
  ],
  invalid: [
    {
      code: '"use client";\nimport type { AppRouterInstance } from "next/navigation";\nexport function View(): AppRouterInstance | null { return null; }',
      output: null,
      settings,
      errors: [{ messageId: "unjustified" }],
    },
    {
      code: '"use client";\nimport { useWorkspace } from "./use-workspace";\ntype Workspace = ReturnType<typeof useWorkspace>;\nexport function View(): Workspace | null { return null; }',
      output: null,
      settings,
      errors: [{ messageId: "unjustified" }],
    },
  ],
});

tester.run("no-useless-memo", plugin.rules["no-useless-memo"], {
  valid: [
    "const rows = useMemo(() => ({ total: items.length, items }), [items]);",
    "const filtered = useMemo(() => items.filter((item) => item.active), [items]);",
    "const saved = useCallback(() => { submit(); }, []);",
    "const unknown = memoFactory(() => 1, []);",
    "import { useMemo } from 'proxy-memoize';\nconst value = useMemo(() => 1, []);",
    "function useMemo(factory) { return factory(); }\nconst value = useMemo(() => 1, []);",
    "import { useMemo } from 'react';\nconst filtered = useMemo(() => items.filter((item) => item.active), [items]);",
  ],
  invalid: [
    {
      code: "const value = useMemo(() => 1, []);",
      errors: [{ messageId: "uselessMemo" }],
    },
    {
      code: "const label = useMemo(function () { return `Ready`; }, []);",
      errors: [{ messageId: "uselessMemo" }],
    },
    {
      code: "const onClick = useCallback(() => submit(), []);",
      errors: [{ messageId: "uselessCallback" }],
    },
    {
      code: "const onClick = useCallback(function () { return submit; }, []);",
      errors: [{ messageId: "uselessCallback" }],
    },
    {
      code: "import { useMemo } from 'react';\nconst value = useMemo(() => 1, []);",
      errors: [{ messageId: "uselessMemo" }],
    },
    {
      code: "import { useMemo as memoize } from 'react';\nconst value = memoize(() => 1, []);",
      errors: [{ messageId: "uselessMemo" }],
    },
    {
      code: "import * as React from 'react';\nconst value = React.useMemo(() => 1, []);",
      errors: [{ messageId: "uselessMemo" }],
    },
    {
      code: "import React from 'react';\nconst onClick = React.useCallback(() => submit(), []);",
      errors: [{ messageId: "uselessCallback" }],
    },
    {
      code: "const value = React.useMemo(() => 1, []);",
      errors: [{ messageId: "uselessMemo" }],
    },
  ],
});

tester.run("no-placeholder-copy", plugin.rules["no-placeholder-copy"], {
  valid: [
    {
      code: "const label = 'todo';",
      settings,
    },
    {
      code: "export function View() { return <input className=\"placeholder:text-muted\" />; }",
      settings,
    },
    {
      code: "const copy = { internal: `Coming soon` };",
      settings,
    },
  ],
  invalid: [
    {
      code: "export function View() { return <p>Coming soon</p>; }",
      settings,
      errors: [{ messageId: "placeholder" }],
    },
    {
      code: "export function View() { return <input placeholder=\"Coming soon\" />; }",
      settings,
      errors: [{ messageId: "placeholder" }],
    },
    {
      code: "const copy = { emptyMessage: `TBD` };",
      settings,
      errors: [{ messageId: "placeholder" }],
    },
    {
      code: "const copy = { title: 'Lorem ipsum dashboard' };",
      errors: [{ messageId: "placeholder" }],
    },
  ],
});

tester.run("no-marketing-copy", plugin.rules["no-marketing-copy"], {
  valid: [
    {
      code: "export function View() { return <p>Run payroll for contractors</p>; }",
      settings,
    },
    {
      code: "const message = 'unlock powerful internals';",
      settings,
    },
  ],
  invalid: [
    {
      code: "export function View() { return <p>Unlock powerful insights</p>; }",
      settings,
      errors: [{ messageId: "marketing" }],
    },
    {
      code: "const copy = { description: `Supercharge payroll` };",
      settings,
      errors: [{ messageId: "marketing" }],
    },
  ],
});

tester.run("require-empty-state-action", plugin.rules["require-empty-state-action"], {
  valid: [
    {
      code: "export function View() { return <section><p>No invoices</p><button>Create invoice</button></section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices. Clear filter to see more.</p></section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>Nothing found</p><a href=\"/settings\">Open settings</a></section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><div onClick={() => retry()}><p>0 results</p></div></section>; }",
      settings,
    },
    {
      code: "export function View() { return <p>No action required.</p>; }",
      settings,
    },
    {
      code: "export function View() { return <div className=\"empty-state\"><p><span>No invoices</span></p><button>Retry</button></div>; }",
      settings,
    },
    {
      code: "export function View() { return <div className=\"empty-state\"><p><span>No invoices.</span><span>Create an invoice to begin.</span></p></div>; }",
      settings,
    },
    {
      code: "export function View() { return <section>{false && 'No invoices'}</section>; }",
      settings,
    },
    {
      code: "export function View() { return <section>{undefined && <p>No invoices</p>}</section>; }",
      settings,
    },
    {
      code: "export function View() { return <section>{void 0 && <p>No invoices</p>}</section>; }",
      settings,
    },
    {
      code: "export function View() { return <section>{!true && <p>No invoices</p>}{!!false && <p>No invoices</p>}{-0 && <p>No invoices</p>}</section>; }",
      settings,
    },
    {
      code: "export function View() { return <section>{'No action required' || 'No invoices'}</section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><button disabled={false}>Retry</button></section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><button aria-disabled=\"false\">Retry</button></section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><input hidden={false} /></section>; }",
      settings,
    },
    {
      code: "export function View() { return <div>{empty && <p>No invoices</p>}{empty && <button>Retry</button>}</div>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><fieldset disabled><legend><button>Retry</button></legend></fieldset></section>; }",
      settings,
    },
    {
      code: "export function View() { return <div>{items.length === 0 && <p>No invoices</p>}{items.length === 0 && <button>Retry</button>}</div>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><fieldset aria-disabled=\"true\"><button>Retry</button></fieldset></section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><fieldset disabled><><legend><button>Retry</button></legend></></fieldset></section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><fieldset disabled><React.Fragment><legend><button>Retry</button></legend></React.Fragment></fieldset></section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><Fieldset disabled><button>Retry</button></Fieldset></section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><div onClick={undefined}><button>Retry</button></div></section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><a disabled href=\"/retry\">Retry</a></section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><a onClick={() => act()}>Go</a></section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><div disabled onClick={() => act()}>Go</div></section>; }",
      settings,
    },
    {
      code: "export function View() { return <div>{a && b && <p>No invoices</p>}{a && <button>Retry</button>}</div>; }",
      settings,
    },
    {
      code: "export function View() { return <div>{a && !b && <p>No invoices</p>}{a && <button>Retry</button>}</div>; }",
      settings,
    },
    {
      code: "export function View() { return <div>{a && b ? <p>No invoices</p> : null}{a && <button>Retry</button>}</div>; }",
      settings,
    },
    {
      code: "export function View() { return <div>{a && (b && c) && <p>No invoices</p>}{c && <button>Retry</button>}</div>; }",
      settings,
    },
    {
      code: "export function View() { return <section>{empty === true && <p>No invoices</p>}{empty && <button>Retry</button>}</section>; }",
      settings,
    },
    {
      code: "export function View() { return <section>{empty === false && <p>No invoices</p>}{!empty && <button>Retry</button>}</section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><button disabled={void 0}>Go</button></section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><button aria-disabled={void 0}>Retry</button></section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><button disabled>Retry</button>Create an invoice to begin.</section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><a href={`/retry`}>Go</a></section>; }",
      settings,
    },
  ],
  invalid: [
    {
      code: "export function View() { return <section><p>No invoices</p></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section>{empty ? 'Nothing found' : 'No invoices'}</section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><div className=\"empty-state\"><p>No invoices</p></div><footer><button>Create invoice</button></footer></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><button disabled>Retry</button></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><a>Open settings</a></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><input type=\"hidden\" value=\"retry\" /></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><button disabled=\"false\">Retry</button></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><input hidden=\"false\" /></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><div hidden><button>Retry</button></div></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section>{empty ? <p>No invoices</p> : <button>Retry</button>}</section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No <strong>invoices</strong></p></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <div className=\"empty-state\"><p>{empty ? 'No invoices' : 'Create an invoice'}</p></div>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <div className=\"empty-state\"><p>{empty ? 'No invoices' : 'Loaded'}</p>{!empty && <button>Retry</button>}</div>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><fieldset disabled><button>Retry</button></fieldset></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <div>{empty && <p>No invoices</p>}<fieldset disabled>{empty && <legend>Info</legend>}<legend><button>Retry</button></legend></fieldset></div>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><fieldset disabled><Legend><button>Retry</button></Legend></fieldset></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "const Fragment = ({ children }) => <div>{children}</div>; export function View() { return <section><p>No invoices</p><fieldset disabled><Fragment><legend><button>Retry</button></legend></Fragment></fieldset></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><Button disabled>Retry</Button></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><div onClick>Go</div></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><div onClick={true}>Go</div></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><div onClick=\"handler\">Go</div></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><div onClick={void 0}>Go</div></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><div onClick={false && retry}>Go</div></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><div onClick={true ? false : retry}>Go</div></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><div onClick={false ? retry : false}>Go</div></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p><div onClick={undefined ?? false}>Go</div></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p>{a0 ? <button>Retry</button> : null}{a1 ? <button>Retry</button> : null}{a2 ? <button>Retry</button> : null}{a3 ? <button>Retry</button> : null}{a4 ? <button>Retry</button> : null}{a5 ? <button>Retry</button> : null}{a6 ? <button>Retry</button> : null}</section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p>{a0 ? 'Retry' : null}{a1 ? 'Retry' : null}{a2 ? 'Retry' : null}{a3 ? 'Retry' : null}{a4 ? 'Retry' : null}{a5 ? 'Retry' : null}{a6 ? 'Retry' : null}</section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p><>No invoices</></p></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><button disabled>No invoices</button></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <div>{a && b && <p>No invoices</p>}{!a && <button>Retry</button>}</div>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
  ],
});

tsTester.run("require-empty-state-action TypeScript", plugin.rules["require-empty-state-action"], {
  valid: [
    {
      code: "export function View() { return <section><p>No invoices</p>{(<button>Go</button> as unknown as JSX.Element)}</section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p>{(<button>Go</button> satisfies JSX.Element)}</section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><button aria-disabled={(false as boolean)}>Retry</button></section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><a href={(\"/retry\" as string)}>Go</a></section>; }",
      settings,
    },
    {
      code: "export function View() { return <section><p>No invoices</p><input type={(\"text\" as const)} /></section>; }",
      settings,
    },
  ],
  invalid: [
    {
      code: "export function View() { return <section><p>{(\"No invoices\" as string)}</p></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>{(\"No invoices\" satisfies string)}</p></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
    {
      code: "export function View() { return <section><p>{(\"No invoices\"!)}</p></section>; }",
      settings,
      errors: [{ messageId: "emptyStateAction" }],
    },
  ],
});

tester.run("no-demo-data-primary-path", plugin.rules["no-demo-data-primary-path"], {
  valid: [
    {
      filename: "/repo/app/dashboard/page.tsx",
      code: "import { rows } from '@/fixtures/rows';\nexport async function Page() { const data = await fetch('/api/rows'); return data; }",
      settings,
    },
    {
      filename: "/repo/components/Preview.tsx",
      code: "import { rows } from '@/fixtures/rows';\nexport function Preview() { return rows; }",
      settings,
    },
    {
      filename: "/repo/src/pages/reports.tsx",
      code: "import { rows } from '@/fixtures/rows';\nexport function Page() { const records = db.report.findMany(); return records ?? rows; }",
      settings,
    },
    {
      filename: "/repo/app/page.tsx",
      code: "import { rows } from '@/fixtures/rows';\nimport { db } from '@/lib/db';\nexport async function Page() { const records = await db.report.findMany(); return records ?? rows; }",
      settings,
    },
    {
      filename: "/repo/app/dashboard/page.tsx",
      code: "import { rows } from '@/fixtures/rows';\nexport function Page() { const data = trpc.rows.list.useQuery(); return data ?? rows; }",
      settings,
    },
    {
      filename: "/repo/app/dashboard/page.tsx",
      code: "import { rows } from '@/fixtures/rows';\nimport { db } from '@/lib/db';\nexport async function Page() { const records = await db.report.findMany(); return <Table rows={records ?? rows} />; }",
      settings,
    },
    {
      filename: "/repo/app/dashboard/page.tsx",
      code: "import { rows } from '@/fixtures/rows';\nexport function Page() { return <main>Live data only</main>; }",
      settings,
    },
    {
      filename: "/repo/app/page.tsx",
      code: "import { rows } from '@/fixtures/rows';\nexport function Page() { return { rows: true }; }",
      settings,
    },
  ],
  invalid: [
    {
      filename: "/repo/app/dashboard/page.tsx",
      code: "import { rows } from '@/fixtures/rows';\nexport function Page() { return rows; }",
      settings,
      errors: [{ messageId: "demoDataPrimary" }],
    },
    {
      filename: "/repo/app/page.tsx",
      code: "import { rows } from '@/fixtures/rows';\nexport function Page() { return { [rows]: true }; }",
      settings,
      errors: [{ messageId: "demoDataPrimary" }],
    },
    {
      filename: "/repo/src/pages/reports.tsx",
      code: "import rows from '@/demo';\nexport function Page() { return rows; }",
      settings,
      errors: [{ messageId: "demoDataPrimary" }],
    },
    {
      filename: "/repo/app/page.tsx",
      code: "import { rows } from '@/fixtures/rows';\nexport function Page() { return rows; }",
      settings,
      errors: [{ messageId: "demoDataPrimary" }],
    },
    {
      filename: "/repo/src/app/dashboard/layout.tsx",
      code: "import { rows } from '@/mocks/rows';\nexport default function Layout({ children }) { return <div data-rows={rows.length}>{children}</div>; }",
      settings,
      errors: [{ messageId: "demoDataPrimary" }],
    },
    {
      filename: "/repo/app/page.tsx",
      code: "import { rows } from '@/fixtures/rows';\nconst flags = { fetch: false };\nexport function Page() { return rows; }",
      settings,
      errors: [{ messageId: "demoDataPrimary" }],
    },
    {
      filename: "/repo/app/dashboard/page.tsx",
      code: "import { rows } from '@/fixtures/rows';\nexport async function Page() { await fetch('/telemetry'); return <Table rows={rows} />; }",
      settings,
      errors: [{ messageId: "demoDataPrimary" }],
    },
    {
      filename: "/repo/app/page.tsx",
      code: "import { rows } from '@/fixtures/rows';\nimport { db } from '@/lib/db';\nexport async function Page() { const records = await db.report.findMany(); return <Table rows={rows} />; }",
      settings,
      errors: [{ messageId: "demoDataPrimary" }],
    },
    {
      filename: "/repo/app/page.tsx",
      code: "import { rows } from '@/fixtures/rows';\nimport { db } from '@/lib/db';\nexport function Page() { return <Table rows={rows} />; }",
      settings,
      errors: [{ messageId: "demoDataPrimary" }],
    },
    {
      filename: "/repo/app/page.tsx",
      code: "import { fallbackRows, previewRows } from '@/fixtures/rows';\nimport { db } from '@/lib/db';\nexport async function Page() { const records = await db.report.findMany(); return <><Table rows={records ?? fallbackRows} /><Table rows={previewRows} /></>; }",
      settings,
      errors: [{ messageId: "demoDataPrimary" }],
    },
    {
      filename: "/repo/app/page.tsx",
      code: "import { rows } from '@/fixtures/rows';\nimport { db } from '@/lib/db';\nexport async function Page() { const records = await db.report.findMany(); return <Table rows={records || rows} />; }",
      settings,
      errors: [{ messageId: "demoDataPrimary" }],
    },
    {
      filename: "/repo/app/page.tsx",
      code: "import '@/fixtures/rows';\nexport function Page() { return <main>Live data only</main>; }",
      settings,
      errors: [{ messageId: "demoDataPrimary" }],
    },
    {
      filename: "/repo/app/page.tsx",
      code: "import { rows } from '@/fixtures/rows';\nimport { db } from '@/lib/db';\nexport async function Page() { const records = await db.report.findMany(); return <>{(() => records ?? rows)()}</>; }",
      settings,
      errors: [{ messageId: "demoDataPrimary" }],
    },
    {
      filename: "/repo/app/page.tsx",
      code: "import { rows } from '@/fixtures/rows';\nimport { db } from '@/lib/db';\nexport async function Page() { let records = await db.report.findMany(); records = undefined; return <Table rows={records ?? rows} />; }",
      settings,
      errors: [{ messageId: "demoDataPrimary" }],
    },
  ],
});

tsTester.run("no-demo-data-primary-path TypeScript", plugin.rules["no-demo-data-primary-path"], {
  valid: [
    {
      filename: "/repo/app/page.tsx",
      code: "import type { Rows } from '@/fixtures/rows';\nexport function Page(): Rows | null { return null; }",
      settings,
    },
    {
      filename: "/repo/app/page.tsx",
      code: "import { rows } from '@/fixtures/rows';\nimport { db } from '@/lib/db';\ntype Rows = string[];\nexport async function Page() { const records = (await db.report.findMany()) as Rows; return <Table rows={records ?? rows} />; }",
      settings,
    },
    {
      filename: "/repo/app/page.tsx",
      code: "import { rows } from '@/fixtures/rows';\nimport { db } from '@/lib/db';\ntype Rows = string[];\nexport async function Page() { const records = await db.report.findMany(); return <Table rows={records ?? (rows as Rows)} />; }",
      settings,
    },
    {
      filename: "/repo/app/page.tsx",
      code: "import { rows } from '@/fixtures/rows';\nimport { db } from '@/lib/db';\nexport async function Page() { const records = await db.report.findMany(); return <Table rows={records ?? rows!} />; }",
      settings,
    },
  ],
  invalid: [
    {
      filename: "/repo/app/page.tsx",
      code: "import { rows } from '@/fixtures/rows';\ntype Rows = unknown;\nexport function Page() { const value = rows satisfies Rows; return value; }",
      settings,
      errors: [{ messageId: "demoDataPrimary" }],
    },
  ],
});

tester.run("no-generic-stat-label", plugin.rules["no-generic-stat-label"], {
  valid: [
    {
      code: "export function View() { return <h2>Failed payments</h2>; }",
      settings,
    },
    {
      code: "export function View() { return <h2>{title}</h2>; }",
      settings,
    },
    {
      code: "export function View() { return <Metric description=\"Analytics\" />; }",
      settings,
    },
  ],
  invalid: [
    {
      code: "export function View() { return <h2>Analytics</h2>; }",
      settings,
      errors: [{ messageId: "genericLabel" }],
    },
    {
      code: "export function View() { return <Metric label=\"Usage\" />; }",
      settings,
      errors: [{ messageId: "genericLabel" }],
    },
    {
      code: "export function View() { return <Metric title={`Overview`} />; }",
      settings,
      errors: [{ messageId: "genericLabel" }],
    },
  ],
});

tester.run("no-defensive-guard-sprawl", plugin.rules["no-defensive-guard-sprawl"], {
  valid: [
    "function isRecord(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }",
    "function parseUser(input) { if (!isRecord(input)) return null; if (input.id == null) return null; return { id: input.id }; }",
    "function assertPayload(input) { if (!isRecord(input)) throw new Error('bad'); if (input.id == null) throw new Error('bad'); if (input.email == null) throw new Error('bad'); }",
  ],
  invalid: [
    {
      code: "function parseUser(input) { if (!isRecord(input)) return null; if (input.id == null) return null; if (input.email == null) return null; return { id: input.id, email: input.email }; }",
      errors: [{ messageId: "guardSprawl" }],
    },
    {
      code: "const normalizeUser = (input) => { if (input == null) return null; if (input.id == null) return null; if (typeof input.name === 'undefined') return null; return input; };",
      errors: [{ messageId: "guardSprawl" }],
    },
    {
      code: "function parseUser(input) { if (!isRecord(input)) return null; if (input.id == null) return null; return input; }",
      options: [{ maxGuards: 1 }],
      errors: [{ messageId: "guardSprawl" }],
    },
  ],
});

tester.run("no-defensive-guard-sprawl maxGuards option", plugin.rules["no-defensive-guard-sprawl"], {
  valid: [
    {
      code: "function parseUser(input) { if (!isRecord(input)) return null; if (input.id == null) return null; if (input.email == null) return null; return input; }",
      options: [{ maxGuards: 3 }],
    },
  ],
  invalid: [],
});

tester.run("no-gradient-text", plugin.rules["no-gradient-text"], {
  valid: [
    "export function View() { return <h1 className=\"text-brand\">Revenue</h1>; }",
    "export function View() { return <h1 style={{ color: '#234' }}>Revenue</h1>; }",
    "export function View() { return <h1 className={hero ? 'bg-gradient-to-r from-red-500 to-blue-500' : 'bg-clip-text text-transparent'}>Revenue</h1>; }",
  ],
  invalid: [
    {
      code: "export function View() { return <h1 className=\"bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent\">Revenue</h1>; }",
      errors: [{ messageId: "gradientText" }],
    },
    {
      code: "export function View() { return <h1 style={{ backgroundImage: 'linear-gradient(red, blue)', backgroundClip: 'text' }}>Revenue</h1>; }",
      errors: [{ messageId: "gradientText" }],
    },
  ],
});

tester.run("no-decorative-grid-background", plugin.rules["no-decorative-grid-background"], {
  valid: [
    "export function View() { return <div className=\"grid grid-cols-2 gap-4\" />; }",
    "const blueprintBackground = 'linear-gradient(#eee, #fff)';",
  ],
  invalid: [
    {
      code: "export function View() { return <div style={{ backgroundImage: 'linear-gradient(#eee 1px, transparent 1px), linear-gradient(90deg, #eee 1px, transparent 1px)' }} />; }",
      errors: [{ messageId: "decorativeGrid" }],
    },
    {
      code: "const background = `linear-gradient(#eee 1px, transparent 1px), linear-gradient(90deg, #eee 1px, transparent 1px)`;",
      errors: [{ messageId: "decorativeGrid" }],
    },
  ],
});

tester.run("no-side-stripe-accent", plugin.rules["no-side-stripe-accent"], {
  valid: [
    "export function View() { return <aside className=\"border-l border-slate-300\" />; }",
    "export function View() { return <aside style={{ borderLeft: '1px solid red' }} />; }",
  ],
  invalid: [
    {
      code: "export function View() { return <aside className=\"border-l-4 border-red-500\" />; }",
      errors: [{ messageId: "sideStripe" }],
    },
    {
      code: "export function View() { return <aside style={{ borderLeftWidth: 6 }} />; }",
      errors: [{ messageId: "sideStripe" }],
    },
  ],
});

tester.run("no-excessive-radius", plugin.rules["no-excessive-radius"], {
  valid: [
    "export function View() { return <button className=\"rounded-full\">Save</button>; }",
    "export function View() { return <section style={{ borderRadius: 16 }} />; }",
  ],
  invalid: [
    {
      code: "export function View() { return <section className=\"rounded-[40px]\" />; }",
      errors: [{ messageId: "excessiveRadius" }],
    },
    {
      code: "export function View() { return <section style={{ borderRadius: '2rem' }} />; }",
      errors: [{ messageId: "excessiveRadius" }],
    },
    {
      code: "export function View() { return <section className=\"rounded-[20px]\" />; }",
      options: [{ maxRadiusPx: 16 }],
      errors: [{ messageId: "excessiveRadius" }],
    },
  ],
});

tester.run("no-excessive-radius maxRadiusPx option", plugin.rules["no-excessive-radius"], {
  valid: [
    {
      code: "export function View() { return <section className=\"rounded-[40px]\" />; }",
      options: [{ maxRadiusPx: 48 }],
    },
  ],
  invalid: [],
});

tester.run("no-arbitrary-z-index", plugin.rules["no-arbitrary-z-index"], {
  valid: [
    "export function View() { return <div className=\"z-50\" />; }",
    "export function View() { return <div style={{ zIndex: 20 }} />; }",
    "export function View() { return <div className={cn('fixed', false && 'z-[9999]')} />; }",
    "export function View() { return <div className={false ? 'z-[9999]' : 'z-50'} />; }",
    "export function View() { return <div className={undefined && 'z-[9999]'} />; }",
    "export function View() { return <div className={void 0 && 'z-[9999]'} />; }",
    "export function View() { return <div className={'z-50' || 'z-[9999]'} />; }",
    "export function View() { return <div className={`z-[${layer}]`} />; }",
  ],
  invalid: [
    {
      code: "export function View() { return <div className=\"z-[9999]\" />; }",
      errors: [{ messageId: "arbitraryZIndex" }],
    },
    {
      code: "export function View() { return <div style={{ zIndex: 1000 }} />; }",
      errors: [{ messageId: "arbitraryZIndex" }],
    },
    {
      code: "export function View() { return <div className={cn('fixed', open && 'z-[9999]')} />; }",
      errors: [{ messageId: "arbitraryZIndex" }],
    },
    {
      code: "export function View() { return <div className={cn('fixed', open ? 'z-[9999]' : 'z-50')} />; }",
      errors: [{ messageId: "arbitraryZIndex" }],
    },
    {
      code: "export function View() { return <div className={clsx({ a: one, b: two, c: three, d: four, e: five, f: six, 'z-[9999]': seven })} />; }",
      errors: [{ messageId: "arbitraryZIndex" }],
    },
    {
      code: "export function View() { return <div className={`fixed z-[9999] ${extra}`} />; }",
      errors: [{ messageId: "arbitraryZIndex" }],
    },
    {
      code: "export function View() { return <div style={{ zIndex: 120 }} />; }",
      options: [{ maxZIndex: 100 }],
      errors: [{ messageId: "arbitraryZIndex" }],
    },
  ],
});

tester.run("no-arbitrary-z-index maxZIndex option", plugin.rules["no-arbitrary-z-index"], {
  valid: [
    {
      code: "export function View() { return <div style={{ zIndex: 5000 }} />; }",
      options: [{ maxZIndex: 9999 }],
    },
  ],
  invalid: [],
});

tester.run("require-reduced-motion", plugin.rules["require-reduced-motion"], {
  valid: [
    "export function View() { return <button className=\"px-3\">Save</button>; }",
    "export function View() { return <button className=\"transition-colors motion-reduce:transition-none\">Save</button>; }",
    "const css = '.item { transition: opacity .2s; } @media (prefers-reduced-motion: reduce) { .item { transition: none } }';",
    "const css = '.item { animation: fade-in .2s ease-out; } @media (prefers-reduced-motion: reduce) { .item { animation: none } }';",
    "const css = '.item { animation: spin 1s !important; } @media (prefers-reduced-motion: reduce) { .item { animation: none !important; } }';",
    "const css = '.item > .child { animation: spin 1s } @media (prefers-reduced-motion: reduce) { .item>.child { animation:none } }';",
    "const css = '@media screen { .item { animation: spin 1s } } @media screen and (prefers-reduced-motion: reduce) { .item { animation: none } }';",
    "const css = '@media (min-width: 640px) { .item { animation: spin 1s } } @media (min-width:640px) and (prefers-reduced-motion: reduce) { .item { animation: none } }';",
    "const css = '@media screen { .item { animation: spin 1s } } @media screen/**/and (prefers-reduced-motion: reduce) { .item { animation: none } }';",
    "const css = '@layer reset { .x { color:red } } .item { animation:spin 1s } @media (prefers-reduced-motion: reduce) { .item { animation:none } }';",
    "const css = '@media (prefers-reduced-motion: no-preference) { .item { transition: opacity .2s; } }';",
    "export function View() { return <button className=\"motion-safe:animate-pulse\">Save</button>; }",
    "export function View() { return <button className=\"hover:transition-transform motion-reduce:hover:transition-none\">Save</button>; }",
    "export function View() { return <button className=\"animate-none transition-none\">Save</button>; }",
    "export function View() { return <button className=\"animate-spin motion-reduce:animate-none\">Save</button>; }",
    "export function View() { return <button className=\"animate-none! transition-none!\">Save</button>; }",
    "export function View() { return <button className=\"animate-spin! motion-reduce:animate-none!\">Save</button>; }",
    "export function View() { return <button style={{ animation: 'none', animationName: 'none', transition: 'none' }}>Save</button>; }",
    "export function View() { return <button style={{ animation: null, animationName: false, transition: 0 }}>Save</button>; }",
    "const css = '.thing { --animation: fade; }';",
    "const css = '.thing { /* animation: spin 1s; */ color: red; }';",
    "const css = `.item::before { content: \"foo animation: spin 1s\"; }`;",
    "const css = `.item { content: \"}\"; animation: spin 1s; } @media (prefers-reduced-motion: reduce) { .item { animation:none } }`;",
    "const css = `.item { animation: spin 1s; } @media (prefers-reduced-motion: reduce) { .item { content: \"@scope\"; animation:none } }`;",
    "import { useReducedMotion } from 'framer-motion';\nexport function View() { const reduced = useReducedMotion(); return <button className={reduced ? '' : 'animate-pulse'}>Save</button>; }",
  ],
  invalid: [
    {
      code: "export function View() { return <button className=\"transition-opacity\">Save</button>; }",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '.item { animation: fade-in .2s ease-out; }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "export function View() { return <button className=\"hover:transition-transform\">Save</button>; }",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "export function View() { return <button className=\"md:animate-spin\">Load</button>; }",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const note = 'motion-reduce: is a Tailwind variant';\nexport function View() { return <button className=\"transition-opacity\">Save</button>; }",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "export function View() { return <div><p className=\"transition-colors motion-reduce:transition-none\">Safe</p><p className=\"animate-pulse\">Unsafe</p></div>; }",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "export function View() { return <button className=\"animate-spin motion-reduce:transition-none\">Load</button>; }",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "export function View() { return <button className=\"transition-opacity motion-reduce:animate-none\">Save</button>; }",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '@media (prefers-reduced-motion: reduce) { * { animation: none } } .item { transition: opacity .2s; }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '@media (prefers-reduced-motion: reduce) { * { color: red } } .item { animation: fade-in .2s ease-out; }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '.thing { animation: none, spin 1s linear infinite; }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '@media (prefers-reduced-motion: reduce) { .other { animation: none; } } .thing { animation: fade 1s; }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '@media (prefers-reduced-motion: reduce) { .thing { animation: none; } } .thing, .other { animation: spin 1s; }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '@media (prefers-reduced-motion: reduce) { * { animation: none; } } .thing { animation: spin 1s; }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '@media (prefers-reduced-motion: reduce) { .item { animation: none; } } .item { animation: spin 1s; }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '@media (prefers-reduced-motion: reduce) { .item { animation: spin 1s; } }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '@media (prefers-reduced-motion: reduce) { .item { animation: none; } .item { animation: spin 1s; } }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '.item { animation: spin 1s !important; } @media (prefers-reduced-motion: reduce) { .item { animation: none; } }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '@media not all and (prefers-reduced-motion: no-preference) { .item { transition: opacity .2s; } }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '@media (prefers-reduced-motion: no-preference), (min-width: 10000px) { .item { transition: opacity .2s; } }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '@media (prefers-reduced-motion: no-preference) or (prefers-reduced-motion: reduce) { .item { animation: spin 1s } }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '.item { animation: spin 1s } @media (prefers-reduced-motion: reduce) { @media (prefers-reduced-motion: no-preference) { .item { animation:none } } }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '@layer base, components; @layer components { .item { animation: spin 1s; } } @layer base { @media (prefers-reduced-motion: reduce) { .item { animation:none; } } }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '.foo { & .item { animation:spin 1s } } @media (prefers-reduced-motion: reduce) { .bar { & .item { animation:none } } }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '.item { animation:spin 1s } @media (prefers-reduced-motion: reduce) { .outside { .item { animation:none } } }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '.item { animation:spin 1s } @media (prefers-reduced-motion: reduce) { @scope (.scoped) { .item { animation:none } } }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = '@layer { .item { animation:spin 1s !important } } @media (prefers-reduced-motion: reduce) { .item { animation:none !important } }';",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = `.item { animation: spin 1s; } @media (prefers-reduced-motion: reduce) { .item { content: \"foo animation: none \"; } }`;",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = `.item { content: \"@media print {\"; animation: spin 1s; }`;",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "const css = `.item { content: \"/*\"; animation: spin 1s; content: \"*/\"; }`;",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: String.raw`const css = '.x { content: "\\\\"; } .item { animation: spin 1s; }';`,
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "export function View() { return <button className=\"hover:transition-transform motion-reduce:transition-none\">Save</button>; }",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "export function View() { return <button className=\"motion-reduce:animate-spin\">Save</button>; }",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "export function View() { return <button className=\"!animate-spin\">Save</button>; }",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "export function View() { return <button className=\"animate-spin! motion-reduce:animate-none\">Save</button>; }",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "export function View() { return <button className=\"first:hover:animate-spin motion-reduce:hover:first:animate-none\">Save</button>; }",
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "export function View() { return <button className={reduced ? 'motion-reduce:transition-none' : 'transition-opacity'}>Save</button>; }",
      errors: [{ messageId: "reducedMotion" }],
    },
  ],
});

tsTester.run("require-reduced-motion TypeScript", plugin.rules["require-reduced-motion"], {
  valid: [],
  invalid: [
    {
      code: "export function View() { return <button style={({ animation: \"spin 1s\" } as unknown)}>Save</button>; }",
      settings,
      errors: [{ messageId: "reducedMotion" }],
    },
    {
      code: "export function View() { return <button style={{ animation: (\"spin 1s\" as const) }}>Save</button>; }",
      settings,
      errors: [{ messageId: "reducedMotion" }],
    },
  ],
});

tester.run("no-hidden-reveal-default", plugin.rules["no-hidden-reveal-default"], {
  valid: [
    "export function View() { return <section className=\"opacity-0\">Draft</section>; }",
    "export function View() { return <section className=\"opacity-100 transition-opacity\">Visible</section>; }",
    "export function View() { return <section className={cn('opacity-100', isOpen && 'transition-opacity')}>Visible</section>; }",
    "export function View() { return <section className={hidden ? 'opacity-0' : 'transition-opacity'}>Visible</section>; }",
    "export function View() { return <section className={cx({ 'opacity-0': false, 'transition-opacity': true })}>Visible</section>; }",
    "export function View() { return <section className={cn(false && 'opacity-0', 'transition-opacity')}>Visible</section>; }",
  ],
  invalid: [
    {
      code: "export function View() { return <section className=\"opacity-0 transition-opacity\">Hidden</section>; }",
      errors: [{ messageId: "hiddenReveal" }],
    },
    {
      code: "export function View() { return <section style={{ opacity: 0, transition: 'opacity .2s' }}>Hidden</section>; }",
      errors: [{ messageId: "hiddenReveal" }],
    },
    {
      code: "export function View() { return <section className={cn('opacity-0', isOpen && 'transition-opacity')}>Hidden</section>; }",
      errors: [{ messageId: "hiddenReveal" }],
    },
    {
      code: "export function View() { return <section className={clsx(['opacity-0', 'transition-opacity'])}>Hidden</section>; }",
      errors: [{ messageId: "hiddenReveal" }],
    },
    {
      code: "export function View() { return <section className={cx({ 'opacity-0': true, 'transition-opacity': isOpen })}>Hidden</section>; }",
      errors: [{ messageId: "hiddenReveal" }],
    },
  ],
});

tester.run("no-nested-cards", plugin.rules["no-nested-cards"], {
  valid: [
    "export function View() { return <Card><section>Details</section></Card>; }",
    "export function View() { return <div className=\"panel\"><div className=\"card\">Details</div></div>; }",
  ],
  invalid: [
    {
      code: "export function View() { return <div className=\"card\"><div className=\"card\">Nested</div></div>; }",
      errors: [{ messageId: "nestedCard" }],
    },
    {
      code: "export function View() { return <Card><MetricCard /></Card>; }",
      errors: [{ messageId: "nestedCard" }],
    },
  ],
});
