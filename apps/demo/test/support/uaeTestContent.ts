import {
    UaeGameLoader,
    type Point,
    type PolygonWalkableArea
} from "../../../../packages/engine/src/index";

declare const require: (id: string) => unknown;
declare const process: {cwd(): string};

const fs = require("node:fs") as {
    readFileSync(path: string, encoding: "utf8"): string;
    readdirSync(path: string): string[];
};
const path = require("node:path") as {
    resolve(...parts: string[]): string;
};

const repositoryRoot = path.resolve(process.cwd(), "../..");
const manifestFileName = "game/content/game.uae.yaml";
const scenesDirectory = "game/content/scenes";

const sceneSources = Object.fromEntries(
    fs.readdirSync(path.resolve(repositoryRoot, scenesDirectory))
        .filter((fileName) => fileName.endsWith(".uae.yaml"))
        .map((fileName) => [
            `./scenes/${fileName}`,
            {
                fileName: `${scenesDirectory}/${fileName}`,
                text: fs.readFileSync(
                    path.resolve(repositoryRoot, scenesDirectory, fileName),
                    "utf8"
                )
            }
        ])
);

export const uaeTestGame = new UaeGameLoader().load({
    manifest: {
        fileName: manifestFileName,
        text: fs.readFileSync(path.resolve(repositoryRoot, manifestFileName), "utf8")
    },
    scenes: sceneSources
});

export const contentAssets = uaeTestGame.assets;
export const contentActors = uaeTestGame.initialScene.actors;
export const contentDialogues = uaeTestGame.initialScene.dialogues;
export const contentInteractions = uaeTestGame.initialScene.interactions;
export const contentItems = uaeTestGame.items;
export const contentRooms = uaeTestGame.initialScene.rooms;
export const contentSequences = uaeTestGame.initialScene.sequences;

if (!uaeTestGame.intro) {
    throw new Error("The official UAE test content must declare its intro.");
}

export const contentIntro = uaeTestGame.intro;

const primaryRoom = contentRooms[0];

if (!primaryRoom || primaryRoom.walkableArea?.type !== "polygon") {
    throw new Error("The official UAE test scene must declare a walkable polygon.");
}

export const contentWalkableArea = primaryRoom.walkableArea as PolygonWalkableArea;
export const contentInteractionPositions: Readonly<Record<string, Point>> =
    Object.fromEntries(
        primaryRoom.hotspots
            .filter((hotspot) => hotspot.interactionPosition !== undefined)
            .map((hotspot) => [hotspot.id, hotspot.interactionPosition as Point])
    );
