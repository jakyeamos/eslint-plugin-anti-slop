import {
  getJSXExpression,
  getPropertyName,
  getPropertyValue,
  getStaticClassPaths,
  isJSXAttributeNamed,
  parseCssLengthPx,
  splitClasses,
  styleObjectProperties,
} from "./_ui-structural.mjs";

const DEFAULT_MAX_RADIUS_PX = 31;

function classHasExcessiveRadius(value, maxRadiusPx) {
  return splitClasses(value).some((item) => {
    const match = /^rounded(?:-[a-z]+)?-\[(.+)]$/.exec(item);
    return match ? (parseCssLengthPx(match[1]) ?? 0) > maxRadiusPx : false;
  });
}

function styleHasExcessiveRadius(expression, maxRadiusPx) {
  return styleObjectProperties(expression).some((property) => {
    const name = getPropertyName(property);
    if (!String(name).includes("Radius")) {
      return false;
    }

    return (parseCssLengthPx(getPropertyValue(property)) ?? 0) > maxRadiusPx;
  });
}

export const noExcessiveRadiusRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Discourage oversized radius values on cards, sections, and inputs.",
    },
    schema: [
      {
        type: "object",
        properties: {
          maxRadiusPx: {
            type: "number",
            minimum: 0,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      excessiveRadius: "This radius is unusually large for a framed UI surface. Use the project radius scale instead.",
    },
  },
  create(context) {
    const maxRadiusPx = context.options[0]?.maxRadiusPx ?? DEFAULT_MAX_RADIUS_PX;

    function report(node) {
      context.report({ node, messageId: "excessiveRadius" });
    }

    return {
      JSXAttribute(node) {
        if (isJSXAttributeNamed(node, "className")) {
          const paths = getStaticClassPaths(node);
          if (paths.some((path) => classHasExcessiveRadius(path, maxRadiusPx))) {
            report(node);
          }
        }

        if (isJSXAttributeNamed(node, "style") && styleHasExcessiveRadius(getJSXExpression(node), maxRadiusPx)) {
          report(node);
        }
      },
    };
  },
};
