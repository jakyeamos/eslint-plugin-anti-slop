import { getAntiSlopConfig, getStaticUiPaths, normalizeLower, patternMatches, unwrapStaticExpression } from "./_shared.mjs";

const MESSAGE_ELEMENT_NAMES = new Set(["p", "span", "small", "strong", "em", "b", "i", "label", "h1", "h2", "h3", "h4", "h5", "h6"]);

function staticTruthiness(expression) {
  const subject = unwrapStaticExpression(expression);
  if (subject?.type === "Literal") {
    return Boolean(subject.value);
  }

  if (subject?.type === "TemplateLiteral" && subject.expressions.length === 0) {
    return Boolean(subject.quasis.map((part) => part.value.cooked ?? "").join(""));
  }

  if (subject?.type === "Identifier" && subject.name === "undefined") {
    return false;
  }

  if (subject?.type === "UnaryExpression") {
    if (subject.operator === "void") {
      return false;
    }
    if (subject.operator === "!") {
      const truthiness = staticTruthiness(subject.argument);
      return truthiness === null ? null : !truthiness;
    }
    if (["+", "-"].includes(subject.operator) && subject.argument.type === "Literal" && typeof subject.argument.value === "number") {
      return Boolean(subject.operator === "+" ? +subject.argument.value : -subject.argument.value);
    }
  }

  return null;
}

function staticNullish(expression) {
  const subject = unwrapStaticExpression(expression);
  if (subject?.type === "Literal") {
    return subject.value === null;
  }
  if (subject?.type === "UnaryExpression" && subject.operator === "void") {
    return true;
  }
  return subject?.type === "Identifier" && subject.name === "undefined" ? true : null;
}

function staticTextPaths(expression) {
  const subject = unwrapStaticExpression(expression);
  if (subject?.type === "Literal" && typeof subject.value === "string") {
    return [subject.value];
  }

  if (subject?.type === "TemplateLiteral" && subject.expressions.length === 0) {
    return [subject.quasis.map((part) => part.value.cooked ?? "").join("")];
  }

  if (subject?.type === "ConditionalExpression") {
    return [...staticTextPaths(subject.consequent), ...staticTextPaths(subject.alternate)];
  }

  if (subject?.type === "LogicalExpression") {
    if (subject.operator === "&&") {
      const truthiness = staticTruthiness(subject.left);
      if (truthiness === false) {
        return [];
      }
      return staticTextPaths(subject.right);
    }

    if (subject.operator === "||") {
      const truthiness = staticTruthiness(subject.left);
      if (truthiness === true) {
        return staticTextPaths(subject.left);
      }
      if (truthiness === false) {
        return staticTextPaths(subject.right);
      }
      return [...staticTextPaths(subject.left), ...staticTextPaths(subject.right)];
    }

    if (subject.operator === "??") {
      const nullish = staticNullish(subject.left);
      if (nullish === true) {
        return staticTextPaths(subject.right);
      }
      if (nullish === false) {
        return staticTextPaths(subject.left);
      }
      return [...staticTextPaths(subject.left), ...staticTextPaths(subject.right)];
    }
  }

  return [];
}

function elementName(node) {
  return node.openingElement.name?.type === "JSXIdentifier" ? node.openingElement.name.name.toLowerCase() : "";
}

function inlineStaticText(node) {
  let text = "";

  for (const child of node.children) {
    if (child.type === "JSXText") {
      text += child.value;
      continue;
    }

    if (child.type === "JSXExpressionContainer") {
      const texts = staticTextPaths(child.expression);
      if (texts.length !== 1) {
        return null;
      }
      text += texts[0];
      continue;
    }

    if (child.type === "JSXFragment") {
      const nestedText = inlineStaticText(child);
      if (nestedText === null) {
        return null;
      }
      text += nestedText;
      continue;
    }

    if (child.type === "JSXElement" && MESSAGE_ELEMENT_NAMES.has(elementName(child))) {
      const nestedText = inlineStaticText(child);
      if (nestedText === null) {
        return null;
      }
      text += nestedText;
      continue;
    }

    return null;
  }

  return text;
}

function directMessageTexts(node) {
  const texts = [];
  let literalText = "";

  function flushLiteralText() {
    if (literalText.trim()) {
      texts.push(literalText);
    }
    literalText = "";
  }

  for (const child of node.children) {
    if (child.type === "JSXText") {
      literalText += child.value;
      continue;
    }

    if (child.type === "JSXExpressionContainer") {
      const expressionTexts = staticTextPaths(child.expression);
      if (expressionTexts.length > 0) {
        flushLiteralText();
        texts.push(...expressionTexts);
      }
      continue;
    }

    if (child.type === "JSXFragment") {
      const nestedText = inlineStaticText(child);
      if (nestedText !== null) {
        literalText += nestedText;
      }
      continue;
    }

    if (child.type === "JSXElement" && MESSAGE_ELEMENT_NAMES.has(elementName(node)) && MESSAGE_ELEMENT_NAMES.has(elementName(child))) {
      const nestedText = inlineStaticText(child);
      if (nestedText !== null) {
        literalText += nestedText;
      }
    }
  }

  flushLiteralText();
  return texts.map((text) => normalizeLower(text.replace(/\s+/g, " "))).filter(Boolean);
}

function isHighConfidenceEmptyState(text) {
  if (/^no\s+action\s+required(?:[.!?]|$)/.test(text)) {
    return false;
  }

  return /^(?:no\s+[a-z0-9][a-z0-9-]*|nothing found|0 results|not found|empty)(?:[.!?]|$)/.test(text);
}

function localBoundary(node) {
  let current = node;
  while (current.parent) {
    const parent = current.parent;
    if (parent.type === "JSXElement") {
      if (MESSAGE_ELEMENT_NAMES.has(elementName(parent))) {
        current = parent;
        continue;
      }
      return parent;
    }
    current = parent;
  }
  return node;
}

export const requireEmptyStateActionRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require explicit actions in local empty-state UI blocks.",
    },
    schema: [],
    messages: {
      emptyStateAction:
        "Empty state text found without actionable wording or a usable control in its local UI block.",
    },
  },
  create(context) {
    const config = getAntiSlopConfig(context);
    const reportedBoundaries = new Set();

    return {
      JSXElement(node) {
        const messageTexts = directMessageTexts(node);
        if (!messageTexts.some(isHighConfidenceEmptyState)) {
          return;
        }

        const boundary = localBoundary(node);
        if (reportedBoundaries.has(boundary)) {
          return;
        }
        reportedBoundaries.add(boundary);

        const hasIncompletePath = getStaticUiPaths(boundary, config.actionWords).some((path) => {
          const texts = path.texts.map(normalizeLower);
          const actionTexts = path.actionTexts.map(normalizeLower);
          return (
            texts.some(isHighConfidenceEmptyState) &&
            !path.hasAction &&
            !actionTexts.some((text) => patternMatches(text, config.actionWords))
          );
        });
        if (hasIncompletePath) {
          context.report({
            node,
            messageId: "emptyStateAction",
          });
        }
      },
    };
  },
};
