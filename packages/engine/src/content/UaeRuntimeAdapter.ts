import type { ActorAnimationSetData, ActorData } from "../actor/ActorData";
import type { AssetDefinitions } from "../assets/AssetCatalog";
import type {
    DialogueData,
    DialogueNodeData,
    DialogueOptionData
} from "../dialogue/DialogueData";
import { RenderLayer } from "../graphics/RenderLayer";
import type { IntroData, IntroScreenData } from "../intro/IntroData";
import type { DefaultVerb } from "../interaction/DefaultVerb";
import type { InteractionAction } from "../interaction/InteractionAction";
import type { VerbInteractionData } from "../interaction/VerbInteractionData";
import type { InventoryItemData } from "../inventory/InventoryItemData";
import type { GameCondition, GameEffect } from "../rules/GameRuleData";
import type { RoomData } from "../room/RoomData";
import type { ActionSequenceData, ActionSequenceStep } from "../sequence/ActionSequenceData";
import type { GameStateData } from "../state/GameStateData";
import type { VerbData } from "../verb/VerbData";

import type {
    UaeCondition,
    UaeDefaultVerb,
    UaeEffect,
    UaeEntityData,
    UaeGameManifest,
    UaeInteractionAction,
    UaeIntroData,
    UaeLoadedGame,
    UaeRuntimeSceneData,
    UaeSceneDocument,
    UaeSequenceAction
} from "./UaeContentTypes";

export class UaeRuntimeAdapter {
    public adapt(
        manifest: UaeGameManifest,
        scene: UaeSceneDocument,
        requiredAssetIds: string[]
    ): UaeLoadedGame {
        const runtimeScene = this.adaptScene(scene);

        return {
            id: manifest.id,
            title: manifest.title,
            resolution: {...manifest.resolution},
            assets: this.adaptAssets(manifest),
            requiredAssetIds,
            verbs: this.adaptVerbs(manifest),
            items: manifest.items.map((item) => ({
                id: item.id,
                name: item.displayName,
                description: item.description,
                defaultVerb: this.adaptDefaultVerb(item.defaultVerb),
                icon: item.icon ? {
                    assetId: item.icon.asset,
                    width: item.icon.width,
                    height: item.icon.height
                } : undefined
            } satisfies InventoryItemData)),
            initialInventoryItemIds: [...manifest.initialInventory],
            initialState: this.adaptInitialState(manifest),
            intro: this.adaptIntro(manifest),
            initialScene: runtimeScene
        };
    }

    public adaptScene(scene: UaeSceneDocument): UaeRuntimeSceneData {
        const actors = scene.entities
            .filter((entity) => entity.kind === "actor")
            .map((entity) => this.adaptActor(entity));
        const actorNames = new Map(actors.map((actor) => [actor.id, actor.name]));

        return {
            id: scene.id,
            rooms: [this.adaptRoom(scene)],
            initialRoomId: scene.room.id,
            actors,
            interactions: scene.interactions.map((interaction) => ({
                verb: interaction.verb,
                targetId: interaction.target,
                conditions: interaction.conditions?.map((condition) => this.adaptCondition(condition)),
                effects: interaction.effects?.map((effect) => this.adaptEffect(effect)),
                interaction: this.adaptInteractionAction(interaction.action)
            } satisfies VerbInteractionData)),
            dialogues: scene.dialogues.map((dialogue) => ({
                id: dialogue.id,
                player: {
                    id: dialogue.player,
                    name: actorNames.get(dialogue.player) ?? dialogue.player
                },
                npc: {
                    id: dialogue.npc,
                    name: actorNames.get(dialogue.npc) ?? dialogue.npc
                },
                startNodeId: dialogue.start,
                nodes: Object.entries(dialogue.nodes).map(([nodeId, node]) => ({
                    id: nodeId,
                    options: node.options.map((option) => this.adaptDialogueOption(option))
                } satisfies DialogueNodeData))
            } satisfies DialogueData)),
            sequences: scene.sequences.map((sequence) => ({
                id: sequence.id,
                actions: sequence.actions.map((action) => this.adaptSequenceAction(action))
            } satisfies ActionSequenceData)),
            controlledActorId: scene.controlledActor,
            entry: scene.entry ? {
                sequenceId: scene.entry.sequence,
                once: scene.entry.once ?? false
            } : null
        };
    }

