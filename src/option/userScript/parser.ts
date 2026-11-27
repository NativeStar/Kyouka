import { parse } from "acorn"
import type { ArrayExpression, Identifier, ObjectExpression, Property, SpreadElement } from "acorn";
import type { UserScriptMetadata } from "../../types";
type Nullable<T> = {
    [K in keyof T]: T[K] | null;
};
export function parseRawUserScript(rawUserScript: string): UserScriptMetadata | null {
    const ast = parse(rawUserScript, { ecmaVersion: "latest", sourceType: "module" });
    for (const node of ast.body) {
        if (node.type == "ExportNamedDeclaration" && node.declaration?.type === "VariableDeclaration" && node.declaration?.kind === "const") {
            const declarations = node.declaration.declarations;
            if (declarations.length !== 1) continue
            const declaration = declarations[0]!;
            if ((declaration.id as Identifier)?.name !== "KyoukaScriptMetadata") continue
            if (declaration.init?.type !== "ObjectExpression") continue
            return parseUserScriptMetadata((declaration.init as ObjectExpression).properties);
        }
    }
    return null
}
function parseUserScriptMetadata(props: (Property | SpreadElement)[]): UserScriptMetadata | null {
    const metadata: Nullable<UserScriptMetadata> = {
        name: null,
        id: null,
        description: null,
        versionCode: null,
        versionName: null,
        scope: []
    }
    Reflect.setPrototypeOf(metadata, null);
    for (const prop of props) {
        if (prop.type !== "Property") continue
        switch (prop.value.type) {
            case "Literal":
                if ((prop.key as Identifier).name in metadata) {
                    metadata[((prop.key as Identifier).name as keyof UserScriptMetadata)] = prop.value.value as any
                }
                break
            case "ArrayExpression":
                if ((prop.key as Identifier).name in metadata) {
                    const tempArray: string[] = []
                    for (const element of (prop.value as ArrayExpression).elements) {
                        // 目前只有scope这个属性是数组
                        if (!element || element.type !== "Literal" || typeof element.type !== "string") continue
                        tempArray.push(element.value as string)
                    }
                    metadata[((prop.key as Identifier).name as keyof UserScriptMetadata)] = tempArray as any
                }
                break
        }
    }
    for (const prop of Reflect.ownKeys(metadata)) {
        if (metadata[prop as keyof UserScriptMetadata] === null) {
            return null
        }
    }
    return metadata as UserScriptMetadata
}