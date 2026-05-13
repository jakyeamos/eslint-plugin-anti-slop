const DEFAULT_CONFIG = {
  placeholderPatterns: ["coming soon", "todo", "tbd", "lorem ipsum", "placeholder"],
  marketingPatterns: ["powerful", "seamless", "unlock", "supercharge"],
  genericStatLabels: ["performance", "insights", "overview", "analytics", "usage", "activity"],
  actionWords: ["retry", "open", "create", "run", "fix", "clear filter"],
  demoDataModules: ["@/demo", "@/mocks", "@/fixtures"],
  realDataIndicators: ["fetch", "db", "prisma", "trpc"],
  clientOnlyImports: ["next/navigation", "@tanstack/react-query", "recharts"],
};

export function getAntiSlopConfig(context) {
  const cfg = context.settings?.["anti-slop"];
  if (!cfg || typeof cfg !== "object") {
    return DEFAULT_CONFIG;
  }

  return {
    ...DEFAULT_CONFIG,
    ...cfg,
  };
}

export function normalizeLower(value) {
  return String(value).toLowerCase().trim();
}

export function getLiteralString(node) {
  if (!node) {
    return null;
  }

  if (node.type === "Literal" && typeof node.value === "string") {
    return node.value;
  }

  if (node.type === "TemplateLiteral" && node.expressions.length === 0) {
    return node.quasis.map((part) => part.value.cooked ?? "").join("");
  }

  return null;
}

export function isLikelyUserFacingString(node) {
  const parent = node.parent;
  if (!parent) {
    return false;
  }

  if (node.type === "JSXText") {
    return true;
  }

  if (parent.type === "JSXAttribute") {
    return true;
  }

  if (parent.type === "Property") {
    const key = parent.key;
    const keyName =
      key && key.type === "Identifier"
        ? key.name
        : key && key.type === "Literal" && typeof key.value === "string"
          ? key.value
          : null;

    if (!keyName) {
      return false;
    }

    return ["title", "description", "subtitle", "label", "placeholder", "emptyMessage", "heading"].includes(
      keyName,
    );
  }

  return false;
}

export function patternMatches(value, patterns) {
  const lower = normalizeLower(value);
  return patterns.some((pattern) => lower.includes(normalizeLower(pattern)));
}

export function extractJSXText(node) {
  let combined = "";

  function walk(current) {
    if (!current || typeof current !== "object") {
      return;
    }

    if (current.type === "JSXText") {
      combined += ` ${current.value}`;
      return;
    }

    if (current.type === "Literal" && typeof current.value === "string") {
      combined += ` ${current.value}`;
      return;
    }

    if (Array.isArray(current.children)) {
      for (const child of current.children) {
        walk(child);
      }
    }

    if (current.type === "JSXExpressionContainer") {
      walk(current.expression);
    }

    if (current.type === "ConditionalExpression") {
      walk(current.consequent);
      walk(current.alternate);
    }
  }

  walk(node);
  return normalizeLower(combined.replace(/\s+/g, " ").trim());
}

export function hasActionableElement(node) {
  let found = false;
  const visited = new Set();

  function walk(current) {
    if (found || !current || typeof current !== "object") {
      return;
    }

    if (visited.has(current)) {
      return;
    }
    visited.add(current);

    if (current.type === "JSXOpeningElement") {
      const name = current.name?.type === "JSXIdentifier" ? current.name.name.toLowerCase() : "";

      if (["button", "a", "input", "select", "textarea"].includes(name)) {
        found = true;
        return;
      }

      const hasOnClick = (current.attributes || []).some((attr) => attr.type === "JSXAttribute" && attr.name?.name === "onClick");
      if (hasOnClick) {
        found = true;
        return;
      }
    }

    for (const [key, value] of Object.entries(current)) {
      if (key === "parent") {
        continue;
      }

      if (Array.isArray(value)) {
        for (const child of value) {
          walk(child);
        }
      } else {
        walk(value);
      }
    }
  }

  walk(node);
  return found;
}
