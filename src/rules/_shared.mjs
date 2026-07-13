const DEFAULT_CONFIG = {
  placeholderPatterns: ["coming soon", "todo", "tbd", "lorem ipsum", "placeholder"],
  marketingPatterns: ["powerful", "seamless", "unlock", "supercharge"],
  genericStatLabels: ["performance", "insights", "overview", "analytics", "usage", "activity"],
  actionWords: ["retry", "open", "create", "run", "fix", "clear filter"],
  demoDataModules: ["@/demo", "@/mocks", "@/fixtures"],
  realDataIndicators: ["fetch", "db", "prisma", "trpc"],
  clientOnlyImports: ["next/navigation", "@tanstack/react-query", "recharts"],
};

const USER_FACING_JSX_ATTRS = new Set([
  "aria-label",
  "alt",
  "label",
  "placeholder",
  "title",
]);
const ACTION_ELEMENT_NAMES = new Set(["a", "button", "input", "select", "textarea"]);
const FIELDSET_DISABLED_CONTROL_NAMES = new Set(["button", "input", "select", "textarea"]);
const NATIVE_DISABLED_ELEMENT_NAMES = new Set([...FIELDSET_DISABLED_CONTROL_NAMES, "fieldset"]);
const MAX_STATIC_UI_PATHS = 64;
const TRANSPARENT_EXPRESSION_TYPES = new Set([
  "ChainExpression",
  "TSAsExpression",
  "TSNonNullExpression",
  "TSSatisfiesExpression",
  "TypeCastExpression",
]);

export function unwrapStaticExpression(expression) {
  let current = expression;
  while (TRANSPARENT_EXPRESSION_TYPES.has(current?.type)) {
    current = current.expression;
  }
  return current;
}

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
    return parent.name?.type === "JSXIdentifier" && USER_FACING_JSX_ATTRS.has(parent.name.name);
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

function jsxAttribute(opening, name) {
  return (opening.attributes || []).find((attribute) => attribute.type === "JSXAttribute" && attribute.name?.name === name) ?? null;
}

function staticAttributeValue(attribute) {
  if (!attribute) {
    return null;
  }

  if (!attribute.value) {
    return true;
  }

  if (attribute.value.type === "Literal") {
    return attribute.value.value;
  }

  if (attribute.value.type === "JSXExpressionContainer") {
    const expression = unwrapStaticExpression(attribute.value.expression);
    if (expression.type === "Literal") {
      return expression.value;
    }
    if (expression.type === "TemplateLiteral" && expression.expressions.length === 0) {
      return expression.quasis.map((part) => part.value.cooked ?? "").join("");
    }
    if (expression.type === "Identifier" && expression.name === "undefined") {
      return undefined;
    }
    if (expression.type === "UnaryExpression" && expression.operator === "void") {
      return undefined;
    }
  }

  return null;
}

function isStaticallyAbsentBooleanExpression(expression) {
  return staticExpressionTruthiness(expression) === false;
}

function isNativeBooleanAttributePresent(attribute) {
  if (!attribute) {
    return false;
  }

  if (!attribute.value || attribute.value.type !== "JSXExpressionContainer") {
    return true;
  }

  return !isStaticallyAbsentBooleanExpression(attribute.value.expression);
}

function isAriaDisabled(attribute) {
  if (!attribute) {
    return false;
  }

  if (!attribute.value) {
    return true;
  }

  const value =
    attribute.value.type === "JSXExpressionContainer" ? unwrapStaticExpression(attribute.value.expression) : attribute.value;
  if (value.type === "Identifier" && value.name === "undefined") {
    return false;
  }
  if (value.type === "UnaryExpression" && value.operator === "void") {
    return false;
  }
  if (value.type === "Literal") {
    return ![false, 0, null, "false"].includes(value.value);
  }

  return staticExpressionTruthiness(value) !== false;
}

function isDisabled(opening) {
  return (
    (NATIVE_DISABLED_ELEMENT_NAMES.has(openingElementName(opening)) &&
      isNativeBooleanAttributePresent(jsxAttribute(opening, "disabled"))) ||
    isAriaDisabled(jsxAttribute(opening, "aria-disabled"))
  );
}

