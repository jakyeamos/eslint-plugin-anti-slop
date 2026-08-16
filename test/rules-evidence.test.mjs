import { plugin, tsTester } from "./rule-tester.mjs";

tsTester.run(
  "require-safety-comment-for-type-assertion",
  plugin.rules["require-safety-comment-for-type-assertion"],
  {
    valid: [
      {
        filename: "file.ts",
        code: "const values = [1, 2] as const;",
      },
      {
        filename: "file.ts",
        code: "const value = <const>{ id: 'one' };",
      },
      {
        filename: "file.ts",
        code: "// SAFETY: The parser established the UserId invariant.\nconst id = value as UserId;",
      },
      {
        filename: "file.ts",
        code: "function parse(): UserId {\n  // SAFETY: Validation established the UserId invariant.\n  return value as UserId;\n}",
      },
      {
        filename: "file.ts",
        code: "const id = /* SAFETY: Validation established the invariant. */ value as UserId;",
      },
    ],
    invalid: [
      {
        filename: "file.ts",
        code: "const id = value as UserId;",
        errors: [{ messageId: "missingSafetyComment" }],
      },
      {
        filename: "file.ts",
        code: "const id = <UserId>value;",
        errors: [{ messageId: "missingSafetyComment" }],
      },
      {
        filename: "file.ts",
        code: "const id = value as UserId; // SAFETY: Too late.",
        errors: [{ messageId: "missingSafetyComment" }],
      },
      {
        filename: "file.ts",
        code: "// This cast seems fine.\nconst id = value as UserId;",
        errors: [{ messageId: "missingSafetyComment" }],
      },
    ],
  },
);

tsTester.run("no-known-value-widening", plugin.rules["no-known-value-widening"], {
  valid: [
    "type Command = () => void; const commands: Record<string, Command> = {};",
    "interface Commands { readonly start: () => void } const commands: Commands = { start: () => {} };",
    "const commands = { start: () => {} } satisfies Record<string, () => void>;",
    "declare function make(): Record<string, () => void>; const commands: Record<string, () => void> = make();",
    "export {}; export type Open = Record<string, number>; const value: Open = {};",
    "export {}; const value: unknown = missing;",
    "let mutable = {}; const value: unknown = mutable;",
    "const first = second; const second = first; const value: unknown = first;",
    "declare namespace Types { type Open = { id: number }; } const value: Types.Open = { id: 1 };",
    "type Record<T> = T; const value: Record<string> = {};",
  ],
  invalid: [
    {
      code: "const value: unknown = { id: 1 };",
      errors: [{ messageId: "widening" }],
    },
    {
      code: "const value: object = [];",
      errors: [{ messageId: "widening" }],
    },
    {
      code: "type Command = () => void; const commands: Record<string, Command> = { start: () => {} };",
      errors: [{ messageId: "widening" }],
    },
    {
      code: "type Open = Record<string, () => void>; const source = { start: () => {} }; const commands: Open = source;",
      errors: [{ messageId: "widening" }],
    },
    {
      code: "function create(): unknown { return { id: 1 }; }",
      errors: [{ messageId: "widening" }],
    },
    {
      code: "const commands = { start: () => {} } as Record<string, () => void>;",
      errors: [{ messageId: "widening" }],
    },
    {
      code: "let value: unknown; value = {};",
      errors: [{ messageId: "widening" }],
    },
    {
      filename: "file.ts",
      code: "class Registry { commands: Record<string, () => void> = { start: () => {} }; }",
      errors: [{ messageId: "widening" }],
    },
    {
      code: "const make = (): unknown => ({ id: 1 });",
      errors: [{ messageId: "widening" }],
    },
    {
      filename: "file.ts",
      code: "const value = <Record<string, number>>({ id: 1 });",
      errors: [{ messageId: "widening" }],
    },
    {
      code: "const value: unknown = class {}; const other: unknown = new Date(); const third: unknown = function () {}; const fourth: unknown = \`value\`; const fifth: unknown = -1;",
      errors: [
        { messageId: "widening" },
        { messageId: "widening" },
        { messageId: "widening" },
        { messageId: "widening" },
        { messageId: "widening" },
      ],
    },
    {
      code: "type UnknownAlias = unknown; const value: UnknownAlias = { id: 1 };",
      errors: [{ messageId: "widening" }],
    },
    {
      code: "type ObjectAlias = object; const value: ObjectAlias = { id: 1 };",
      errors: [{ messageId: "widening" }],
    },
    {
      code: "type OpenAlias = { [key: string]: number }; const value: OpenAlias = { id: 1 };",
      errors: [{ messageId: "widening" }],
    },
    {
      code: "type MappedAlias = { [key in string | number]: number }; const value: MappedAlias = { id: 1 };",
      errors: [{ messageId: "widening" }],
    },
    {
      code: "type PropertyAlias = { [key in PropertyKey]: number }; const value: PropertyAlias = { id: 1 };",
      errors: [{ messageId: "widening" }],
    },
    {
      code: "type GenericOpen<T> = Record<string, T>; const value: GenericOpen<number> = { id: 1 };",
      errors: [{ messageId: "widening" }],
    },
    {
      code: "type GenericMapped<T> = { [key in string]: T }; const value: GenericMapped<number> = { id: 1 };",
      errors: [{ messageId: "widening" }],
    },
    {
      code: "type UnknownAlias = unknown; type Chain = UnknownAlias; const value: Chain = { id: 1 };",
      errors: [{ messageId: "widening" }],
    },
    {
      code: "const value: Readonly<{ id: number }> = { id: 1 };",
      errors: [{ messageId: "widening" }],
    },
    {
      code: "const value: unknown = ({ id: 1 } as const)!; const other: unknown = ({ id: 1 } satisfies { id: number });",
      errors: [{ messageId: "widening" }, { messageId: "widening" }],
    },
  ],
});

