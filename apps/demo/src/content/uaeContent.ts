import { UaeGameLoader, type UaeLoadedGame } from "@uae/engine";

import gameManifestYaml from "../../../../game/content/game.uae.yaml?raw";

const sceneYamlModules = import.meta.glob(
    "../../../../game/content/scenes/*.uae.yaml",
    {
        eager: true,
        import: "default",
        query: "?raw"
    }
) as Readonly<Record<string, string>>;

function resolveSceneSources(): Record<string, {fileName: string; text: string}> {
    return Object.fromEntries(
        Object.entries(sceneYamlModules).map(([modulePath, text]) => {
            const marker = "game/content/";
            const markerIndex = modulePath.lastIndexOf(marker);

            if (markerIndex < 0) {
                throw new Error(`Unable to resolve UAE scene module path: ${modulePath}`);
            }

            const contentPath = modulePath.slice(markerIndex + marker.length);

            return [
                `./${contentPath}`,
                {
                    fileName: `game/content/${contentPath}`,
                    text
                }
            ];
        })
    );
}

export function loadUaeContent(): UaeLoadedGame {
    return new UaeGameLoader().load({
        manifest: {
            fileName: "game/content/game.uae.yaml",
            text: gameManifestYaml
        },
        scenes: resolveSceneSources()
    });
}