function isHidden(opening) {
  return isNativeBooleanAttributePresent(jsxAttribute(opening, "hidden"));
}

function hasNonEmptyHref(opening) {
  const value = staticAttributeValue(jsxAttribute(opening, "href"));
  return typeof value === "string" && value.trim().length > 0;
}

function isVisibleFormControl(opening, name) {
  if (isHidden(opening)) {
    return false;
  }

  if (name !== "input") {
    return true;
  }

  const type = jsxAttribute(opening, "type");
  if (!type) {
    return true;
  }

  if (type.value?.type === "Literal") {
    return typeof type.value.value !== "string" || type.value.value.toLowerCase() !== "hidden";
  }

  if (type.value?.type !== "JSXExpressionContainer") {
    return true;
  }

  const expression = unwrapStaticExpression(type.value.expression);
  if (expression.type === "Identifier" && expression.name === "undefined") {
    return true;
  }
  if (expression.type === "Literal") {
    return typeof expression.value !== "string" || expression.value.toLowerCase() !== "hidden";
  }
  if (expression.type === "TemplateLiteral" && expression.expressions.length === 0) {
    return expression.quasis.map((part) => part.value.cooked ?? "").join("").toLowerCase() !== "hidden";
  }

  return false;
}

function hasEnabledOnClick(opening) {
  if (isDisabled(opening) || isHidden(opening)) {
    return false;
  }

  const attribute = jsxAttribute(opening, "onClick");
  if (!attribute) {
    return false;
  }

  if (!attribute.value || attribute.value.type === "Literal") {
    return false;
  }

  if (attribute.value.type === "JSXExpressionContainer") {
    const expression = unwrapStaticExpression(attribute.value.expression);
    if (
      staticExpressionTruthiness(expression) === false ||
      ["Literal", "ArrayExpression", "ObjectExpression", "JSXElement", "JSXFragment"].includes(expression?.type)
    ) {
      return false;
    }
    return true;
  }

  return false;
}

function openingElementName(opening) {
  return opening.name?.type === "JSXIdentifier" ? opening.name.name.toLowerCase() : "";
}

function isNativeElement(opening, name) {
  return opening.name?.type === "JSXIdentifier" && opening.name.name === name;
}

function isFragmentElement(opening) {
  return (
    opening.name?.type === "JSXMemberExpression" &&
    opening.name.object?.type === "JSXIdentifier" &&
    opening.name.object.name === "React" &&
    opening.name.property?.type === "JSXIdentifier" &&
    opening.name.property.name === "Fragment"
  );
}

function isNativeDisabledFieldset(opening) {
  return isNativeElement(opening, "fieldset") && isNativeBooleanAttributePresent(jsxAttribute(opening, "disabled"));
}

function isUsableActionElement(opening, disabledByFieldset = false) {
  const name = openingElementName(opening);
  if (isDisabled(opening)) {
    return false;
  }

  if (disabledByFieldset && FIELDSET_DISABLED_CONTROL_NAMES.has(name)) {
    return false;
  }

  if (name === "button") {
    return !isHidden(opening);
  }
  if (name === "a") {
    return !isHidden(opening) && (hasNonEmptyHref(opening) || hasEnabledOnClick(opening));
  }
  if (["input", "select", "textarea"].includes(name)) {
    return isVisibleFormControl(opening, name);
  }
  return hasEnabledOnClick(opening);
}

