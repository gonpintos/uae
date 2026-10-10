import { UaeAssetClosure } from "./UaeAssetClosure";
import type { UaeLoadedGame, UaeSourceText } from "./UaeContentTypes";
import {
    UaeContentValidator,
    type ValidatedUaeScene
} from "./UaeContentValidator";
import { UaeRuntimeAdapter } from "./UaeRuntimeAdapter";
import { UaeYamlParser } from "./UaeYamlParser";
import { UaeContentError } from "./UaeContentError";

export interface UaeGameSources {
    manifest: UaeSourceText;
    scenes: Readonly<Record<string, UaeSourceText>>;
}

export class UaeGameLoader {
    private readonly parser: UaeYamlParser;

    private readonly validator: UaeContentValidator;

    private readonly assets: UaeAssetClosure;

    private readonly adapter: UaeRuntimeAdapter;

    public constructor(
        parser = new UaeYamlParser(),
        validator = new UaeContentValidator(),
        assets = new UaeAssetClosure(),
        adapter = new UaeRuntimeAdapter()
    ) {
        this.parser = parser;
        this.validator = validator;
        this.assets = assets;
        this.adapter = adapter;
    }

    public load(sources: UaeGameSources): UaeLoadedGame {
        const manifest = this.validator.validateManifest(
            this.parser.parse(sources.manifest),
            sources.manifest
        );
        const scenes: ValidatedUaeScene[] = manifest.scenes.map((registration, index) => {
            const source = sources.scenes[registration.source];

            if (!source) {
                throw new UaeContentError(
                    sources.manifest.fileName,
                    `$.scenes[${index}].source`,
                    `scene source was not provided: '${registration.source}'`
                );
            }

            const document = this.validator.validateScene(
                this.parser.parse(source),
                source
            );

            if (document.id !== registration.id) {
                throw new UaeContentError(
                    source.fileName,
                    "$.id",
                    `expected registered scene id '${registration.id}', received '${document.id}'`
                );
            }

            return {document, source};
        });

        this.validator.validateReferences(manifest, sources.manifest, scenes);

        const initialScene = scenes.find(
            (scene) => scene.document.id === manifest.start.scene
        );

        if (!initialScene) {
            throw new UaeContentError(
                sources.manifest.fileName,
                "$.start.scene",
                `initial scene was not loaded: '${manifest.start.scene}'`
            );
        }

        const assetClosure = this.assets.collect(manifest, initialScene.document);

        return this.adapter.adapt(
            manifest,
            initialScene.document,
            assetClosure
        );
    }
}
