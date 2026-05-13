import { getAntiSlopConfig } from "./_shared.mjs";

function isPrimaryRouteFile(filename) {
  return /(?:^|\/)app\/.*\/page\.(?:t|j)sx?$/.test(filename) || /(?:^|\/)src\/pages\/.*\.(?:t|j)sx?$/.test(filename);
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
        }
      },
      Identifier(node) {
        if (config.realDataIndicators.includes(node.name)) {
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
