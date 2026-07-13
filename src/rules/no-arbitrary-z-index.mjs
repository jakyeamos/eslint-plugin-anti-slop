import {
  getJSXExpression,
  getPropertyName,
  getPropertyValue,
  getStaticClassPaths,
  isJSXAttributeNamed,
  splitClasses,
  styleObjectProperties,
} from "./_ui-structural.mjs";

const DEFAULT_MAX_Z_INDEX = 998;

function classHasArbitraryZIndex(value, maxZIndex) {
  return splitClasses(value).some((item) => {
    const arbitrary = /^z-\[(\d+)]$/.exec(item);
    if (arbitrary) {
      return Number(arbitrary[1]) > maxZIndex;
    }

    const direct = /^z-(\d{3,})$/.exec(item);
    return direct ? Number(direct[1]) > maxZIndex : false;
  });
}

function styleHasArbitraryZIndex(expression, maxZIndex) {
  return styleObjectProperties(expression).some((property) => {
    const name = getPropertyName(property);
    if (name !== "zIndex") {
      return false;
    }

    const value = Number(getPropertyValue(property));
    return Number.isFinite(value) && value > maxZIndex;
  });
}

export const noArbitraryZIndexRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Discourage arbitrary z-index values outside a semantic stacking scale.",
    },
    schema: [
      {
        type: "object",
        properties: {
          maxZIndex: {
            type: "integer",
            minimum: 0,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      arbitraryZIndex: "Avoid arbitrary high z-index values. Use a semantic stacking token or scale.",
    },
  },
  create(context) {
    const maxZIndex = context.options[0]?.maxZIndex ?? DEFAULT_MAX_Z_INDEX;

    function report(node) {
      context.report({ node, messageId: "arbitraryZIndex" });
    }

    return {
      JSXAttribute(node) {
        if (isJSXAttributeNamed(node, "className")) {
          const paths = getStaticClassPaths(node);
          if (paths.some((path) => classHasArbitraryZIndex(path, maxZIndex))) {
            report(node);
          }
        }

        if (isJSXAttributeNamed(node, "style") && styleHasArbitraryZIndex(getJSXExpression(node), maxZIndex)) {
          report(node);
        }
      },
    };
  },
};
