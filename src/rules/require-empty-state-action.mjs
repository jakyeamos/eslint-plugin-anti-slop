import { extractJSXText, getAntiSlopConfig, hasActionableElement, patternMatches } from "./_shared.mjs";

const EMPTY_STATE_PATTERNS = ["no ", "nothing found", "0 results", "empty", "not found"];

function hasEmptyStateAncestor(node) {
  let current = node.parent;

  while (current) {
    if (current.type === "JSXElement" && patternMatches(extractJSXText(current), EMPTY_STATE_PATTERNS)) {
      return true;
    }

    current = current.parent;
  }

  return false;
}

export const requireEmptyStateActionRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require explicit actions in empty-state UI blocks.",
    },
    schema: [],
    messages: {
      emptyStateAction:
        "Empty state text found without an actionable element or action wording in the same UI block.",
    },
  },
  create(context) {
    const config = getAntiSlopConfig(context);

    return {
      JSXElement(node) {
        if (hasEmptyStateAncestor(node)) {
          return;
        }

        const text = extractJSXText(node);
        if (!text) {
          return;
        }

        const looksEmptyState = patternMatches(text, EMPTY_STATE_PATTERNS);
        if (!looksEmptyState) {
          return;
        }

        const hasActionText = patternMatches(text, config.actionWords);
        const hasControl = hasActionableElement(node);

        if (!hasActionText && !hasControl) {
          context.report({
            node,
            messageId: "emptyStateAction",
          });
        }
      },
    };
  },
};
