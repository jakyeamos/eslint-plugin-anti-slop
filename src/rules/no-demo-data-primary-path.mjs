import { getAntiSlopConfig } from "./_shared.mjs";

function isPrimaryRouteFile(filename) {
  return (
    /(?:^|\/)(?:src\/)?app\/(?:.*\/)?(?:page|layout|route)\.(?:t|j)sx?$/.test(filename) ||
    /(?:^|\/)(?:src\/)?pages\/.*\.(?:t|j)sx?$/.test(filename)
  );
}

function unwrapExpression(node) {
  let current = node;
  while (
    ["AwaitExpression", "ChainExpression", "TSAsExpression", "TSTypeAssertion", "TSNonNullExpression", "TSInstantiationExpression", "TSSatisfiesExpression"].includes(
      current?.type,
    )
  ) {
    current = current.type === "AwaitExpression" ? current.argument : current.expression;
  }
  return current;
}

function calleeRootName(callee) {
  let current = callee;
  while (current) {
    if (current.type === "ChainExpression") {
      current = current.expression;
    } else if (current.type === "MemberExpression") {
      current = current.object;
    } else if (current.type === "CallExpression") {
      current = current.callee;
    } else {
      break;
    }
  }

  return current?.type === "Identifier" ? current.name : null;
}

function isImportBinding(node) {
  return ["ImportSpecifier", "ImportDefaultSpecifier", "ImportNamespaceSpecifier"].includes(node.parent?.type);
}

function isTypeOnlyImport(declaration, specifier) {
  return declaration.importKind === "type" || specifier.importKind === "type";
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

function lexicalOwner(node) {
  let current = node;
  while (current) {
    if (["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression", "Program"].includes(current.type)) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

export const noDemoDataPrimaryPathRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Prevent top-level routes from relying on demo data as primary data source.",
    },
    schema: [],
    messages: {
      demoDataPrimary:
        "This route uses demo data outside a nullish fallback to a same-scope real-data result. Demo data should not be the primary source.",
    },
  },
  create(context) {
    const filename = context.filename;
    if (!isPrimaryRouteFile(filename)) {
      return {};
    }

    const config = getAntiSlopConfig(context);
    const demoBindingNames = new Set();
    const sideEffectDemoImports = [];
    const demoReferences = [];
    const realDataVariables = new Map();

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

    function isRealDataCall(node) {
      const expression = unwrapExpression(node);
      if (expression?.type !== "CallExpression") {
        return false;
      }

      const rootName = calleeRootName(expression.callee);
      return Boolean(rootName && config.realDataIndicators.includes(rootName));
    }

    function isRealDataExpression(node) {
      const expression = unwrapExpression(node);
      if (isRealDataCall(expression)) {
        return true;
      }

      return (
        expression?.type === "Identifier" &&
        realDataVariables.get(variableFor(expression)) === lexicalOwner(expression)
      );
    }

    function isDemoBindingReference(node) {
      if (!demoBindingNames.has(node.name) || isImportBinding(node) || isStaticPropertyKey(node) || isTypeOnlyReference(node)) {
        return false;
      }

      const variable = variableFor(node);
      return Boolean(variable?.defs?.some((definition) => definition.type === "ImportBinding"));
    }

    function isPermittedFallback(node) {
      let expression = node;
      while (
        ["TSAsExpression", "TSTypeAssertion", "TSNonNullExpression", "TSInstantiationExpression", "TSSatisfiesExpression"].includes(
          expression.parent?.type,
        ) &&
        expression.parent.expression === expression
      ) {
        expression = expression.parent;
      }

      const parent = expression.parent;
      return (
        parent?.type === "LogicalExpression" &&
        parent.operator === "??" &&
        parent.right === expression &&
        isRealDataExpression(parent.left)
      );
    }

    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        if (typeof source !== "string") {
          return;
        }

        const isDemo = config.demoDataModules.some((moduleName) => source === moduleName || source.startsWith(`${moduleName}/`));
        if (!isDemo) {
          return;
        }

        if (node.specifiers.length === 0) {
          sideEffectDemoImports.push(node);
          return;
        }

        for (const specifier of node.specifiers) {
          if (!isTypeOnlyImport(node, specifier)) {
            demoBindingNames.add(specifier.local.name);
          }
        }
      },
      VariableDeclarator(node) {
        if (
          node.parent?.type === "VariableDeclaration" &&
          node.parent.kind === "const" &&
          node.id.type === "Identifier" &&
          isRealDataCall(node.init)
        ) {
          const variable = variableFor(node.id);
          if (variable) {
            realDataVariables.set(variable, lexicalOwner(node));
          }
        }
      },
      Identifier(node) {
        if (isDemoBindingReference(node)) {
          demoReferences.push(node);
        }
      },
      "Program:exit"() {
        if (sideEffectDemoImports.length > 0) {
          context.report({ node: sideEffectDemoImports[0], messageId: "demoDataPrimary" });
          return;
        }

        const invalidReference = demoReferences.find((node) => !isPermittedFallback(node));
        if (invalidReference) {
          context.report({ node: invalidReference, messageId: "demoDataPrimary" });
        }
      },
    };
  },
};
