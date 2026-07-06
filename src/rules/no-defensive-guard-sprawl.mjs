const DEFAULT_MAX_GUARDS = 2;
const VALIDATOR_NAME_RE = /^(?:is|has|can|should|assert|ensure|validate)[A-Z_]/;

function functionName(node) {
  if (node.id?.name) {
    return node.id.name;
  }

  const parent = node.parent;
  if (parent?.type === "VariableDeclarator" && parent.id.type === "Identifier") {
    return parent.id.name;
  }

  if (parent?.type === "Property" && parent.key.type === "Identifier") {
    return parent.key.name;
  }

  return null;
}

function isValidatorFunction(node) {
  const name = functionName(node);
  return Boolean(name && VALIDATOR_NAME_RE.test(name));
}

function isNullishLiteral(node) {
  return node.type === "Literal" && node.value === null;
}

function isUndefinedIdentifier(node) {
  return node.type === "Identifier" && node.name === "undefined";
}

function isUndefinedString(node) {
  return node.type === "Literal" && node.value === "undefined";
}

function isIsRecordCall(node) {
  if (node.type !== "CallExpression") {
    return false;
  }

  if (node.callee.type === "Identifier") {
    return node.callee.name === "isRecord";
  }

  return node.callee.type === "MemberExpression"
    && !node.callee.computed
    && node.callee.property.type === "Identifier"
    && node.callee.property.name === "isRecord";
}

function hasNullishOrRecordCheck(node) {
  if (!node || typeof node !== "object") {
    return false;
  }

  if (isIsRecordCall(node)) {
    return true;
  }

  if (node.type === "UnaryExpression") {
    return hasNullishOrRecordCheck(node.argument);
  }

  if (node.type === "ChainExpression") {
    return hasNullishOrRecordCheck(node.expression);
  }

  if (node.type === "LogicalExpression") {
    return hasNullishOrRecordCheck(node.left) || hasNullishOrRecordCheck(node.right);
  }

  if (node.type !== "BinaryExpression") {
    return false;
  }

  if (!["==", "!=", "===", "!=="].includes(node.operator)) {
    return false;
  }

  const leftNullish = isNullishLiteral(node.left) || isUndefinedIdentifier(node.left);
  const rightNullish = isNullishLiteral(node.right) || isUndefinedIdentifier(node.right);
  if (leftNullish || rightNullish) {
    return true;
  }

  const leftTypeof = node.left.type === "UnaryExpression" && node.left.operator === "typeof";
  const rightTypeof = node.right.type === "UnaryExpression" && node.right.operator === "typeof";
  return (leftTypeof && isUndefinedString(node.right)) || (rightTypeof && isUndefinedString(node.left));
}

function isAbruptGuard(statement) {
  if (statement.type !== "IfStatement" || statement.alternate) {
    return false;
  }

  const consequent = statement.consequent;
  const body = consequent.type === "BlockStatement" ? consequent.body : [consequent];
  return body.length > 0 && body.every((item) => item.type === "ReturnStatement" || item.type === "ThrowStatement");
}

function countLeadingDefensiveGuards(body) {
  let count = 0;

  for (const statement of body) {
    if (!isAbruptGuard(statement) || !hasNullishOrRecordCheck(statement.test)) {
      break;
    }

    count += 1;
  }

  return count;
}

export const noDefensiveGuardSprawlRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Discourage repeated defensive null and record guards in ordinary functions.",
    },
    schema: [
      {
        type: "object",
        properties: {
          maxGuards: {
            type: "integer",
            minimum: 0,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      guardSprawl:
        "This function stacks {{count}} defensive null/record guards. Centralize shape validation in a small helper instead.",
    },
  },
  create(context) {
    const maxGuards = context.options[0]?.maxGuards ?? DEFAULT_MAX_GUARDS;

    function checkFunction(node) {
      if (isValidatorFunction(node) || node.body.type !== "BlockStatement") {
        return;
      }

      const guardCount = countLeadingDefensiveGuards(node.body.body);
      if (guardCount <= maxGuards) {
        return;
      }

      context.report({
        node,
        messageId: "guardSprawl",
        data: { count: String(guardCount) },
      });
    }

    return {
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      ArrowFunctionExpression: checkFunction,
    };
  },
};
