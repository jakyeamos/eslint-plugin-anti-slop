import {
  classifyBroadType,
  createEvidenceTypeEnvironment,
  isDefinitelyNarrowerRecordType,
  isDefinitelyObjectType,
  isKnownEvidenceExpression,
  resolveVariable,
  unwrapEvidenceExpression,
  variableDeclarator,
} from "./_evidence.mjs";

const FUNCTION_BOUNDARY_TYPES = new Set(["ArrowFunctionExpression", "FunctionDeclaration", "FunctionExpression"]);

function functionBoundary(node) {
  let current = node.parent;
  while (current && current.type !== "Program") {
    if (FUNCTION_BOUNDARY_TYPES.has(current.type)) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

function assertedExpression(node) {
  return unwrapEvidenceExpression(node.expression);
}

function assertionFromExpression(expression) {
  let current = expression;
  while (current.type === "ParenthesizedExpression") {
    current = current.expression;
  }
  return current.type === "TSAsExpression" || current.type === "TSTypeAssertion" ? current : null;
}

function broadTypeKind(type, environment) {
  return type ? classifyBroadType(type, environment) : null;
}

function isNarrowerType(broadKind, assertedType) {
  if (broadKind === "top") {
    return !["TSAnyKeyword", "TSUnknownKeyword", "TSObjectKeyword"].includes(assertedType.type);
  }
  if (broadKind === "object") {
    return isDefinitelyObjectType(assertedType);
  }
  return isDefinitelyNarrowerRecordType(assertedType);
}

function widenedBinding(sourceCode, variable, environment) {
  const declarator = variableDeclarator(variable);
  if (
    !declarator ||
    declarator.parent.type !== "VariableDeclaration" ||
    declarator.parent.kind !== "const" ||
    declarator.id.type !== "Identifier" ||
    declarator.init === null ||
    variable.references.some((reference) => reference.isWrite() && !reference.init)
  ) {
    return null;
  }

  const declarationKind = broadTypeKind(declarator.id.typeAnnotation?.typeAnnotation, environment);
  const initializerAssertion = assertionFromExpression(declarator.init);
  const assertionKind = initializerAssertion
    ? broadTypeKind(initializerAssertion.typeAnnotation, environment)
    : null;
  const broadKind = declarationKind ?? assertionKind;
  if (!broadKind) {
    return null;
  }

  const originalExpression =
    initializerAssertion && assertionKind ? assertedExpression(initializerAssertion) : declarator.init;
  if (!isKnownEvidenceExpression(sourceCode, originalExpression)) {
    return null;
  }

  return {
    broadKind,
    declaredAt: declarator.range[1],
    boundary: functionBoundary(declarator),
  };
}

export const noWidenThenAssertRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow immutable local flows that widen known values before asserting them back to a narrower type.",
    },
    schema: [],
    messages: {
      widenThenAssert:
        'Binding "{{name}}" discards type evidence and later recreates it with an assertion. Keep the precise type from initialization through use; parse boundary input once.',
    },
  },
  create(context) {
    let environment = null;

    function checkAssertion(node) {
      if (!environment) {
        return;
      }
      const expression = assertedExpression(node);
      if (expression.type !== "Identifier") {
        return;
      }

      const variable = resolveVariable(context.sourceCode, expression);
      const widened = widenedBinding(context.sourceCode, variable, environment);
      if (
        !widened ||
        node.range[0] <= widened.declaredAt ||
        functionBoundary(node) !== widened.boundary ||
        !isNarrowerType(widened.broadKind, node.typeAnnotation)
      ) {
        return;
      }

      context.report({
        node,
        messageId: "widenThenAssert",
        data: { name: expression.name },
      });
    }

    return {
      Program(node) {
        environment = createEvidenceTypeEnvironment(node);
      },
      TSAsExpression: checkAssertion,
      TSTypeAssertion: checkAssertion,
    };
  },
};
