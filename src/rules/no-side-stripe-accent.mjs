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

function classHasSideStripe(value) {
  return splitClasses(value).some((item) => {
    if (/^border-[lr]-(?:[2-9]|\d{2,})$/.test(item)) {
      return true;
    }

    const arbitrary = /^border-[lr]-\[(.+)]$/.exec(item);
    return arbitrary ? (parseCssLengthPx(arbitrary[1]) ?? 0) > 1 : false;
  });
}

function borderWidthFromShorthand(value) {
  if (typeof value !== "string") {
    return null;
  }

  const match = /(\d+(?:\.\d+)?)(px|rem)?/.exec(value.toLowerCase());
  return match ? parseCssLengthPx(`${match[1]}${match[2] ?? "px"}`) : null;
}

function styleHasSideStripe(expression) {
  return styleObjectProperties(expression).some((property) => {
    const name = getPropertyName(property);
    if (!["borderLeft", "borderRight", "borderLeftWidth", "borderRightWidth"].includes(name)) {
      return false;
    }

    const value = getPropertyValue(property);
    const width = name.endsWith("Width") ? parseCssLengthPx(value) : borderWidthFromShorthand(value);
    return width !== null && width > 1;
  });
}

export const noSideStripeAccentRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Discourage thick left/right border stripe accents on cards and callouts.",
    },
    schema: [],
    messages: {
      sideStripe: "Side-stripe accents are repetitive UI scaffolding. Use full borders, icons, or background contrast instead.",
    },
  },
  create(context) {
    function report(node) {
      context.report({ node, messageId: "sideStripe" });
    }

    return {
      JSXAttribute(node) {
        if (isJSXAttributeNamed(node, "className")) {
          const paths = getStaticClassPaths(node);
          if (paths.some(classHasSideStripe)) {
            report(node);
          }
        }

        if (isJSXAttributeNamed(node, "style") && styleHasSideStripe(getJSXExpression(node))) {
          report(node);
        }
      },
    };
  },
};
