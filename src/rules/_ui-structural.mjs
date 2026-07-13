const CLASS_BUILDER_NAMES = new Set(["clsx", "classnames", "classNames", "cn", "cx", "cva", "twMerge", "twJoin"]);
const MAX_STATIC_CLASS_PATHS = 64;
const TRANSPARENT_EXPRESSION_TYPES = new Set([
  "ChainExpression",
  "TSAsExpression",
  "TSNonNullExpression",
  "TSSatisfiesExpression",
  "TypeCastExpression",
]);

function unwrapStaticExpression(expression) {
  let current = expression;
  while (TRANSPARENT_EXPRESSION_TYPES.has(current?.type)) {
    current = current.expression;
  }
  return current;
}

function classBuilderName(callee) {
  if (callee.type === "Identifier") {
    return callee.name;
  }

  if (callee.type === "MemberExpression" && !callee.computed && callee.property.type === "Identifier") {
    return callee.property.name;
  }

  return null;
}

function normalizeClassPath(value) {
  return String(value).trim().replace(/\s+/g, " ");
}

function uniquePaths(paths) {
  return [...new Set(paths.map(normalizeClassPath))].slice(0, MAX_STATIC_CLASS_PATHS);
}

function combinePaths(groups) {
  let paths = [""];

  for (const group of groups) {
    const nextPaths = [];
    for (const left of paths) {
      for (const right of group) {
        nextPaths.push([left, right].filter(Boolean).join(" "));
        if (nextPaths.length >= MAX_STATIC_CLASS_PATHS) {
          break;
        }
      }
      if (nextPaths.length >= MAX_STATIC_CLASS_PATHS) {
        break;
      }
    }
    paths = uniquePaths(nextPaths);
  }

  return paths;
}

function staticTruthiness(node) {
  const subject = unwrapStaticExpression(node);
  if (subject?.type === "Literal") {
    return Boolean(subject.value);
  }

  if (subject?.type === "TemplateLiteral" && subject.expressions.length === 0) {
    return Boolean(subject.quasis.map((part) => part.value.cooked ?? "").join(""));
  }

  if (subject?.type === "Identifier" && subject.name === "undefined") {
    return false;
  }

  if (subject?.type === "UnaryExpression") {
    if (subject.operator === "void") {
      return false;
    }
    if (subject.operator === "!") {
      const truthiness = staticTruthiness(subject.argument);
      return truthiness === null ? null : !truthiness;
    }
    if (["+", "-"].includes(subject.operator) && subject.argument.type === "Literal" && typeof subject.argument.value === "number") {
      return Boolean(subject.operator === "+" ? +subject.argument.value : -subject.argument.value);
    }
  }

  if (subject?.type === "LogicalExpression") {
    const leftTruthiness = staticTruthiness(subject.left);
    const rightTruthiness = staticTruthiness(subject.right);
    if (subject.operator === "&&") {
      if (leftTruthiness === false || rightTruthiness === false) {
        return false;
      }
      return leftTruthiness === true ? rightTruthiness : null;
    }
    if (subject.operator === "||") {
      if (leftTruthiness === true || rightTruthiness === true) {
        return true;
      }
      return leftTruthiness === false ? rightTruthiness : null;
    }
  }

  return null;
}

function staticNullish(node) {
  const subject = unwrapStaticExpression(node);
  if (subject?.type === "Literal") {
    return subject.value === null;
  }

  if (subject?.type === "UnaryExpression" && subject.operator === "void") {
    return true;
  }

  return subject?.type === "Identifier" && subject.name === "undefined" ? true : null;
}

function templatePath(node) {
  if (node.expressions.length === 0) {
    return node.quasis.map((part) => part.value.cooked ?? "").join("");
  }

  const fragments = [];
  for (const [index, quasi] of node.quasis.entries()) {
    let text = quasi.value.cooked ?? "";
    if (index > 0) {
      text = text.replace(/^\S+/, "");
    }
    if (index < node.expressions.length) {
      text = text.replace(/\S+$/, " ");
    }
    if (text.trim()) {
      fragments.push(text);
    }
  }

  return fragments.join(" ");
}

function objectKey(property) {
  if (property.computed) {
    return null;
  }

  if (property.key.type === "Literal" && typeof property.key.value === "string") {
    return property.key.value;
  }

  return property.key.type === "Identifier" ? property.key.name : null;
}