    private adaptAssets(manifest: UaeGameManifest): AssetDefinitions {
        return Object.fromEntries(
            Object.entries(manifest.assets).map(([id, path]) => [
                id,
                this.joinAssetPath(manifest.assetBasePath, path)
            ])
        );
    }

    private adaptVerbs(manifest: UaeGameManifest): VerbData[] {
        return manifest.verbs.map((verb) => ({
            id: verb.id,
            label: verb.label,
            isDefault: verb.default
        }));
    }

    private adaptInitialState(manifest: UaeGameManifest): GameStateData {
        return Object.fromEntries(
            Object.entries(manifest.state)
                .filter(([, declaration]) => declaration.initial !== undefined)
                .map(([key, declaration]) => [key, declaration.initial])
        ) as GameStateData;
    }

    private adaptIntro(manifest: UaeGameManifest): IntroData | null {
        if (!manifest.start.intro) return null;
        const intro = manifest.intros.find((candidate) => candidate.id === manifest.start.intro);

        if (!intro) return null;

        return {
            backgroundColor: intro.backgroundColor,
            textColor: intro.textColor,
            screens: intro.screens.map((screen) => this.adaptIntroScreen(screen as UaeIntroData["screens"][number]))
        };
    }

    private adaptIntroScreen(screen: Record<string, unknown>): IntroScreenData {
        if (screen.type === "text") {
            return {
                type: "text",
                text: String(screen.text),
                durationMs: Number(screen.durationMs),
                fontSize: screen.fontSize === undefined ? undefined : Number(screen.fontSize),
                lineHeight: screen.lineHeight === undefined ? undefined : Number(screen.lineHeight)
            };
        }

        return {
            type: "image",
            assetId: String(screen.asset),
            durationMs: Number(screen.durationMs),
            aspectRatio: screen.aspectRatio === undefined ? undefined : Number(screen.aspectRatio),
            caption: screen.caption === undefined ? undefined : String(screen.caption)
        };
    }

    private adaptActor(entity: UaeEntityData): ActorData {
        const animations = entity.visual.animations;
        const size = entity.visual.size;
        const position = entity.position;

        if (!animations || !size || !position) {
            throw new Error(`Validated actor is incomplete: ${entity.id}`);
        }

        const animationData: ActorAnimationSetData = {
            sourceFacing: animations.sourceFacing,
            idle: {
                frameAssetIds: animations.idle.frames,
                frameDurationMs: animations.idle.frameDurationMs
            },
            walk: animations.walk ? {
                frameAssetIds: animations.walk.frames,
                frameDurationMs: animations.walk.frameDurationMs
            } : undefined
        };

        return {
            id: entity.id,
            name: entity.displayName,
            x: position.x,
            y: position.y,
            width: size.width,
            height: size.height,
            speechColor: entity.speechColor,
            walkSpeedPixelsPerSecond: entity.walkSpeedPixelsPerSecond,
            initialFacing: entity.initialFacing,
            animations: animationData
        };
    }

