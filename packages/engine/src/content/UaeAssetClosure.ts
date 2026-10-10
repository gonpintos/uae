import type {
    UaeCondition,
    UaeDefaultVerb,
    UaeEffect,
    UaeGameManifest,
    UaeSceneDocument
} from "./UaeContentTypes";

export class UaeAssetClosure {
    public collect(
        manifest: UaeGameManifest,
        scene: UaeSceneDocument
    ): string[] {
        const assets = new Set<string>();
        const reachableItems = new Set(manifest.initialInventory);
        const intro = manifest.intros.find(
            (candidate) => candidate.id === manifest.start.intro
        );

        intro?.screens.forEach((screen) => {
            if (screen.type === "image" && typeof screen.asset === "string") {
                assets.add(screen.asset);
            }
        });

        scene.room.visuals.forEach((visual) => {
            if (visual.asset) assets.add(visual.asset);
        });

        scene.entities.forEach((entity) => {
            if (entity.visual.asset) assets.add(entity.visual.asset);
            entity.visual.animations?.idle.frames.forEach((asset) => assets.add(asset));
            entity.visual.animations?.walk?.frames.forEach((asset) => assets.add(asset));
            this.collectDefaultVerbItems(entity.defaultVerb, reachableItems);
        });

        manifest.items.forEach((item) =>
            this.collectDefaultVerbItems(item.defaultVerb, reachableItems)
        );

        scene.interactions.forEach((interaction) => {
            if (manifest.items.some((item) => item.id === interaction.target)) {
                reachableItems.add(interaction.target);
            }
            this.collectRuleItems(interaction.conditions, interaction.effects, reachableItems);
        });

        scene.dialogues.forEach((dialogue) => {
            Object.values(dialogue.nodes).forEach((node) => {
                node.options.forEach((option) =>
                    this.collectRuleItems(option.conditions, option.effects, reachableItems)
                );
            });
        });

        for (const item of manifest.items) {
            if (reachableItems.has(item.id) && item.icon) {
                assets.add(item.icon.asset);
            }
        }

        return [...assets];
    }

    private collectDefaultVerbItems(
        defaultVerb: UaeDefaultVerb | undefined,
        items: Set<string>
    ): void {
        if (!defaultVerb || typeof defaultVerb === "string") return;
        defaultVerb.forEach((candidate) =>
            this.collectRuleItems(candidate.conditions, undefined, items)
        );
    }

    private collectRuleItems(
        conditions: UaeCondition[] | undefined,
        effects: UaeEffect[] | undefined,
        items: Set<string>
    ): void {
        conditions?.forEach((condition) => {
            if (condition.type === "hasItem") items.add(condition.item);
        });
        effects?.forEach((effect) => {
            if (effect.type === "giveItem") items.add(effect.item);
        });
    }
}