function staticExpressionTruthiness(expression) {
  const subject = unwrapStaticExpression(expression);
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
      const truthiness = staticExpressionTruthiness(subject.argument);
      return truthiness === null ? null : !truthiness;
    }
    if (["+", "-"].includes(subject.operator) && subject.argument.type === "Literal" && typeof subject.argument.value === "number") {
      return Boolean(subject.operator === "+" ? +subject.argument.value : -subject.argument.value);
    }
  }

  if (subject?.type === "ConditionalExpression") {
    const testTruthiness = staticExpressionTruthiness(subject.test);
    if (testTruthiness === true) {
      return staticExpressionTruthiness(subject.consequent);
    }
    if (testTruthiness === false) {
      return staticExpressionTruthiness(subject.alternate);
    }
  }

  if (subject?.type === "LogicalExpression") {
    const leftTruthiness = staticExpressionTruthiness(subject.left);
    const rightTruthiness = staticExpressionTruthiness(subject.right);
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
    if (subject.operator === "??") {
      const leftNullish = staticExpressionNullish(subject.left);
      if (leftNullish === true) {
        return staticExpressionTruthiness(subject.right);
      }
      if (leftNullish === false) {
        return leftTruthiness;
      }
    }
  }

  return null;
}

function staticExpressionNullish(expression) {
  const subject = unwrapStaticExpression(expression);
  if (subject?.type === "Literal") {
    return subject.value === null;
  }

  if (subject?.type === "UnaryExpression" && subject.operator === "void") {
    return true;
  }

  return subject?.type === "Identifier" && subject.name === "undefined" ? true : null;
}

function emptyUiPath() {
  return {
    text: "",
    texts: [],
    actionTexts: [],
    hasUnusableActionText: false,
    hasActionWording: false,
    hasAction: false,
    conditions: new Map(),
  };
}

