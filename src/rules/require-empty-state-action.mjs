import { extractJSXText, getAntiSlopConfig, hasActionableElement, patternMatches } from "./_shared.mjs";

const EMPTY_STATE_PATTERNS = ["no ", "nothing found", "0 results", "empty", "not found"];

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
