import { existsSync, readFileSync } from "node:fs";
import { resolve, sep } from "node:path";

import { parseDocument } from "yaml";

interface AssetManifest {
    assetBasePath?: unknown;
    assets?: unknown;
}

export function validateUaeAssetFiles(
    manifestFile: string,
    publicDirectory: string
): void {
    const document = parseDocument(
        readFileSync(manifestFile, "utf8"),
        {prettyErrors: true, strict: true, uniqueKeys: true}
    );

    if (document.errors.length > 0) {
        throw new Error(`${manifestFile}: ${document.errors[0]?.message ?? "invalid YAML"}`);
    }

    const manifest = document.toJS() as AssetManifest;

    if (typeof manifest.assetBasePath !== "string" ||
        !manifest.assets ||
        typeof manifest.assets !== "object" ||
        Array.isArray(manifest.assets)) {
        throw new Error(`${manifestFile}: assetBasePath and assets are required`);
    }

    const publicRoot = resolve(publicDirectory);
    const assetBasePath = manifest.assetBasePath.replace(/^\.\//, "");

    for (const [assetId, relativePath] of Object.entries(manifest.assets)) {
        if (typeof relativePath !== "string") {
            throw new Error(`${manifestFile}:$.assets.${assetId}: expected a path string`);
        }

        const physicalPath = resolve(publicRoot, assetBasePath, relativePath);

        if (physicalPath !== publicRoot &&
            !physicalPath.startsWith(`${publicRoot}${sep}`)) {
            throw new Error(`${manifestFile}:$.assets.${assetId}: path escapes public directory`);
        }

        if (!existsSync(physicalPath)) {
            throw new Error(
                `${manifestFile}:$.assets.${assetId}: asset file not found: ${physicalPath}`
            );
        }
    }
}