    private adaptRoom(scene: UaeSceneDocument): RoomData {
        const visuals = scene.room.visuals.map((visual) => ({
            id: visual.id,
            x: visual.bounds.x,
            y: visual.bounds.y,
            width: visual.bounds.width,
            height: visual.bounds.height,
            imageAssetId: visual.asset,
            alpha: visual.alpha,
            depthY: visual.depthY,
            layer: visual.layer ? this.adaptLayer(visual.layer) : undefined
        }));
        const hotspots: RoomData["hotspots"] = [];

        for (const entity of scene.entities) {
            if (entity.kind === "object") {
                const bounds = entity.visual.bounds;
                if (!bounds) throw new Error(`Validated object has no bounds: ${entity.id}`);
                visuals.push({
                    id: `${entity.id}-visual`,
                    x: bounds.x,
                    y: bounds.y,
                    width: bounds.width,
                    height: bounds.height,
                    imageAssetId: entity.visual.asset,
                    alpha: undefined,
                    depthY: entity.depthY,
                    layer: undefined
                });
            }

            if (entity.hotspot !== undefined) {
                const bounds = entity.hotspot === true
                    ? entity.visual.bounds
                    : entity.hotspot.bounds;
                if (!bounds) throw new Error(`Validated hotspot has no bounds: ${entity.id}`);
                hotspots.push({
                    id: entity.id,
                    name: entity.displayName,
                    actorId: entity.kind === "actor" ? entity.id : undefined,
                    ...bounds,
                    interactionPosition: entity.interactionPosition,
                    defaultVerb: this.adaptDefaultVerb(entity.defaultVerb)
                });
            }
        }

        return {
            id: scene.room.id,
            name: scene.room.name,
            visuals,
            hotspots,
            walkableArea: scene.room.walkableArea as unknown as RoomData["walkableArea"]
        };
    }

    private adaptDialogueOption(option: {
        id: string;
        playerLine: string;
        npcLine?: string;
        playerClosingLine?: string;
        conditions?: UaeCondition[];
        effects?: UaeEffect[];
        goto?: string;
        endDialogue?: boolean;
    }): DialogueOptionData {
        return {
            id: option.id,
            playerLine: option.playerLine,
            npcLine: option.npcLine,
            playerClosingLine: option.playerClosingLine,
            conditions: option.conditions?.map((condition) => this.adaptCondition(condition)),
            effects: option.effects?.map((effect) => this.adaptEffect(effect)),
            gotoNodeId: option.goto,
            endsConversation: option.endDialogue
        };
    }

    private adaptCondition(condition: UaeCondition): GameCondition {
        return condition.type === "state"
            ? {...condition}
            : {type: "hasItem", itemId: condition.item, value: condition.value};
    }

    private adaptEffect(effect: UaeEffect): GameEffect {
        return effect.type === "setState"
            ? {...effect}
            : {type: "giveItem", itemId: effect.item};
    }

    private adaptDefaultVerb(defaultVerb: UaeDefaultVerb | undefined): DefaultVerb | undefined {
        if (!defaultVerb || typeof defaultVerb === "string") return defaultVerb;
        return defaultVerb.map((candidate) => ({
            verb: candidate.verb,
            conditions: candidate.conditions?.map((condition) => this.adaptCondition(condition))
        }));
    }

    private adaptInteractionAction(action: UaeInteractionAction): InteractionAction {
        switch (action.type) {
            case "message": return {type: "message", message: action.text};
            case "say": return {type: "say", actorId: action.actor, message: action.text};
            case "startDialogue": return {type: "startDialogue", dialogueId: action.dialogue};
            case "triggerSequence": return {type: "triggerAction", actionId: action.sequence};
        }
    }

    private adaptSequenceAction(action: UaeSequenceAction): ActionSequenceStep {
        switch (action.type) {
            case "wait": return {...action};
            case "say": return {type: "say", actorId: action.actor, message: action.text};
            case "moveTo": return {type: "moveTo", actorId: action.actor, x: action.x, y: action.y, durationMs: action.durationMs};
            case "moveBySteps": return {type: "moveBySteps", actorId: action.actor, steps: action.steps, deltaX: action.deltaX, deltaY: action.deltaY, stepDurationMs: action.stepDurationMs};
            case "showTitle": return {...action};
            case "endScene": return {type: "endScene"};
        }
    }

    private adaptLayer(layer: "background" | "roomBackground" | "roomObject" | "roomForeground"): number {
        const layers = {
            background: RenderLayer.Background,
            roomBackground: RenderLayer.RoomBackground,
            roomObject: RenderLayer.RoomObject,
            roomForeground: RenderLayer.RoomForeground
        };
        return layers[layer];
    }

    private joinAssetPath(basePath: string, path: string): string {
        return `${basePath.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
    }
}