function normalizeUiText(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

function joinUiText(left, right) {
  return [left, right].filter(Boolean).join(" ");
}

function createStaticUiPathState(actionWords = []) {
  return { actionWords, conditionIds: new WeakMap(), nextConditionId: 0 };
}

function staticConditionKey(expression) {
  const subject = unwrapStaticExpression(expression);
  if (!subject || typeof subject !== "object") {
    return null;
  }

  if (subject.type === "Identifier") {
    return `identifier:${subject.name}`;
  }

  if (subject.type === "ThisExpression") {
    return "this";
  }

  if (subject.type === "Literal") {
    return `literal:${JSON.stringify(subject.value)}`;
  }

  if (subject.type === "MemberExpression") {
    const object = staticConditionKey(subject.object);
    if (!object) {
      return null;
    }
    if (!subject.computed && subject.property.type === "Identifier") {
      return `member:${object}.${subject.property.name}`;
    }
    const property = staticConditionKey(subject.property);
    return property ? `member:${object}[${property}]` : null;
  }

  if (["UnaryExpression", "BinaryExpression", "LogicalExpression"].includes(subject.type)) {
    const left = subject.type === "UnaryExpression" ? staticConditionKey(subject.argument) : staticConditionKey(subject.left);
    const right = subject.type === "UnaryExpression" ? null : staticConditionKey(subject.right);
    if (!left || (subject.type !== "UnaryExpression" && !right)) {
      return null;
    }
    return subject.type === "UnaryExpression"
      ? `${subject.type}:${subject.operator}(${left})`
      : `${subject.type}:${subject.operator}(${left},${right})`;
  }

  return null;
}

function conditionDescriptor(expression, kind, state) {
  let subject = unwrapStaticExpression(expression);
  let inverted = false;

  if (kind === "truthy") {
    while (subject?.type === "UnaryExpression" && subject.operator === "!") {
      inverted = !inverted;
      subject = unwrapStaticExpression(subject.argument);
    }
  }

  const staticKey = staticConditionKey(subject);
  if (staticKey) {
    return { key: `${kind}:${staticKey}`, inverted, subject };
  }

  let id = state.conditionIds.get(expression);
  if (id === undefined) {
    id = state.nextConditionId;
    state.nextConditionId += 1;
    state.conditionIds.set(expression, id);
  }
  return { key: `${kind}:expression:${id}`, inverted: false, subject };
}

function conditionValue(descriptor, value) {
  return descriptor.inverted ? !value : value;
}

function impliedTruthyConjunctionConditions(expression, state) {
  const subject = unwrapStaticExpression(expression);
  if (subject?.type === "LogicalExpression" && subject.operator === "&&") {
    return [
      ...impliedTruthyConjunctionConditions(subject.left, state),
      ...impliedTruthyConjunctionConditions(subject.right, state),
    ];
  }

  if (subject?.type === "BinaryExpression" && subject.operator === "===") {
    const leftBoolean = unwrapStaticExpression(subject.left);
    const rightBoolean = unwrapStaticExpression(subject.right);
    if (leftBoolean?.type === "Literal" && typeof leftBoolean.value === "boolean") {
      const descriptor = conditionDescriptor(subject.right, "truthy", state);
      return [{ key: descriptor.key, value: conditionValue(descriptor, leftBoolean.value) }];
    }
    if (rightBoolean?.type === "Literal" && typeof rightBoolean.value === "boolean") {
      const descriptor = conditionDescriptor(subject.left, "truthy", state);
      return [{ key: descriptor.key, value: conditionValue(descriptor, rightBoolean.value) }];
    }
  }

  const descriptor = conditionDescriptor(subject, "truthy", state);
  return [{ key: descriptor.key, value: conditionValue(descriptor, true) }];
}

function hasTruthyImplications(expression) {
  const subject = unwrapStaticExpression(expression);
  if (subject?.type === "LogicalExpression" && subject.operator === "&&") {
    return true;
  }
  if (subject?.type !== "BinaryExpression" || subject.operator !== "===") {
    return false;
  }
  const left = unwrapStaticExpression(subject.left);
  const right = unwrapStaticExpression(subject.right);
  return (left?.type === "Literal" && typeof left.value === "boolean") || (right?.type === "Literal" && typeof right.value === "boolean");
}

function uiCondition(expression, kind, value, state) {
  const descriptor = conditionDescriptor(expression, kind, state);
  const condition = {
    key: descriptor.key,
    value: conditionValue(descriptor, value),
  };

  if (kind !== "truthy" || condition.value !== true || !hasTruthyImplications(descriptor.subject)) {
    return [condition];
  }

  return [condition, ...impliedTruthyConjunctionConditions(descriptor.subject, state)];
}

function mergeUiConditions(left, right) {
  const conditions = new Map(left ?? []);
  for (const [key, value] of right ?? []) {
    if (conditions.has(key) && conditions.get(key) !== value) {
      return null;
    }
    conditions.set(key, value);
  }
  return conditions;
}

function withUiCondition(paths, conditionsToMerge) {
  return uniqueUiPaths(
    paths
      .map((path) => {
        const conditions = mergeUiConditions(
          path.conditions,
          conditionsToMerge.map((condition) => [condition.key, condition.value]),
        );
        return conditions ? { ...path, conditions } : null;
      })
      .filter(Boolean),
  );
}

function uiPathKey(path) {
  const text = normalizeUiText(path.text);
  const texts = path.texts.map(normalizeUiText).filter(Boolean);
  const actionTexts = path.actionTexts.map(normalizeUiText).filter(Boolean);
  const conditions = [...(path.conditions ?? [])].sort(([left], [right]) => left.localeCompare(right));
  return `${path.hasAction}:${path.hasUnusableActionText}:${path.hasActionWording}:${text}\u0000${texts.join("\u0001")}\u0000${actionTexts.join("\u0001")}\u0000${conditions.map(([name, value]) => `${name}:${value}`).join("\u0001")}`;
}

function uniqueUiPaths(paths) {
  const seen = new Set();
  const unique = [];

  const orderedPaths = [...paths].sort(
    (left, right) =>
      Number(left.hasAction) - Number(right.hasAction) ||
      Number(left.hasActionWording) - Number(right.hasActionWording) ||
      left.actionTexts.length - right.actionTexts.length,
  );
  for (const path of orderedPaths) {
    const text = normalizeUiText(path.text);
    const texts = path.texts.map(normalizeUiText).filter(Boolean);
    const actionTexts = path.actionTexts.map(normalizeUiText).filter(Boolean);
    const conditions = [...(path.conditions ?? [])].sort(([left], [right]) => left.localeCompare(right));
    const key = uiPathKey(path);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push({
      text,
      texts,
      actionTexts,
      hasUnusableActionText: path.hasUnusableActionText,
      hasActionWording: path.hasActionWording,
      hasAction: path.hasAction,
      conditions: new Map(conditions),
    });
    if (unique.length >= MAX_STATIC_UI_PATHS) {
      break;
    }
  }

  return unique;
}

function combineUiPaths(left, right) {
  const conditions = mergeUiConditions(left.conditions, right.conditions);
  if (!conditions) {
    return null;
  }
  return {
    text: joinUiText(left.text, right.text),
    texts: [...left.texts, ...right.texts],
    actionTexts: [...left.actionTexts, ...right.actionTexts],
    hasUnusableActionText: left.hasUnusableActionText || right.hasUnusableActionText,
    hasActionWording: left.hasActionWording || right.hasActionWording,
    hasAction: left.hasAction || right.hasAction,
    conditions,
  };
}

function combineUiPathGroups(groups) {
  let paths = [emptyUiPath()];

  for (const group of groups) {
    const combined = [];
    for (const left of paths) {
      for (const right of group) {
        const path = combineUiPaths(left, right);
        if (!path) {
          continue;
        }
        combined.push(path);
        if (combined.length >= MAX_STATIC_UI_PATHS) {
          break;
        }
      }
      if (combined.length >= MAX_STATIC_UI_PATHS) {
        break;
      }
    }
    paths = uniqueUiPaths(combined);
  }

  return paths;
}

function isPotentialActionElement(opening) {
  return ACTION_ELEMENT_NAMES.has(openingElementName(opening)) || Boolean(jsxAttribute(opening, "onClick"));
}

function isNamedActionElement(opening) {
  return ACTION_ELEMENT_NAMES.has(openingElementName(opening));
}

function staticUiExpressionPaths(expression, disabledByFieldset, state) {
  expression = unwrapStaticExpression(expression);
  if (!expression || typeof expression !== "object") {
    return [emptyUiPath()];
  }

  if (expression.type === "Literal") {
    if (typeof expression.value !== "string") {
      return [emptyUiPath()];
    }
    const hasActionWording = patternMatches(expression.value, state.actionWords);
    return [
      {
        ...emptyUiPath(),
        text: expression.value,
        actionTexts: hasActionWording ? [expression.value] : [],
        hasActionWording,
      },
    ];
  }

  if (expression.type === "TemplateLiteral") {
    if (expression.expressions.length > 0) {
      return [emptyUiPath()];
    }
    const text = expression.quasis.map((part) => part.value.cooked ?? "").join("");
    const hasActionWording = patternMatches(text, state.actionWords);
    return [{ ...emptyUiPath(), text, actionTexts: hasActionWording ? [text] : [], hasActionWording }];
  }

  if (expression.type === "JSXElement" || expression.type === "JSXFragment") {
    return staticUiPaths(expression, disabledByFieldset, state);
  }

  if (expression.type === "ConditionalExpression") {
    const truthiness = staticExpressionTruthiness(expression.test);
    if (truthiness === true) {
      return staticUiExpressionPaths(expression.consequent, disabledByFieldset, state);
    }
    if (truthiness === false) {
      return staticUiExpressionPaths(expression.alternate, disabledByFieldset, state);
    }
    return uniqueUiPaths([
      ...withUiCondition(
        staticUiExpressionPaths(expression.consequent, disabledByFieldset, state),
        uiCondition(expression.test, "truthy", true, state),
      ),
      ...withUiCondition(
        staticUiExpressionPaths(expression.alternate, disabledByFieldset, state),
        uiCondition(expression.test, "truthy", false, state),
      ),
    ]);
  }

  if (expression.type === "LogicalExpression") {
    if (expression.operator === "&&") {
      const truthiness = staticExpressionTruthiness(expression.left);
      if (truthiness === false) {
        return [emptyUiPath()];
      }
      if (truthiness === true) {
        return staticUiExpressionPaths(expression.right, disabledByFieldset, state);
      }
      return uniqueUiPaths([
        ...withUiCondition([emptyUiPath()], uiCondition(expression.left, "truthy", false, state)),
        ...withUiCondition(
          staticUiExpressionPaths(expression.right, disabledByFieldset, state),
          uiCondition(expression.left, "truthy", true, state),
        ),
      ]);
    }

    if (expression.operator === "||") {
      const truthiness = staticExpressionTruthiness(expression.left);
      if (truthiness === true) {
        return staticUiExpressionPaths(expression.left, disabledByFieldset, state);
      }
      if (truthiness === false) {
        return staticUiExpressionPaths(expression.right, disabledByFieldset, state);
      }
      return uniqueUiPaths([
        ...withUiCondition(
          staticUiExpressionPaths(expression.left, disabledByFieldset, state),
          uiCondition(expression.left, "truthy", true, state),
        ),
        ...withUiCondition(
          staticUiExpressionPaths(expression.right, disabledByFieldset, state),
          uiCondition(expression.left, "truthy", false, state),
        ),
      ]);
    }

    if (expression.operator === "??") {
      const nullish = staticExpressionNullish(expression.left);
      if (nullish === true) {
        return staticUiExpressionPaths(expression.right, disabledByFieldset, state);
      }
      if (nullish === false) {
        return staticUiExpressionPaths(expression.left, disabledByFieldset, state);
      }
      return uniqueUiPaths([
        ...withUiCondition(
          staticUiExpressionPaths(expression.left, disabledByFieldset, state),
          uiCondition(expression.left, "nullish", false, state),
        ),
        ...withUiCondition(
          staticUiExpressionPaths(expression.right, disabledByFieldset, state),
          uiCondition(expression.left, "nullish", true, state),
        ),
      ]);
    }
  }

  if (expression.type === "ArrayExpression") {
    return combineUiPathGroups(expression.elements.map((element) => staticUiExpressionPaths(element, disabledByFieldset, state)));
  }

  return [emptyUiPath()];
}

function uniqueFieldsetStates(states) {
  const seen = new Set();
  const unique = [];

  for (const fieldsetState of states) {
    const key = `${fieldsetState.firstLegendAvailable}:${uiPathKey(fieldsetState.path)}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(fieldsetState);
    if (unique.length >= MAX_STATIC_UI_PATHS) {
      break;
    }
  }

  return unique;
}

function withFieldsetCondition(states, condition) {
  return uniqueFieldsetStates(
    states.flatMap((fieldsetState) =>
      withUiCondition([fieldsetState.path], condition).map((path) => ({ ...fieldsetState, path })),
    ),
  );
}

function staticDisabledFieldsetSequenceStates(children, disabledByFieldset, firstLegendAvailable, state) {
  let fieldsetStates = [{ path: emptyUiPath(), firstLegendAvailable }];

  for (const child of children) {
    const combined = [];
    for (const fieldsetState of fieldsetStates) {
      for (const childState of staticDisabledFieldsetNodeStates(
        child,
        disabledByFieldset,
        fieldsetState.firstLegendAvailable,
        state,
      )) {
        const path = combineUiPaths(fieldsetState.path, childState.path);
        if (path) {
          combined.push({ path, firstLegendAvailable: childState.firstLegendAvailable });
        }
        if (combined.length >= MAX_STATIC_UI_PATHS) {
          break;
        }
      }
      if (combined.length >= MAX_STATIC_UI_PATHS) {
        break;
      }
    }
    fieldsetStates = uniqueFieldsetStates(combined);
  }

  return fieldsetStates;
}

function staticDisabledFieldsetChildrenPaths(children, disabledByFieldset, state) {
  return staticDisabledFieldsetSequenceStates(children, disabledByFieldset, true, state).map(
    (fieldsetState) => fieldsetState.path,
  );
}

function staticDisabledFieldsetNodeStates(node, disabledByFieldset, firstLegendAvailable, state) {
  if (!node || typeof node !== "object") {
    return [{ path: emptyUiPath(), firstLegendAvailable }];
  }

  if (node.type === "JSXFragment") {
    return staticDisabledFieldsetSequenceStates(node.children, disabledByFieldset, firstLegendAvailable, state);
  }

  if (node.type === "JSXExpressionContainer") {
    return staticDisabledFieldsetExpressionStates(node.expression, disabledByFieldset, firstLegendAvailable, state);
  }

  if (node.type === "JSXElement" && isNativeElement(node.openingElement, "legend")) {
    return uniqueFieldsetStates(
      staticUiPaths(node, firstLegendAvailable ? disabledByFieldset : true, state).map((path) => ({
        path,
        firstLegendAvailable: false,
      })),
    );
  }

  if (node.type === "JSXElement" && isFragmentElement(node.openingElement)) {
    return staticDisabledFieldsetSequenceStates(node.children, disabledByFieldset, firstLegendAvailable, state);
  }

  return uniqueFieldsetStates(
    staticUiPaths(node, true, state).map((path) => ({ path, firstLegendAvailable })),
  );
}

function staticDisabledFieldsetExpressionStates(expression, disabledByFieldset, firstLegendAvailable, state) {
  expression = unwrapStaticExpression(expression);
  if (!expression || typeof expression !== "object") {
    return [{ path: emptyUiPath(), firstLegendAvailable }];
  }

  if (expression.type === "JSXElement" || expression.type === "JSXFragment") {
    return staticDisabledFieldsetNodeStates(expression, disabledByFieldset, firstLegendAvailable, state);
  }

  if (expression.type === "ConditionalExpression") {
    const truthiness = staticExpressionTruthiness(expression.test);
    if (truthiness === true) {
      return staticDisabledFieldsetExpressionStates(expression.consequent, disabledByFieldset, firstLegendAvailable, state);
    }
    if (truthiness === false) {
      return staticDisabledFieldsetExpressionStates(expression.alternate, disabledByFieldset, firstLegendAvailable, state);
    }
    return uniqueFieldsetStates([
      ...withFieldsetCondition(
        staticDisabledFieldsetExpressionStates(expression.consequent, disabledByFieldset, firstLegendAvailable, state),
        uiCondition(expression.test, "truthy", true, state),
      ),
      ...withFieldsetCondition(
        staticDisabledFieldsetExpressionStates(expression.alternate, disabledByFieldset, firstLegendAvailable, state),
        uiCondition(expression.test, "truthy", false, state),
      ),
    ]);
  }

  if (expression.type === "LogicalExpression") {
    if (expression.operator === "&&") {
      const truthiness = staticExpressionTruthiness(expression.left);
      if (truthiness === false) {
        return [{ path: emptyUiPath(), firstLegendAvailable }];
      }
      if (truthiness === true) {
        return staticDisabledFieldsetExpressionStates(expression.right, disabledByFieldset, firstLegendAvailable, state);
      }
      return uniqueFieldsetStates([
        ...withFieldsetCondition(
          [{ path: emptyUiPath(), firstLegendAvailable }],
          uiCondition(expression.left, "truthy", false, state),
        ),
        ...withFieldsetCondition(
          staticDisabledFieldsetExpressionStates(expression.right, disabledByFieldset, firstLegendAvailable, state),
          uiCondition(expression.left, "truthy", true, state),
        ),
      ]);
    }

    if (expression.operator === "||") {
      const truthiness = staticExpressionTruthiness(expression.left);
      if (truthiness === true) {
        return staticDisabledFieldsetExpressionStates(expression.left, disabledByFieldset, firstLegendAvailable, state);
      }
      if (truthiness === false) {
        return staticDisabledFieldsetExpressionStates(expression.right, disabledByFieldset, firstLegendAvailable, state);
      }
      return uniqueFieldsetStates([
        ...withFieldsetCondition(
          staticDisabledFieldsetExpressionStates(expression.left, disabledByFieldset, firstLegendAvailable, state),
          uiCondition(expression.left, "truthy", true, state),
        ),
        ...withFieldsetCondition(
          staticDisabledFieldsetExpressionStates(expression.right, disabledByFieldset, firstLegendAvailable, state),
          uiCondition(expression.left, "truthy", false, state),
        ),
      ]);
    }

    if (expression.operator === "??") {
      const nullish = staticExpressionNullish(expression.left);
      if (nullish === true) {
        return staticDisabledFieldsetExpressionStates(expression.right, disabledByFieldset, firstLegendAvailable, state);
      }
      if (nullish === false) {
        return staticDisabledFieldsetExpressionStates(expression.left, disabledByFieldset, firstLegendAvailable, state);
      }
      return uniqueFieldsetStates([
        ...withFieldsetCondition(
          staticDisabledFieldsetExpressionStates(expression.left, disabledByFieldset, firstLegendAvailable, state),
          uiCondition(expression.left, "nullish", false, state),
        ),
        ...withFieldsetCondition(
          staticDisabledFieldsetExpressionStates(expression.right, disabledByFieldset, firstLegendAvailable, state),
          uiCondition(expression.left, "nullish", true, state),
        ),
      ]);
    }
  }

  if (expression.type === "ArrayExpression") {
    return staticDisabledFieldsetSequenceStates(expression.elements, disabledByFieldset, firstLegendAvailable, state);
  }

  return uniqueFieldsetStates(
    staticUiExpressionPaths(expression, true, state).map((path) => ({ path, firstLegendAvailable })),
  );
}

function finalizeStaticElementPaths(paths, hasOwnAction, state, includeActionText = true) {
  return uniqueUiPaths(
    paths.map((path) => {
      const text = normalizeUiText(path.text);
      return {
        text,
        texts: text ? [...path.texts, text] : path.texts,
        actionTexts: text && includeActionText && !path.hasUnusableActionText ? [...path.actionTexts, text] : path.actionTexts,
        hasUnusableActionText: path.hasUnusableActionText,
        hasActionWording:
          path.hasActionWording ||
          Boolean(text && includeActionText && !path.hasUnusableActionText && patternMatches(text, state.actionWords)),
        hasAction: path.hasAction || hasOwnAction,
        conditions: path.conditions,
      };
    }),
  );
}

function staticUiPaths(node, disabledByFieldset, state) {
  if (!node || typeof node !== "object") {
    return [emptyUiPath()];
  }

  if (node.type === "JSXText") {
    const hasActionWording = patternMatches(node.value, state.actionWords);
    return [{ ...emptyUiPath(), text: node.value, actionTexts: hasActionWording ? [node.value] : [], hasActionWording }];
  }

  if (node.type === "JSXExpressionContainer") {
    return staticUiExpressionPaths(node.expression, disabledByFieldset, state);
  }

  if (node.type === "JSXFragment") {
    return combineUiPathGroups(node.children.map((child) => staticUiPaths(child, disabledByFieldset, state)));
  }

  if (node.type !== "JSXElement") {
    return [emptyUiPath()];
  }

  const opening = node.openingElement;
  if (isHidden(opening)) {
    return [emptyUiPath()];
  }

  const hasOwnAction = isPotentialActionElement(opening) && isUsableActionElement(opening, disabledByFieldset);
  if (hasOwnAction) {
    return [{ ...emptyUiPath(), hasAction: true }];
  }
  if (isNamedActionElement(opening)) {
    const childPaths = combineUiPathGroups(node.children.map((child) => staticUiPaths(child, disabledByFieldset, state)));
    return finalizeStaticElementPaths(
      childPaths.map((path) => ({ ...path, actionTexts: [], hasUnusableActionText: true, hasActionWording: false })),
      false,
      state,
      false,
    );
  }
  const childPaths = isNativeDisabledFieldset(opening)
    ? staticDisabledFieldsetChildrenPaths(node.children, disabledByFieldset, state)
    : combineUiPathGroups(node.children.map((child) => staticUiPaths(child, disabledByFieldset, state)));
  return finalizeStaticElementPaths(childPaths, false, state);
}

export function getStaticUiPaths(node, actionWords = []) {
  return staticUiPaths(node, false, createStaticUiPathState(actionWords)).map(({ texts, actionTexts, hasAction }) => ({
    texts,
    actionTexts,
    hasAction,
  }));
}
