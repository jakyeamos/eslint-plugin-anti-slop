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
const BROWSER_GLOBALS = new Set(["window", "document", "localStorage", "sessionStorage", "navigator"]);

function isTypeOnlyImport(declaration, specifier) {
  return declaration.importKind === "type" || specifier.importKind === "type";
}

function memberPropertyName(node) {
  if (!node.computed && node.property.type === "Identifier") {
    return node.property.name;
  }

  return node.property.type === "Literal" && typeof node.property.value === "string" ? node.property.value : null;
}

function isStaticPropertyKey(node) {
  const parent = node.parent;
  return (
    (parent?.type === "Property" && parent.key === node && !parent.computed && !parent.shorthand) ||
    (parent?.type === "MemberExpression" && parent.property === node && !parent.computed)
  );
}

function isTypeOnlyReference(node) {
  let current = node;
  let isInsideTypeTree = false;

  while (current.parent) {
    const parent = current.parent;
    if (parent.type === "TSTypeQuery") {
      return true;
    }

    if (!parent.type.startsWith("TS")) {
      return isInsideTypeTree;
    }

    isInsideTypeTree = true;
    if (["TSAsExpression", "TSTypeAssertion", "TSNonNullExpression", "TSInstantiationExpression", "TSSatisfiesExpression"].includes(parent.type)) {
      return parent.expression !== current;
    }
    current = parent;
  }

  return isInsideTypeTree;
}

export const noUnjustifiedUseClientRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Prevent unnecessary `use client` directives.",
    },
    schema: [],
    messages: {
      unjustified: "Review `use client`; this file has no obvious client-only behavior.",
    },
  },
  create(context) {
    const config = getAntiSlopConfig(context);
    let useClientDirective = null;
    let hasClientSignal = false;
    const clientHookLocalNames = new Set();
    const reactNamespaceNames = new Set();

    function markClientSignal() {
      hasClientSignal = true;
    }

    function isImportBinding(node) {
      const parentType = node.parent?.type;
      return (
        parentType === "ImportSpecifier" ||
        parentType === "ImportDefaultSpecifier" ||
        parentType === "ImportNamespaceSpecifier"
      );
    }

    function variableFor(node) {
      let scope = context.sourceCode.getScope(node);
      while (scope) {
        const variable = scope.set.get(node.name);
        if (variable) {
          return variable;
        }
        scope = scope.upper;
      }
      return null;
    }

    function isImportedBinding(node) {
      return Boolean(variableFor(node)?.defs?.some((definition) => definition.type === "ImportBinding"));
    }

    function isGlobalReference(node) {
      const variable = variableFor(node);
      return !variable || variable.defs.length === 0;
    }

    function isRuntimeReference(node) {
      return !isImportBinding(node) && !isStaticPropertyKey(node) && !isTypeOnlyReference(node);
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

        const runtimeSpecifiers = node.specifiers.filter((specifier) => !isTypeOnlyImport(node, specifier));
        if (
          config.clientOnlyImports.some((moduleName) => source === moduleName || source.startsWith(`${moduleName}/`)) &&
          (node.specifiers.length === 0 || runtimeSpecifiers.length > 0)
        ) {
          markClientSignal();
        }

        for (const specifier of runtimeSpecifiers) {
          if (/^use[A-Z]/.test(specifier.local.name)) {
            clientHookLocalNames.add(specifier.local.name);
          }

          if (source === "react") {
            if (specifier.type === "ImportSpecifier") {
              if (CLIENT_HOOKS.has(specifier.imported.name)) {
                clientHookLocalNames.add(specifier.local.name);
              }
            } else if (specifier.type === "ImportNamespaceSpecifier") {
              reactNamespaceNames.add(specifier.local.name);
            } else if (specifier.type === "ImportDefaultSpecifier") {
              reactNamespaceNames.add(specifier.local.name);
            }
          }
        }
      },
      Identifier(node) {
        if (!useClientDirective || !isRuntimeReference(node)) {
          return;
        }

        if (BROWSER_GLOBALS.has(node.name) && isGlobalReference(node)) {
          markClientSignal();
          return;
        }

        if (clientHookLocalNames.has(node.name) && isImportedBinding(node)) {
          markClientSignal();
        }
      },
      MemberExpression(node) {
        if (!useClientDirective || node.object.type !== "Identifier" || !isRuntimeReference(node.object)) {
          return;
        }

        const propertyName = memberPropertyName(node);

        if (
          propertyName &&
          reactNamespaceNames.has(node.object.name) &&
          CLIENT_HOOKS.has(propertyName) &&
          isImportedBinding(node.object)
        ) {
          markClientSignal();
        }

        if (
          propertyName &&
          node.object.name === "globalThis" &&
          BROWSER_GLOBALS.has(propertyName) &&
          isGlobalReference(node.object)
        ) {
          markClientSignal();
        }
      },
      JSXAttribute(node) {
        if (!useClientDirective) {
          return;
        }

        if (node.name?.type === "JSXIdentifier" && /^on[A-Z]/.test(node.name.name)) {
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
        });
      },
    };
  },
};
