import { getAntiSlopConfig } from "./_shared.mjs";

function isPrimaryRouteFile(filename) {
  return (
    /(?:^|\/)(?:src\/)?app\/(?:.*\/)?(?:page|layout|route)\.(?:t|j)sx?$/.test(filename) ||
    /(?:^|\/)(?:src\/)?pages\/.*\.(?:t|j)sx?$/.test(filename)
  );
}

function calleeRootName(callee) {
  let current = callee;
  while (current) {
    if (current.type === "ChainExpression") {
      current = current.expression;
    } else if (current.type === "MemberExpression") {
      current = current.object;
    } else if (current.type === "CallExpression") {
      current = current.callee;
    } else {
      break;
    }
  }

  return current?.type === "Identifier" ? current.name : null;
}

export const noDemoDataPrimaryPathRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Prevent top-level routes from relying on demo data as primary data source.",
    },
    schema: [],
    messages: {
      demoDataPrimary:
        "This route imports demo data modules without clear real-data indicators. Demo data should not be the primary source.",
    },
  },
  create(context) {
    const filename = context.filename;
    if (!isPrimaryRouteFile(filename)) {
      return {};
    }

    const config = getAntiSlopConfig(context);
    const demoImports = [];
    let hasRealDataIndicator = false;

    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        if (typeof source !== "string") {
          return;
        }

        const isDemo = config.demoDataModules.some((moduleName) => source === moduleName || source.startsWith(`${moduleName}/`));
        if (isDemo) {
          demoImports.push(node);
          return;
        }

        const segments = source.split("/").filter(Boolean);
        if (segments.some((segment) => config.realDataIndicators.includes(segment))) {
          hasRealDataIndicator = true;
        }
      },
      CallExpression(node) {
        const rootName = calleeRootName(node.callee);
        if (rootName && config.realDataIndicators.includes(rootName)) {
          hasRealDataIndicator = true;
        }
      },
      "Program:exit"() {
        if (demoImports.length === 0 || hasRealDataIndicator) {
          return;
        }

        context.report({
          node: demoImports[0],
          messageId: "demoDataPrimary",
        });
      },
    };
  },
};
