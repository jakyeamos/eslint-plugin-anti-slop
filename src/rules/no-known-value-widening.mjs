import {
  classifyWideningTarget,
  createEvidenceTypeEnvironment,
  isEmptyEvidenceObject,
  isKnownEvidenceExpression,
  resolveVariable,
  variableDeclarator,
} from "./_evidence.mjs";

function enclosingFunction(node) {
  let current = node.parent;
  while (current && current.type !== "Program") {
    if (["ArrowFunctionExpression", "FunctionDeclaration", "FunctionExpression"].includes(current.type)) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

function functionName(sourceCode, owner) {
  if (!owner) {
    return "anonymous function";
  }
  if (owner.id?.name) {
    return owner.id.name;
  }
  if (owner.parent?.type === "VariableDeclarator" && owner.parent.id.type === "Identifier") {
    return owner.parent.id.name;
  }
  return "anonymous function";
}

function sourceKeyName(sourceCode, key) {
  if (key.type === "Identifier" || key.type === "PrivateIdentifier") {
    return key.name;
  }
  if (key.type === "Literal") {
    return String(key.value);
  }
  return sourceCode.getText(key);
}

function hasParentAssertion(node) {
  return node.parent?.type === "TSAsExpression" || node.parent?.type === "TSTypeAssertion";
}

function targetFromAnnotation(annotation, environment) {
  return annotation ? classifyWideningTarget(annotation.typeAnnotation, environment) : null;
}

export const noKnownValueWideningRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow known values from flowing into broad or anonymous TypeScript targets that discard useful evidence.",
    },
    schema: [],
    messages: {
      widening:
        "The explicit {{target}} type on {{subject}} discards known type evidence. Keep inference, validate with `satisfies`, or use a named owner contract.",
    },
  },
  create(context) {
    let environment = null;

    function reportFlow(expression, destination, subject) {
      if (!destination || !isKnownEvidenceExpression(context.sourceCode, expression)) {
        return;
      }
      if (
        ["open dictionary", "generic container"].includes(destination.kind) &&
        isEmptyEvidenceObject(expression)
      ) {
        return;
      }

      context.report({
        node: expression,
        messageId: "widening",
        data: { subject, target: destination.kind },
      });
    }

    function targetFor(annotation) {
      return environment ? targetFromAnnotation(annotation, environment) : null;
    }

    return {
      Program(node) {
        environment = createEvidenceTypeEnvironment(node);
      },
      VariableDeclarator(node) {
        if (!environment || node.init === null || node.id.type !== "Identifier") {
          return;
        }
        reportFlow(node.init, targetFor(node.id.typeAnnotation), `binding \`${node.id.name}\``);
      },
      PropertyDefinition(node) {
        if (!environment || node.value === null) {
          return;
        }
        reportFlow(
          node.value,
          targetFor(node.typeAnnotation),
          `property \`${sourceKeyName(context.sourceCode, node.key)}\``,
        );
      },
      AssignmentExpression(node) {
        if (!environment || node.operator !== "=" || node.left.type !== "Identifier") {
          return;
        }
        const variable = resolveVariable(context.sourceCode, node.left);
        const declarator = variableDeclarator(variable);
        if (!declarator || declarator.id.type !== "Identifier") {
          return;
        }
        reportFlow(
          node.right,
          targetFor(declarator.id.typeAnnotation),
          `binding \`${declarator.id.name}\``,
        );
      },
      ReturnStatement(node) {
        if (!environment || node.argument === null) {
          return;
        }
        const owner = enclosingFunction(node);
        reportFlow(
          node.argument,
          targetFor(owner?.returnType),
          `return value of \`${functionName(context.sourceCode, owner)}\``,
        );
      },
      ArrowFunctionExpression(node) {
        if (!environment || node.body.type === "BlockStatement") {
          return;
        }
        reportFlow(
          node.body,
          targetFor(node.returnType),
          `return value of \`${functionName(context.sourceCode, node)}\``,
        );
      },
      TSAsExpression(node) {
        if (!environment || hasParentAssertion(node)) {
          return;
        }
        reportFlow(node.expression, classifyWideningTarget(node.typeAnnotation, environment), "assertion");
      },
      TSTypeAssertion(node) {
        if (!environment || hasParentAssertion(node)) {
          return;
        }
        reportFlow(node.expression, classifyWideningTarget(node.typeAnnotation, environment), "assertion");
      },
    };
  },
};