function classPaths(expression) {
  expression = unwrapStaticExpression(expression);
  if (!expression || typeof expression !== "object") {
    return [""];
  }

  if (expression.type === "Literal") {
    return typeof expression.value === "string" ? [expression.value] : [""];
  }

  if (expression.type === "TemplateLiteral") {
    return [templatePath(expression)];
  }

  if (expression.type === "ArrayExpression") {
    return combinePaths(expression.elements.map((element) => classPaths(element)));
  }

  if (expression.type === "ObjectExpression") {
    let paths = [""];
    for (const property of expression.properties) {
      if (property.type !== "Property") {
        continue;
      }

      const key = objectKey(property);
      if (!key) {
        continue;
      }

      const truthiness = staticTruthiness(property.value);
      if (truthiness === false) {
        continue;
      }

      const presentPaths = combinePaths([paths, [key]]);
      paths = truthiness === true ? presentPaths : uniquePaths([...presentPaths, ...paths]);
    }
    return paths;
  }

  if (expression.type === "ConditionalExpression") {
    const truthiness = staticTruthiness(expression.test);
    if (truthiness === true) {
      return classPaths(expression.consequent);
    }
    if (truthiness === false) {
      return classPaths(expression.alternate);
    }
    return uniquePaths([...classPaths(expression.consequent), ...classPaths(expression.alternate)]);
  }

  if (expression.type === "LogicalExpression") {
    if (expression.operator === "&&") {
      const truthiness = staticTruthiness(expression.left);
      if (truthiness === false) {
        return [""];
      }
      if (truthiness === true) {
        return classPaths(expression.right);
      }
      return uniquePaths(["", ...classPaths(expression.right)]);
    }

    if (expression.operator === "||") {
      const truthiness = staticTruthiness(expression.left);
      if (truthiness === true) {
        return classPaths(expression.left);
      }
      if (truthiness === false) {
        return classPaths(expression.right);
      }
      return uniquePaths([...classPaths(expression.left), ...classPaths(expression.right)]);
    }

    if (expression.operator === "??") {
      const nullish = staticNullish(expression.left);
      if (nullish === true) {
        return classPaths(expression.right);
      }
      if (nullish === false) {
        return classPaths(expression.left);
      }
      return uniquePaths([...classPaths(expression.left), ...classPaths(expression.right)]);
    }
  }

  if (expression.type === "CallExpression") {
    const name = classBuilderName(expression.callee);
    if (name && CLASS_BUILDER_NAMES.has(name)) {
      return combinePaths(expression.arguments.map((argument) => classPaths(argument)));
    }
  }

  return [""];
}

export function getStaticClassPaths(node) {
  if (!node?.value) {
    return [];
  }

  if (node.value.type === "Literal" && typeof node.value.value === "string") {
    return [node.value.value];
  }

  if (node.value.type === "JSXExpressionContainer") {
    return classPaths(node.value.expression).map(normalizeClassPath).filter(Boolean);
  }

  return [];
}

export function getJSXExpression(node) {
  if (!node?.value || node.value.type !== "JSXExpressionContainer") {
    return null;
  }

  return node.value.expression;
}

export function isJSXAttributeNamed(node, name) {
  return node.name?.type === "JSXIdentifier" && node.name.name === name;
}

export function splitClasses(value) {
  return String(value).split(/\s+/).filter(Boolean);
}

export function getPropertyName(property) {
  if (!property || property.type !== "Property") {
    return null;
  }

  const key = property.key;
  if (key.type === "Identifier" && !property.computed) {
    return key.name;
  }

  if (key.type === "Literal" && typeof key.value === "string") {
    return key.value;
  }

  return null;
}

export function getPropertyValue(property) {
  if (!property || property.type !== "Property") {
    return null;
  }

  const value = unwrapStaticExpression(property.value);
  if (value.type === "Literal" && (typeof value.value === "string" || typeof value.value === "number")) {
    return value.value;
  }

  if (value.type === "TemplateLiteral" && value.expressions.length === 0) {
    return value.quasis.map((part) => part.value.cooked ?? "").join("");
  }

  return null;
}

export function styleObjectProperties(node) {
  const expression = unwrapStaticExpression(node);
  if (expression?.type !== "ObjectExpression") {
    return [];
  }

  return expression.properties.filter((property) => property.type === "Property");
}

export function stylePropertyMap(node) {
  const map = new Map();
  for (const property of styleObjectProperties(node)) {
    const name = getPropertyName(property);
    if (name) {
      map.set(name, getPropertyValue(property));
    }
  }
  return map;
}

export function parseCssLengthPx(value) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim().toLowerCase();
  const match = /^(-?\d+(?:\.\d+)?)(px|rem)?$/.exec(trimmed);
  if (!match) {
    return null;
  }

  const numeric = Number.parseFloat(match[1]);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  return match[2] === "rem" ? numeric * 16 : numeric;
}

export function staticTemplateValue(node) {
  if (node.type !== "TemplateLiteral" || node.expressions.length > 0) {
    return null;
  }

  return node.quasis.map((part) => part.value.cooked ?? "").join("");
}

export function isInsideJSXAttributeValue(node) {
  let current = node.parent;
  while (current && current.type !== "Program") {
    if (current.type === "JSXAttribute") {
      return true;
    }
    current = current.parent;
  }

  return false;
}
