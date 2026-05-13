import { getAntiSlopConfig, getLiteralString, normalizeLower } from "./_shared.mjs";

const TARGET_ATTRS = new Set(["label", "title", "heading"]);

function isBlockedLabel(value, blocked) {
  return blocked.includes(normalizeLower(value));
}

export const noGenericStatLabelRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Discourage generic metrics/section labels.",
    },
    schema: [],
    messages: {
      genericLabel: "Generic label `{{value}}` detected. Prefer domain-specific wording.",
    },
  },
  create(context) {
    const config = getAntiSlopConfig(context);
    const blocked = config.genericStatLabels.map((item) => normalizeLower(item));

    function reportIfBlocked(node, value) {
      if (!value) {
        return;
      }

      if (isBlockedLabel(value, blocked)) {
        context.report({
          node,
          messageId: "genericLabel",
          data: { value },
        });
      }
    }

    return {
      JSXAttribute(node) {
        if (!node.name || node.name.type !== "JSXIdentifier" || !TARGET_ATTRS.has(node.name.name)) {
          return;
        }

        if (!node.value) {
          return;
        }

        if (node.value.type === "Literal" && typeof node.value.value === "string") {
          reportIfBlocked(node.value, node.value.value);
          return;
        }

        if (node.value.type === "JSXExpressionContainer") {
          const value = getLiteralString(node.value.expression);
          if (value) {
            reportIfBlocked(node.value.expression, value);
          }
        }
      },
      JSXElement(node) {
        const opening = node.openingElement;
        if (!opening?.name || opening.name.type !== "JSXIdentifier") {
          return;
        }

        const tag = opening.name.name.toLowerCase();
        if (!["h1", "h2", "h3", "h4", "h5", "h6"].includes(tag)) {
          return;
        }

        if (node.children.length !== 1 || node.children[0].type !== "JSXText") {
          return;
        }

        reportIfBlocked(node.children[0], node.children[0].value);
      },
    };
  },
};
