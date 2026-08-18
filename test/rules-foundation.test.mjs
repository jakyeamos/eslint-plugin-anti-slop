import { existsSync, readFileSync } from "node:fs";
import { plugin, settings, tester, tsTester } from "./rule-tester.mjs";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

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

        if (plugin.configs?.evidence?.rules?.["anti-slop/require-safety-comment-for-type-assertion"] !== "warn") {
          context.report({ node, message: "missing evidence config" });
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
