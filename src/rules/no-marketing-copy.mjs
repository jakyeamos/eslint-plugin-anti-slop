import { getAntiSlopConfig, getLiteralString, isLikelyUserFacingString, patternMatches } from "./_shared.mjs";

export const noMarketingCopyRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Discourage generic marketing copy in product UI strings.",
    },
    schema: [],
    messages: {
      marketing: "Generic marketing copy detected in user-facing text: `{{value}}`.",
    },
  },
  create(context) {
    const config = getAntiSlopConfig(context);

    function check(node, rawValue) {
      if (!rawValue || !isLikelyUserFacingString(node)) {
        return;
      }

      if (patternMatches(rawValue, config.marketingPatterns)) {
        context.report({
          node,
          messageId: "marketing",
          data: { value: rawValue.slice(0, 60) },
        });
      }
    }

    return {
      JSXText(node) {
        check(node, node.value);
      },
      Literal(node) {
        if (typeof node.value === "string") {
          check(node, node.value);
        }
      },
      TemplateLiteral(node) {
        const value = getLiteralString(node);
        if (value) {
          check(node, value);
        }
      },
    };
  },
};
