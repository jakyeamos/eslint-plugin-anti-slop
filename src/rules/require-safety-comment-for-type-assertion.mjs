const COMMENT_OWNER_TYPES = new Set([
  "ExpressionStatement",
  "PropertyDefinition",
  "ReturnStatement",
  "ThrowStatement",
  "VariableDeclaration",
]);

function isConstAssertion(node) {
  return (
    node.typeAnnotation.type === "TSTypeReference" &&
    node.typeAnnotation.typeName.type === "Identifier" &&
    node.typeAnnotation.typeName.name === "const"
  );
}

function hasSafetyComment(sourceCode, node) {
  let current = node;
  while (current) {
    if (
      sourceCode
        .getCommentsBefore(current)
        .some((comment) => comment.range[1] <= node.range[0] && /\bSAFETY\s*:/u.test(comment.value))
    ) {
      return true;
    }

    if (COMMENT_OWNER_TYPES.has(current.type) || current.parent?.type === "Program") {
      return false;
    }
    current = current.parent;
  }
  return false;
}

export const requireSafetyCommentForTypeAssertionRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Require a nearby SAFETY comment for every TypeScript type assertion except const assertions.",
    },
    schema: [],
    messages: {
      missingSafetyComment:
        "This type assertion has no `SAFETY:` justification. State the checked invariant immediately before the assertion or its containing statement.",
    },
  },
  create(context) {
    function checkAssertion(node) {
      if (isConstAssertion(node) || hasSafetyComment(context.sourceCode, node)) {
        return;
      }

      context.report({
        node,
        messageId: "missingSafetyComment",
      });
    }

    return {
      TSAsExpression: checkAssertion,
      TSTypeAssertion: checkAssertion,
    };
  },
};
