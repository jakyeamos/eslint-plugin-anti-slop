import { RuleTester } from "eslint";
import { describe, it } from "node:test";
import plugin from "../src/index.mjs";

RuleTester.afterAll = undefined;
RuleTester.describe = describe;
RuleTester.it = it;

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
      code: "export function View() { return <section>Server only</section>; }",
      settings,
    },
  ],
  invalid: [
    {
      code: '"use client";\nexport function View() { return <section>Read only</section>; }',
      output: 'export function View() { return <section>Read only</section>; }',
      settings,
      errors: [{ messageId: "unjustified" }],
    },
    {
      code: '"use client";\nexport function View() { const state = props.state; return <section>{state}</section>; }',
      output: 'export function View() { const state = props.state; return <section>{state}</section>; }',
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
  ],
  invalid: [
    {
      filename: "/repo/app/dashboard/page.tsx",
      code: "import { rows } from '@/fixtures/rows';\nexport function Page() { return rows; }",
      settings,
      errors: [{ messageId: "demoDataPrimary" }],
    },
    {
      filename: "/repo/src/pages/reports.tsx",
      code: "import rows from '@/demo';\nexport function Page() { return rows; }",
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
  ],
});
