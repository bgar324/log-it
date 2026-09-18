import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const reference = process.argv[2];
if (!reference) throw new Error("Usage: node scripts/sync-workspace-ui.mjs /path/to/pipeline/web");
const config = JSON.parse(await readFile(path.join(reference, "components.json"), "utf8"));
if (config.style !== "radix-nova") throw new Error("The reference must use radix-nova.");
const target = path.resolve("app/components/workspace-ui");
await mkdir(target, { recursive: true });
const referenceNames = ["alert", "badge", "button", "card", "checkbox", "collapsible", "dropdown-menu", "input", "label", "scroll-area", "select", "separator", "sheet", "skeleton", "tabs", "tooltip"];
const registryNames = ["dialog", "alert-dialog", "textarea", "switch"];
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

function adapt(name, source) {
  const file = ts.createSourceFile(`${name}.tsx`, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const icons = new Set();
  const result = ts.transform(file, [context => {
    const visit = node => {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const specifier = node.moduleSpecifier.text;
        if (specifier.includes("icon-placeholder")) return undefined;
        const localModule = specifier.replace(/^@\/(?:components\/ui|registry\/radix-nova\/ui)\//, "@/app/components/workspace-ui/");
        return context.factory.updateImportDeclaration(node, node.modifiers, node.importClause, context.factory.createStringLiteral(localModule), node.attributes);
      }
      if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(file) === "IconPlaceholder") {
        const icon = node.attributes.properties.find(attribute => ts.isJsxAttribute(attribute) && attribute.name.getText(file) === "lucide");
        if (!icon?.initializer || !ts.isStringLiteral(icon.initializer)) throw new Error(`Missing Lucide icon in ${name}`);
        icons.add(icon.initializer.text);
        const attributes = node.attributes.properties.filter(attribute => !ts.isJsxAttribute(attribute) || !["lucide", "tabler", "hugeicons", "phosphor", "remixicon"].includes(attribute.name.getText(file)));
        return context.factory.createJsxSelfClosingElement(context.factory.createIdentifier(icon.initializer.text), undefined, context.factory.createJsxAttributes(attributes));
      }
      return ts.visitEachChild(node, visit, context);
    };
    return node => ts.visitNode(node, visit);
  }]);
  let code = printer.printFile(result.transformed[0]);
  result.dispose();
  if (!code.startsWith('"use client";')) code = `"use client";\n\n${code}`;
  if (icons.size) code = code.replace('"use client";', `"use client";\nimport { ${[...icons].join(", ")} } from "lucide-react";`);
  return code;
}

for (const name of referenceNames) {
  const source = await readFile(path.join(reference, "src/components/ui", `${name}.tsx`), "utf8");
  await writeFile(path.join(target, `${name}.tsx`), adapt(name, source));
}
for (const name of registryNames) {
  const response = await fetch(`https://ui.shadcn.com/r/styles/radix-nova/${name}.json`);
  if (!response.ok) throw new Error(`Registry returned ${response.status} for ${name}`);
  const item = await response.json();
  const file = item.files?.find(file => file.type === "registry:ui" && file.path.endsWith(`${name}.tsx`));
  if (typeof file?.content !== "string") throw new Error(`Missing primitive ${name}`);
  await writeFile(path.join(target, `${name}.tsx`), adapt(name, file.content));
}
console.log(`Imported ${referenceNames.length + registryNames.length} Nova primitives; reference styling retained.`);
