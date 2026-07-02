import {
  getJSXExpression,
  getPropertyName,
  getPropertyValue,
  getStaticJSXAttributeValue,
  isJSXAttributeNamed,
  parseCssLengthPx,
  splitClasses,
  styleObjectProperties,
} from "./_ui-structural.mjs";

const MAX_RADIUS_PX = 31;

function classHasExcessiveRadius(value) {
  return splitClasses(value).some((item) => {
    const match = /^rounded(?:-[a-z]+)?-\[(.+)]$/.exec(item);
    return match ? (parseCssLengthPx(match[1]) ?? 0) > MAX_RADIUS_PX : false;
  });
}

function styleHasExcessiveRadius(expression) {
  return styleObjectProperties(expression).some((property) => {
    const name = getPropertyName(property);
    if (!String(name).includes("Radius")) {
      return false;
    }

    return (parseCssLengthPx(getPropertyValue(property)) ?? 0) > MAX_RADIUS_PX;
  });
}

export const noExcessiveRadiusRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Discourage oversized radius values on cards, sections, and inputs.",
    },
    schema: [],
    messages: {
      excessiveRadius: "This radius is unusually large for a framed UI surface. Use the project radius scale instead.",
    },
  },
  create(context) {
    function report(node) {
      context.report({ node, messageId: "excessiveRadius" });
    }

    return {
      JSXAttribute(node) {
        if (isJSXAttributeNamed(node, "className")) {
          const value = getStaticJSXAttributeValue(node);
          if (value && classHasExcessiveRadius(value)) {
            report(node);
          }
        }

        if (isJSXAttributeNamed(node, "style") && styleHasExcessiveRadius(getJSXExpression(node))) {
          report(node);
        }
      },
    };
  },
};
