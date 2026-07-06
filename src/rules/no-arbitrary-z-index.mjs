import {
  getJSXExpression,
  getPropertyName,
  getPropertyValue,
  getStaticClassValue,
  isJSXAttributeNamed,
  splitClasses,
  styleObjectProperties,
} from "./_ui-structural.mjs";

const MAX_SCALE_Z_INDEX = 998;

function classHasArbitraryZIndex(value) {
  return splitClasses(value).some((item) => {
    const arbitrary = /^z-\[(\d+)]$/.exec(item);
    if (arbitrary) {
      return Number(arbitrary[1]) > MAX_SCALE_Z_INDEX;
    }

    const direct = /^z-(\d{3,})$/.exec(item);
    return direct ? Number(direct[1]) > MAX_SCALE_Z_INDEX : false;
  });
}

function styleHasArbitraryZIndex(expression) {
  return styleObjectProperties(expression).some((property) => {
    const name = getPropertyName(property);
    if (name !== "zIndex") {
      return false;
    }

    const value = Number(getPropertyValue(property));
    return Number.isFinite(value) && value > MAX_SCALE_Z_INDEX;
  });
}

export const noArbitraryZIndexRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Discourage arbitrary z-index values outside a semantic stacking scale.",
    },
    schema: [],
    messages: {
      arbitraryZIndex: "Avoid arbitrary high z-index values. Use a semantic stacking token or scale.",
    },
  },
  create(context) {
    function report(node) {
      context.report({ node, messageId: "arbitraryZIndex" });
    }

    return {
      JSXAttribute(node) {
        if (isJSXAttributeNamed(node, "className")) {
          const value = getStaticClassValue(node);
          if (value && classHasArbitraryZIndex(value)) {
            report(node);
          }
        }

        if (isJSXAttributeNamed(node, "style") && styleHasArbitraryZIndex(getJSXExpression(node))) {
          report(node);
        }
      },
    };
  },
};
