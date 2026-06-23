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
  ],
  invalid: [
    {
      code: "const value = useMemo(() => 1, []);",
      errors: [{ messageId: "uselessMemo" }],
    },
    {
      code: "const onClick = useCallback(() => submit(), []);",
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
  ],
});

tester.run("no-marketing-copy", plugin.rules["no-marketing-copy"], {
  valid: [
    {
      code: "export function View() { return <p>Run payroll for contractors</p>; }",
      settings,
    },
  ],
  invalid: [
    {
      code: "export function View() { return <p>Unlock powerful insights</p>; }",
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
  ],
  invalid: [
    {
      code: "export function View() { return <section><p>No invoices</p></section>; }",
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
  ],
  invalid: [
    {
      filename: "/repo/app/dashboard/page.tsx",
      code: "import { rows } from '@/fixtures/rows';\nexport function Page() { return rows; }",
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
  ],
  invalid: [
    {
      code: "export function View() { return <h2>Analytics</h2>; }",
      settings,
      errors: [{ messageId: "genericLabel" }],
    },
  ],
});