tsTester.run("no-widen-then-assert", plugin.rules["no-widen-then-assert"], {
  valid: [
    "const source = { id: 'first' }; const widened: unknown = source;",
    "declare const input: unknown; const parsed = input as { readonly id: string };",
    "function parse(source: { id: string }) { const widened: unknown = source; return () => widened as { readonly id: string }; }",
    "const source = { id: 'first' }; const widened: unknown = source; const stillUnknown = widened as unknown;",
    "const source = { id: 'first' }; const widened: { id: string } = source; const parsed = widened as { readonly id: string };",
    "const source = { id: 'first' }; const widened: any = source; const parsed = widened as unknown;",
    "const value = ({ id: 'first' } as { readonly id: string });",
  ],
  invalid: [
    {
      code: "const source = { id: 'second' }; const widened: unknown = source; const parsed = widened as { readonly id: string };",
      errors: [{ messageId: "widenThenAssert" }],
    },
    {
      code: "const source = { id: 'second' }; const widened = source as object; const parsed = widened as { readonly id: string };",
      errors: [{ messageId: "widenThenAssert" }],
    },
    {
      code: "type Open = Record<string, unknown>; const source = { id: 'second' }; const widened: Open = source; const parsed = widened as { readonly id: string };",
      errors: [{ messageId: "widenThenAssert" }],
    },
    {
      code: "function parse() { const source = { id: 'third' }; const widened = (source as unknown); const parsed = widened as { readonly id: string }; return parsed; }",
      errors: [{ messageId: "widenThenAssert" }],
    },
    {
      code: "const source = { id: 'third' }; const widened: object = source; const parsed = widened as { readonly id: string };",
      errors: [{ messageId: "widenThenAssert" }],
    },
    {
      code: "const source = { id: 'third' }; const widened: unknown = source; const parsed = widened as Record<string, string>;",
      errors: [{ messageId: "widenThenAssert" }],
    },
    {
      code: "const source = { id: 'third' }; const widened: Record<string, unknown> = source; const parsed = widened as Readonly<{ id: string }>;",
      errors: [{ messageId: "widenThenAssert" }],
    },
    {
      code: "const source = []; const widened: object = source; const parsed = widened as string[];",
      errors: [{ messageId: "widenThenAssert" }],
    },
    {
      code: "const source = {}; const widened: object = source; const parsed = widened as { id: string } & { name: string };",
      errors: [{ messageId: "widenThenAssert" }],
    },
    {
      code: "const source = { id: 'first' }; const widened: Record<string, unknown> = source; const parsed = widened as Readonly<{ id: string }>;",
      errors: [{ messageId: "widenThenAssert" }],
    },
    {
      code: "const source = { id: 'first' }; const widened: Record<string, unknown> = source; const parsed = widened as Record<string, string>;",
      errors: [{ messageId: "widenThenAssert" }],
    },
  ],
});
