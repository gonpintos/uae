import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

import { validateUaeAssetFiles } from "./build/validateUaeAssets";

const manifestFile = fileURLToPath(
    new URL("../../game/content/game.uae.yaml", import.meta.url)
);

export default defineConfig({
    base: "./",
    plugins: [{
        name: "validate-uae-assets",
        apply: "build",
        buildStart: () => {
            validateUaeAssetFiles(
                manifestFile,
                fileURLToPath(new URL("./public", import.meta.url))
            );
        }
    }],
    build: {
        emptyOutDir: true
    }
});
