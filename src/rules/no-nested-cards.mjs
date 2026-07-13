import { getStaticClassPaths, splitClasses } from "./_ui-structural.mjs";

function openingElementName(opening) {
  if (opening.name.type === "JSXIdentifier") {
    return opening.name.name;
  }

  if (opening.name.type === "JSXMemberExpression") {
    return opening.name.property.name;
  }

  return "";
}

function hasCardClass(opening) {
  const className = opening.attributes.find(
    (attr) => attr.type === "JSXAttribute" && attr.name?.type === "JSXIdentifier" && attr.name.name === "className",
  );
  return getStaticClassPaths(className).some((path) => splitClasses(path).some((item) => /^card(?:$|-|_)/.test(item)));
}

function isCardElement(node) {
  const name = openingElementName(node.openingElement);
  return name === "Card" || name.endsWith("Card") || hasCardClass(node.openingElement);
}

function firstNestedCard(node) {
  const stack = [...node.children];
  while (stack.length > 0) {
    const current = stack.shift();
    if (!current || typeof current !== "object") {
      continue;
    }

    if (current.type === "JSXElement") {
      if (isCardElement(current)) {
        return current;
      }
      stack.push(...current.children);
    }

    if (current.type === "JSXExpressionContainer" && current.expression?.type === "JSXElement") {
      stack.push(current.expression);
    }
  }

  return null;
}

export const noNestedCardsRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Discourage nested Card components or nested card class containers.",
    },
    schema: [],
    messages: {
      nestedCard: "Avoid nesting cards inside cards. Flatten the layout or use an unframed section.",
    },
  },
  create(context) {
    return {
      JSXElement(node) {
        if (!isCardElement(node)) {
          return;
        }

        const nested = firstNestedCard(node);
        if (nested) {
          context.report({ node: nested.openingElement, messageId: "nestedCard" });
        }
      },
    };
  },
};
