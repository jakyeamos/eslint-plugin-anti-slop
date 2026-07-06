function getReturnedExpression(callbackNode) {
  if (!callbackNode || (callbackNode.type !== "ArrowFunctionExpression" && callbackNode.type !== "FunctionExpression")) {
    return null;
  }

  if (callbackNode.body.type !== "BlockStatement") {
    return callbackNode.body;
  }

  const [first] = callbackNode.body.body;
  if (callbackNode.body.body.length === 1 && first.type === "ReturnStatement") {
    return first.argument ?? null;
  }

  return null;
}

function isTrivialExpression(node) {
  if (!node) {
    return false;
  }

  return [
    "Literal",
    "TemplateLiteral",
    "Identifier",
    "MemberExpression",
    "BinaryExpression",
  ].includes(node.type);
}

export const noUselessMemoRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Discourage trivial useMemo/useCallback usage.",
    },
    schema: [],
    messages: {
      uselessMemo: "This `useMemo` appears trivial and likely unnecessary.",
      uselessCallback: "This `useCallback` appears unnecessary without memo-sensitive usage.",
    },
  },
  create(context) {
    function resolveVariable(node, name) {
      for (let scope = context.sourceCode.getScope(node); scope; scope = scope.upper) {
        const variable = scope.variables.find((item) => item.name === name);
        if (variable) {
          return variable;
        }
      }
      return null;
    }

    function reactImportedName(variable) {
      const def = variable?.defs[0];
      if (!def || def.type !== "ImportBinding" || def.parent.source.value !== "react") {
        return null;
      }

      if (def.node.type === "ImportSpecifier") {
        return def.node.imported.name;
      }

      return "*";
    }

    function resolveHookName(node) {
      if (node.callee.type === "Identifier") {
        const variable = resolveVariable(node, node.callee.name);
        if (!variable) {
          return ["useMemo", "useCallback"].includes(node.callee.name) ? node.callee.name : null;
        }

        const imported = reactImportedName(variable);
        return imported && imported !== "*" ? imported : null;
      }

      if (node.callee.type === "MemberExpression" && node.callee.object.type === "Identifier") {
        const property = node.callee.property;
        const propertyName =
          property.type === "Identifier" && !node.callee.computed
            ? property.name
            : property.type === "Literal" && typeof property.value === "string"
              ? property.value
              : null;
        if (!["useMemo", "useCallback"].includes(propertyName)) {
          return null;
        }

        const variable = resolveVariable(node, node.callee.object.name);
        if (!variable) {
          return node.callee.object.name === "React" ? propertyName : null;
        }

        return reactImportedName(variable) === "*" ? propertyName : null;
      }

      return null;
    }

    return {
      CallExpression(node) {
        const hookName = resolveHookName(node);

        if (hookName === "useMemo") {
          const expr = getReturnedExpression(node.arguments[0]);
          if (expr && isTrivialExpression(expr)) {
            context.report({ node, messageId: "uselessMemo" });
          }
        }

        if (hookName === "useCallback") {
          const callback = node.arguments[0];
          if (!callback || (callback.type !== "ArrowFunctionExpression" && callback.type !== "FunctionExpression")) {
            return;
          }

          const body = callback.body;
          if (body.type !== "BlockStatement") {
            context.report({ node, messageId: "uselessCallback" });
            return;
          }

          const hasSideEffect = body.body.some((statement) => statement.type !== "ReturnStatement");
          if (!hasSideEffect) {
            context.report({ node, messageId: "uselessCallback" });
          }
        }
      },
    };
  },
};
