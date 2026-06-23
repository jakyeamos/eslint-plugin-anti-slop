import { getAntiSlopConfig } from "./_shared.mjs";

const CLIENT_HOOKS = new Set([
  "useState",
  "useEffect",
  "useLayoutEffect",
  "useReducer",
  "useRef",
  "useTransition",
  "useDeferredValue",
  "useImperativeHandle",
  "useSyncExternalStore",
  "useInsertionEffect",
  "useOptimistic",
  "useActionState",
]);

export const noUnjustifiedUseClientRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Prevent unnecessary `use client` directives.",
    },
    fixable: "code",
    schema: [],
    messages: {
      unjustified: "Remove `use client`; this file has no obvious client-only behavior.",
    },
  },
  create(context) {
    const config = getAntiSlopConfig(context);
    let useClientDirective = null;
    let hasClientSignal = false;
    const importedHookNames = new Set();
    const reactNamespaceNames = new Set();

    function markClientSignal() {
      hasClientSignal = true;
    }

    return {
      Program(node) {
        const first = node.body[0];
        if (
          first &&
          first.type === "ExpressionStatement" &&
          first.expression.type === "Literal" &&
          first.expression.value === "use client"
        ) {
          useClientDirective = first;
        }
      },
      ImportDeclaration(node) {
        const source = node.source.value;
        if (typeof source !== "string") {
          return;
        }

        if (config.clientOnlyImports.some((moduleName) => source === moduleName || source.startsWith(`${moduleName}/`))) {
          markClientSignal();
        }

        if (source === "react") {
          for (const specifier of node.specifiers) {
            if (specifier.type === "ImportSpecifier") {
              importedHookNames.add(specifier.imported.name);
            } else if (specifier.type === "ImportNamespaceSpecifier") {
              reactNamespaceNames.add(specifier.local.name);
            } else if (specifier.type === "ImportDefaultSpecifier") {
              reactNamespaceNames.add(specifier.local.name);
            }
          }
        }
      },
      Identifier(node) {
        if (!useClientDirective) {
          return;
        }

        if (["window", "document", "localStorage", "sessionStorage", "navigator"].includes(node.name)) {
          markClientSignal();
          return;
        }

        if (importedHookNames.has(node.name) && CLIENT_HOOKS.has(node.name)) {
          markClientSignal();
        }
      },
      MemberExpression(node) {
        if (!useClientDirective || node.object.type !== "Identifier") {
          return;
        }

        const propertyName =
          node.property.type === "Identifier"
            ? node.property.name
            : node.property.type === "Literal" && typeof node.property.value === "string"
              ? node.property.value
              : null;

        if (propertyName && reactNamespaceNames.has(node.object.name) && CLIENT_HOOKS.has(propertyName)) {
          markClientSignal();
        }
      },
      JSXAttribute(node) {
        if (!useClientDirective) {
          return;
        }

        if (node.name?.type === "JSXIdentifier" && node.name.name.startsWith("on")) {
          markClientSignal();
        }
      },
      "Program:exit"() {
        if (!useClientDirective || hasClientSignal) {
          return;
        }

        context.report({
          node: useClientDirective,
          messageId: "unjustified",
          fix(fixer) {
            const source = context.sourceCode;
            const start = useClientDirective.range[0];
            let end = useClientDirective.range[1];
            const nextToken = source.getTokenAfter(useClientDirective, { includeComments: true });
            if (nextToken) {
              const between = source.text.slice(end, nextToken.range[0]);
              const newlineMatch = between.match(/^\s*\n/);
              if (newlineMatch) {
                end += newlineMatch[0].length;
              }
            }

            return fixer.removeRange([start, end]);
          },
        });
      },
    };
  },
};
