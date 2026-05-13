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
    "ArrayExpression",
    "ObjectExpression",
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
    return {
      CallExpression(node) {
        if (node.callee.type !== "Identifier") {
          return;
        }

        if (node.callee.name === "useMemo") {
          const expr = getReturnedExpression(node.arguments[0]);
          if (expr && isTrivialExpression(expr)) {
            context.report({ node, messageId: "uselessMemo" });
          }
        }

        if (node.callee.name === "useCallback") {
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
