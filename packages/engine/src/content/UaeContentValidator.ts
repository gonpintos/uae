import { UaeContentError } from "./UaeContentError";
import {
    type UaeCondition,
    type UaeDefaultVerb,
    type UaeEffect,
    type UaeGameManifest,
    type UaeSceneDocument,
    type UaeSourceText
} from "./UaeContentTypes";
import { isRecord } from "./UaeYamlParser";

const idPattern = /^[a-z][A-Za-z0-9]*(?:-[a-z0-9]+)*$/;

export interface ValidatedUaeScene {
    document: UaeSceneDocument;
    source: UaeSourceText;
}

export class UaeContentValidator {
    public validateManifest(value: unknown, source: UaeSourceText): UaeGameManifest {
        const root = this.record(value, source, "$", "manifest");

        this.literal(root.format, "uae-game", source, "$.format");
        this.literal(root.version, 1, source, "$.version");
        this.id(root.id, source, "$.id");
        this.string(root.title, source, "$.title");

        const resolution = this.record(root.resolution, source, "$.resolution");
        this.positiveNumber(resolution.width, source, "$.resolution.width");
        this.positiveNumber(resolution.height, source, "$.resolution.height");

        const start = this.record(root.start, source, "$.start");
        this.id(start.scene, source, "$.start.scene");
        if (start.intro !== undefined) this.id(start.intro, source, "$.start.intro");

        const scenes = this.array(root.scenes, source, "$.scenes");
        scenes.forEach((entry, index) => {
            const path = `$.scenes[${index}]`;
            const record = this.record(entry, source, path);
            this.id(record.id, source, `${path}.id`);
            this.string(record.source, source, `${path}.source`);
        });
        this.uniqueIds(scenes, source, "$.scenes");

        this.string(root.assetBasePath, source, "$.assetBasePath");
        const assets = this.record(root.assets, source, "$.assets");
        for (const [assetId, assetPath] of Object.entries(assets)) {
            this.id(assetId, source, `$.assets.${assetId}`);
            this.string(assetPath, source, `$.assets.${assetId}`);
        }

        const verbs = this.array(root.verbs, source, "$.verbs");
        verbs.forEach((entry, index) => {
            const path = `$.verbs[${index}]`;
            const record = this.record(entry, source, path);
            this.id(record.id, source, `${path}.id`);
            this.string(record.label, source, `${path}.label`);
            if (record.default !== undefined) this.boolean(record.default, source, `${path}.default`);
        });
        this.uniqueIds(verbs, source, "$.verbs");
        if (verbs.filter((entry) => isRecord(entry) && entry.default === true).length !== 1) {
            this.fail(source, "$.verbs", "expected exactly one default verb");
        }

        const items = this.array(root.items, source, "$.items");
        items.forEach((entry, index) => this.validateItem(entry, source, `$.items[${index}]`));
        this.uniqueIds(items, source, "$.items");

        this.array(root.initialInventory, source, "$.initialInventory").forEach(
            (item, index) => this.id(item, source, `$.initialInventory[${index}]`)
        );

        const state = this.record(root.state, source, "$.state");
        for (const [key, declaration] of Object.entries(state)) {
            this.id(key, source, `$.state.${key}`);
            const record = this.record(declaration, source, `$.state.${key}`);
            this.oneOf(record.type, ["boolean", "number", "string"], source, `$.state.${key}.type`);
            if (record.initial !== undefined) {
                this.stateValue(record.initial, source, `$.state.${key}.initial`);
                if (typeof record.initial !== record.type) {
                    this.fail(source, `$.state.${key}.initial`, `expected ${String(record.type)}`);
                }
            }
        }

        const intros = this.array(root.intros, source, "$.intros");
        intros.forEach((entry, index) => this.validateIntro(entry, source, `$.intros[${index}]`));
        this.uniqueIds(intros, source, "$.intros");

        return root as unknown as UaeGameManifest;
    }

    public validateScene(value: unknown, source: UaeSourceText): UaeSceneDocument {
        const root = this.record(value, source, "$", "scene");

        this.literal(root.format, "uae-scene", source, "$.format");
        this.literal(root.version, 1, source, "$.version");
        this.id(root.id, source, "$.id");
        this.string(root.name, source, "$.name");
        this.id(root.controlledActor, source, "$.controlledActor");

        if (root.entry !== undefined) {
            const entry = this.record(root.entry, source, "$.entry");
            this.id(entry.sequence, source, "$.entry.sequence");
            if (entry.once !== undefined) this.boolean(entry.once, source, "$.entry.once");
        }

        this.validateRoom(root.room, source);

        const entities = this.array(root.entities, source, "$.entities");
        entities.forEach((entry, index) => this.validateEntity(entry, source, `$.entities[${index}]`));
        this.uniqueIds(entities, source, "$.entities");

        const interactions = this.array(root.interactions, source, "$.interactions");
        interactions.forEach((entry, index) => this.validateInteraction(entry, source, `$.interactions[${index}]`));

        const dialogues = this.array(root.dialogues, source, "$.dialogues");
        dialogues.forEach((entry, index) => this.validateDialogue(entry, source, `$.dialogues[${index}]`));
        this.uniqueIds(dialogues, source, "$.dialogues");

        const sequences = this.array(root.sequences, source, "$.sequences");
        sequences.forEach((entry, index) => this.validateSequence(entry, source, `$.sequences[${index}]`));
        this.uniqueIds(sequences, source, "$.sequences");

        return root as unknown as UaeSceneDocument;
    }

    public validateReferences(
        manifest: UaeGameManifest,
        manifestSource: UaeSourceText,
        scenes: readonly ValidatedUaeScene[]
    ): void {
        const sceneIds = new Set(manifest.scenes.map((entry) => entry.id));
        const introIds = new Set(manifest.intros.map((intro) => intro.id));
        const assetIds = new Set(Object.keys(manifest.assets));
        const verbIds = new Set(manifest.verbs.map((verb) => verb.id));
        const itemIds = new Set(manifest.items.map((item) => item.id));
        const stateKeys = new Set(Object.keys(manifest.state));

        this.reference(sceneIds, manifest.start.scene, manifestSource, "$.start.scene", "scene");
        if (manifest.start.intro) this.reference(introIds, manifest.start.intro, manifestSource, "$.start.intro", "intro");

        manifest.intros.forEach((intro, introIndex) => {
            intro.screens.forEach((screen, screenIndex) => {
                if (screen.type === "image") {
                    this.reference(assetIds, String(screen.asset), manifestSource, `$.intros[${introIndex}].screens[${screenIndex}].asset`, "asset");
                }
            });
        });

        manifest.items.forEach((item, index) => {
            if (item.icon) this.reference(assetIds, item.icon.asset, manifestSource, `$.items[${index}].icon.asset`, "asset");
            this.validateDefaultVerbReferences(item.defaultVerb, verbIds, stateKeys, itemIds, manifest, manifestSource, `$.items[${index}].defaultVerb`);
        });
        manifest.initialInventory.forEach((item, index) =>
            this.reference(itemIds, item, manifestSource, `$.initialInventory[${index}]`, "item")
        );

        const registrations = new Map(manifest.scenes.map((entry) => [entry.id, entry]));
        for (const scene of scenes) {
            const registration = registrations.get(scene.document.id);
            if (!registration) this.fail(scene.source, "$.id", `scene '${scene.document.id}' is not registered`);
            this.validateSceneReferences(scene, manifest, assetIds, verbIds, itemIds, stateKeys);
        }

        for (const registration of manifest.scenes) {
            if (!scenes.some((scene) => scene.document.id === registration.id)) {
                this.fail(manifestSource, "$.scenes", `scene source was not loaded: '${registration.id}'`);
            }
        }
    }

    private validateSceneReferences(
        validated: ValidatedUaeScene,
        manifest: UaeGameManifest,
        assetIds: Set<string>,
        verbIds: Set<string>,
        itemIds: Set<string>,
        stateKeys: Set<string>
    ): void {
        const {document: scene, source} = validated;
        const entities = new Map(scene.entities.map((entity) => [entity.id, entity]));
        const actors = new Set(scene.entities.filter((entity) => entity.kind === "actor").map((entity) => entity.id));
        const dialogues = new Set(scene.dialogues.map((dialogue) => dialogue.id));
        const sequences = new Set(scene.sequences.map((sequence) => sequence.id));

        this.reference(actors, scene.controlledActor, source, "$.controlledActor", "actor");
        if (scene.entry) this.reference(sequences, scene.entry.sequence, source, "$.entry.sequence", "sequence");

        scene.room.visuals.forEach((visual, index) => {
            if (visual.asset) this.reference(assetIds, visual.asset, source, `$.room.visuals[${index}].asset`, "asset");
        });

        scene.entities.forEach((entity, index) => {
            const path = `$.entities[${index}]`;
            if (itemIds.has(entity.id)) this.fail(source, `${path}.id`, `entity id conflicts with item target '${entity.id}'`);
            if (entity.visual.asset) this.reference(assetIds, entity.visual.asset, source, `${path}.visual.asset`, "asset");
            for (const clipName of ["idle", "walk"] as const) {
                const clip = entity.visual.animations?.[clipName];
                clip?.frames.forEach((asset, frameIndex) =>
                    this.reference(assetIds, asset, source, `${path}.visual.animations.${clipName}.frames[${frameIndex}]`, "asset")
                );
            }
            this.validateDefaultVerbReferences(entity.defaultVerb, verbIds, stateKeys, itemIds, manifest, source, `${path}.defaultVerb`);
        });

        scene.interactions.forEach((interaction, index) => {
            const path = `$.interactions[${index}]`;
            this.reference(verbIds, interaction.verb, source, `${path}.verb`, "verb");
            const targetEntity = entities.get(interaction.target);
            if (!itemIds.has(interaction.target) && !targetEntity) {
                this.fail(source, `${path}.target`, `unknown target '${interaction.target}'`);
            }
            if (targetEntity && targetEntity.hotspot === undefined) {
                this.fail(source, `${path}.target`, `entity target has no hotspot: '${interaction.target}'`);
            }
            this.validateRuleReferences(interaction.conditions, interaction.effects, manifest, itemIds, stateKeys, source, path);
            if (interaction.action.type === "say") this.reference(actors, interaction.action.actor, source, `${path}.action.actor`, "actor");
            if (interaction.action.type === "startDialogue") this.reference(dialogues, interaction.action.dialogue, source, `${path}.action.dialogue`, "dialogue");
            if (interaction.action.type === "triggerSequence") this.reference(sequences, interaction.action.sequence, source, `${path}.action.sequence`, "sequence");
        });

        scene.dialogues.forEach((dialogue, dialogueIndex) => {
            const path = `$.dialogues[${dialogueIndex}]`;
            this.reference(actors, dialogue.player, source, `${path}.player`, "actor");
            this.reference(actors, dialogue.npc, source, `${path}.npc`, "actor");
            const nodes = new Set(Object.keys(dialogue.nodes));
            this.reference(nodes, dialogue.start, source, `${path}.start`, "dialogue node");
            const optionIds = new Set<string>();
            for (const [nodeId, node] of Object.entries(dialogue.nodes)) {
                node.options.forEach((option, optionIndex) => {
                    const optionPath = `${path}.nodes.${nodeId}.options[${optionIndex}]`;
                    if (optionIds.has(option.id)) this.fail(source, `${optionPath}.id`, `duplicate dialogue option id '${option.id}'`);
                    optionIds.add(option.id);
                    if (option.goto) this.reference(nodes, option.goto, source, `${optionPath}.goto`, "dialogue node");
                    this.validateRuleReferences(option.conditions, option.effects, manifest, itemIds, stateKeys, source, optionPath);
                });
            }
        });

        scene.sequences.forEach((sequence, sequenceIndex) => {
            sequence.actions.forEach((action, actionIndex) => {
                if ("actor" in action) {
                    this.reference(actors, action.actor, source, `$.sequences[${sequenceIndex}].actions[${actionIndex}].actor`, "actor");
                }
            });
        });
    }

    private validateItem(value: unknown, source: UaeSourceText, path: string): void {
        const item = this.record(value, source, path);
        this.id(item.id, source, `${path}.id`);
        this.string(item.displayName, source, `${path}.displayName`);
        if (item.description !== undefined) this.string(item.description, source, `${path}.description`);
        if (item.defaultVerb !== undefined) this.validateDefaultVerb(item.defaultVerb, source, `${path}.defaultVerb`);
        if (item.icon !== undefined) {
            const icon = this.record(item.icon, source, `${path}.icon`);
            this.id(icon.asset, source, `${path}.icon.asset`);
            this.positiveNumber(icon.width, source, `${path}.icon.width`);
            this.positiveNumber(icon.height, source, `${path}.icon.height`);
        }
    }

    private validateIntro(value: unknown, source: UaeSourceText, path: string): void {
        const intro = this.record(value, source, path);
        this.id(intro.id, source, `${path}.id`);
        if (intro.backgroundColor !== undefined) this.string(intro.backgroundColor, source, `${path}.backgroundColor`);
        if (intro.textColor !== undefined) this.string(intro.textColor, source, `${path}.textColor`);
        const screens = this.array(intro.screens, source, `${path}.screens`);
        if (screens.length === 0) this.fail(source, `${path}.screens`, "expected at least one screen");
        screens.forEach((value, index) => {
            const screenPath = `${path}.screens[${index}]`;
            const screen = this.record(value, source, screenPath);
            this.oneOf(screen.type, ["text", "image"], source, `${screenPath}.type`);
            this.positiveNumber(screen.durationMs, source, `${screenPath}.durationMs`);
            if (screen.type === "text") {
                this.string(screen.text, source, `${screenPath}.text`);
                if (screen.fontSize !== undefined) this.positiveNumber(screen.fontSize, source, `${screenPath}.fontSize`);
                if (screen.lineHeight !== undefined) this.positiveNumber(screen.lineHeight, source, `${screenPath}.lineHeight`);
            }
            if (screen.type === "image") {
                this.id(screen.asset, source, `${screenPath}.asset`);
                if (screen.aspectRatio !== undefined) this.positiveNumber(screen.aspectRatio, source, `${screenPath}.aspectRatio`);
                if (screen.caption !== undefined) this.string(screen.caption, source, `${screenPath}.caption`);
            }
        });
    }

    private validateRoom(value: unknown, source: UaeSourceText): void {
        const room = this.record(value, source, "$.room");
        this.id(room.id, source, "$.room.id");
        this.string(room.name, source, "$.room.name");
        const visuals = this.array(room.visuals, source, "$.room.visuals");
        visuals.forEach((entry, index) => {
            const path = `$.room.visuals[${index}]`;
            const visual = this.record(entry, source, path);
            this.id(visual.id, source, `${path}.id`);
            if (visual.asset !== undefined) this.id(visual.asset, source, `${path}.asset`);
            this.bounds(visual.bounds, source, `${path}.bounds`);
            if (visual.layer !== undefined) this.oneOf(visual.layer, ["background", "roomBackground", "roomObject", "roomForeground"], source, `${path}.layer`);
            if (visual.depthY !== undefined) this.number(visual.depthY, source, `${path}.depthY`);
            if (visual.alpha !== undefined) {
                this.number(visual.alpha, source, `${path}.alpha`);
                if (visual.alpha < 0 || visual.alpha > 1) this.fail(source, `${path}.alpha`, "expected a number between 0 and 1");
            }
        });
        this.uniqueIds(visuals, source, "$.room.visuals");
        const area = this.record(room.walkableArea, source, "$.room.walkableArea");
        this.oneOf(area.type ?? "rectangle", ["rectangle", "polygon"], source, "$.room.walkableArea.type");
        if (area.type === "polygon") {
            const points = this.array(area.points, source, "$.room.walkableArea.points");
            if (points.length < 3) this.fail(source, "$.room.walkableArea.points", "expected at least three points");
            points.forEach((point, index) => this.point(point, source, `$.room.walkableArea.points[${index}]`));
        } else {
            this.bounds(area, source, "$.room.walkableArea");
        }
    }

    private validateEntity(value: unknown, source: UaeSourceText, path: string): void {
        const entity = this.record(value, source, path);
        this.id(entity.id, source, `${path}.id`);
        this.oneOf(entity.kind, ["actor", "object"], source, `${path}.kind`);
        this.string(entity.displayName, source, `${path}.displayName`);
        if (entity.speechColor !== undefined) this.string(entity.speechColor, source, `${path}.speechColor`);
        if (entity.walkSpeedPixelsPerSecond !== undefined) this.positiveNumber(entity.walkSpeedPixelsPerSecond, source, `${path}.walkSpeedPixelsPerSecond`);
        if (entity.initialFacing !== undefined) this.oneOf(entity.initialFacing, ["left", "right"], source, `${path}.initialFacing`);
        if (entity.depthY !== undefined) this.number(entity.depthY, source, `${path}.depthY`);
        const visual = this.record(entity.visual, source, `${path}.visual`);
        if (entity.kind === "actor") {
            this.point(entity.position, source, `${path}.position`);
            const size = this.record(visual.size, source, `${path}.visual.size`);
            this.positiveNumber(size.width, source, `${path}.visual.size.width`);
            this.positiveNumber(size.height, source, `${path}.visual.size.height`);
            const animations = this.record(visual.animations, source, `${path}.visual.animations`);
            if (animations.sourceFacing !== undefined) this.oneOf(animations.sourceFacing, ["left", "right"], source, `${path}.visual.animations.sourceFacing`);
            this.validateAnimationClip(animations.idle, source, `${path}.visual.animations.idle`);
            if (animations.walk !== undefined) this.validateAnimationClip(animations.walk, source, `${path}.visual.animations.walk`);
        } else {
            this.id(visual.asset, source, `${path}.visual.asset`);
            this.bounds(visual.bounds, source, `${path}.visual.bounds`);
        }
        if (entity.hotspot !== undefined && entity.hotspot !== true) {
            const hotspot = this.record(entity.hotspot, source, `${path}.hotspot`);
            this.bounds(hotspot.bounds, source, `${path}.hotspot.bounds`);
        }
        if ((entity.defaultVerb !== undefined || entity.interactionPosition !== undefined) && entity.hotspot === undefined) {
            this.fail(source, path, "defaultVerb and interactionPosition require a hotspot");
        }
        if (entity.defaultVerb !== undefined) this.validateDefaultVerb(entity.defaultVerb, source, `${path}.defaultVerb`);
        if (entity.interactionPosition !== undefined) this.point(entity.interactionPosition, source, `${path}.interactionPosition`);
    }

    private validateAnimationClip(value: unknown, source: UaeSourceText, path: string): void {
        const clip = this.record(value, source, path);
        const frames = this.array(clip.frames, source, `${path}.frames`);
        if (frames.length === 0) this.fail(source, `${path}.frames`, "expected at least one frame");
        frames.forEach((frame, index) => this.id(frame, source, `${path}.frames[${index}]`));
        if (clip.frameDurationMs !== undefined) this.positiveNumber(clip.frameDurationMs, source, `${path}.frameDurationMs`);
    }

    private validateInteraction(value: unknown, source: UaeSourceText, path: string): void {
        const interaction = this.record(value, source, path);
        this.id(interaction.verb, source, `${path}.verb`);
        this.id(interaction.target, source, `${path}.target`);
        this.validateConditions(interaction.conditions, source, `${path}.conditions`);
        this.validateEffects(interaction.effects, source, `${path}.effects`);
        const action = this.record(interaction.action, source, `${path}.action`);
        this.oneOf(action.type, ["message", "say", "startDialogue", "triggerSequence"], source, `${path}.action.type`);
        if (action.type === "message") this.string(action.text, source, `${path}.action.text`);
        if (action.type === "say") {
            this.id(action.actor, source, `${path}.action.actor`);
            this.string(action.text, source, `${path}.action.text`);
        }
        if (action.type === "startDialogue") this.id(action.dialogue, source, `${path}.action.dialogue`);
        if (action.type === "triggerSequence") this.id(action.sequence, source, `${path}.action.sequence`);
    }

    private validateDialogue(value: unknown, source: UaeSourceText, path: string): void {
        const dialogue = this.record(value, source, path);
        this.id(dialogue.id, source, `${path}.id`);
        this.id(dialogue.player, source, `${path}.player`);
        this.id(dialogue.npc, source, `${path}.npc`);
        this.id(dialogue.start, source, `${path}.start`);
        const nodes = this.record(dialogue.nodes, source, `${path}.nodes`);
        if (Object.keys(nodes).length === 0) this.fail(source, `${path}.nodes`, "expected at least one node");
        for (const [nodeId, nodeValue] of Object.entries(nodes)) {
            this.id(nodeId, source, `${path}.nodes.${nodeId}`);
            const node = this.record(nodeValue, source, `${path}.nodes.${nodeId}`);
            const options = this.array(node.options, source, `${path}.nodes.${nodeId}.options`);
            options.forEach((optionValue, index) => {
                const optionPath = `${path}.nodes.${nodeId}.options[${index}]`;
                const option = this.record(optionValue, source, optionPath);
                this.id(option.id, source, `${optionPath}.id`);
                this.string(option.playerLine, source, `${optionPath}.playerLine`);
                if (option.npcLine !== undefined) this.string(option.npcLine, source, `${optionPath}.npcLine`);
                if (option.playerClosingLine !== undefined) this.string(option.playerClosingLine, source, `${optionPath}.playerClosingLine`);
                this.validateConditions(option.conditions, source, `${optionPath}.conditions`);
                this.validateEffects(option.effects, source, `${optionPath}.effects`);
                const flowCount = (option.goto === undefined ? 0 : 1) + (option.endDialogue === true ? 1 : 0);
                if (flowCount !== 1) this.fail(source, optionPath, "expected exactly one of goto or endDialogue: true");
                if (option.goto !== undefined) this.id(option.goto, source, `${optionPath}.goto`);
            });
        }
    }

    private validateSequence(value: unknown, source: UaeSourceText, path: string): void {
        const sequence = this.record(value, source, path);
        this.id(sequence.id, source, `${path}.id`);
        if (sequence.ui !== undefined) this.literal(sequence.ui, "hidden", source, `${path}.ui`);
        const actions = this.array(sequence.actions, source, `${path}.actions`);
        if (actions.length === 0) this.fail(source, `${path}.actions`, "expected at least one action");
        actions.forEach((actionValue, index) => {
            const actionPath = `${path}.actions[${index}]`;
            const action = this.record(actionValue, source, actionPath);
            this.oneOf(action.type, ["wait", "say", "moveTo", "moveBySteps", "showTitle", "endScene"], source, `${actionPath}.type`);
            if (action.type === "wait") this.positiveNumber(action.durationMs, source, `${actionPath}.durationMs`);
            if (action.type === "say") {
                this.id(action.actor, source, `${actionPath}.actor`);
                this.string(action.text, source, `${actionPath}.text`);
            }
            if (action.type === "moveTo") {
                this.id(action.actor, source, `${actionPath}.actor`);
                this.number(action.x, source, `${actionPath}.x`);
                this.number(action.y, source, `${actionPath}.y`);
                if (action.durationMs !== undefined) this.nonNegativeNumber(action.durationMs, source, `${actionPath}.durationMs`);
            }
            if (action.type === "moveBySteps") {
                this.id(action.actor, source, `${actionPath}.actor`);
                this.positiveNumber(action.steps, source, `${actionPath}.steps`);
                this.number(action.deltaX, source, `${actionPath}.deltaX`);
                this.number(action.deltaY, source, `${actionPath}.deltaY`);
                if (action.stepDurationMs !== undefined) this.nonNegativeNumber(action.stepDurationMs, source, `${actionPath}.stepDurationMs`);
            }
            if (action.type === "showTitle") this.string(action.text, source, `${actionPath}.text`);
        });
    }

    private validateConditions(value: unknown, source: UaeSourceText, path: string): void {
        if (value === undefined) return;
        this.array(value, source, path).forEach((condition, index) => {
            const conditionPath = `${path}[${index}]`;
            const record = this.record(condition, source, conditionPath);
            this.oneOf(record.type, ["state", "hasItem"], source, `${conditionPath}.type`);
            if (record.type === "state") {
                this.id(record.key, source, `${conditionPath}.key`);
                this.oneOf(record.operator, ["equals", "notEquals"], source, `${conditionPath}.operator`);
                this.stateValue(record.value, source, `${conditionPath}.value`);
            } else {
                this.id(record.item, source, `${conditionPath}.item`);
                this.boolean(record.value, source, `${conditionPath}.value`);
            }
        });
    }

    private validateEffects(value: unknown, source: UaeSourceText, path: string): void {
        if (value === undefined) return;
        this.array(value, source, path).forEach((effect, index) => {
            const effectPath = `${path}[${index}]`;
            const record = this.record(effect, source, effectPath);
            this.oneOf(record.type, ["setState", "giveItem"], source, `${effectPath}.type`);
            if (record.type === "setState") {
                this.id(record.key, source, `${effectPath}.key`);
                this.stateValue(record.value, source, `${effectPath}.value`);
            } else {
                this.id(record.item, source, `${effectPath}.item`);
            }
        });
    }

    private validateDefaultVerb(value: unknown, source: UaeSourceText, path: string): void {
        if (typeof value === "string") {
            this.id(value, source, path);
            return;
        }
        this.array(value, source, path).forEach((candidate, index) => {
            const candidatePath = `${path}[${index}]`;
            const record = this.record(candidate, source, candidatePath);
            this.id(record.verb, source, `${candidatePath}.verb`);
            this.validateConditions(record.conditions, source, `${candidatePath}.conditions`);
        });
    }

    private validateDefaultVerbReferences(
        value: UaeDefaultVerb | undefined,
        verbs: Set<string>,
        stateKeys: Set<string>,
        itemIds: Set<string>,
        manifest: UaeGameManifest,
        source: UaeSourceText,
        path: string
    ): void {
        if (!value) return;
        if (typeof value === "string") {
            this.reference(verbs, value, source, path, "verb");
            return;
        }
        value.forEach((candidate, index) => {
            this.reference(verbs, candidate.verb, source, `${path}[${index}].verb`, "verb");
            this.validateRuleReferences(candidate.conditions, undefined, manifest, itemIds, stateKeys, source, `${path}[${index}]`);
        });
    }

    private validateRuleReferences(
        conditions: UaeCondition[] | undefined,
        effects: UaeEffect[] | undefined,
        manifest: UaeGameManifest,
        items: Set<string>,
        stateKeys: Set<string>,
        source: UaeSourceText,
        path: string
    ): void {
        conditions?.forEach((condition, index) => {
            if (condition.type === "hasItem") {
                this.reference(items, condition.item, source, `${path}.conditions[${index}].item`, "item");
            } else {
                this.reference(stateKeys, condition.key, source, `${path}.conditions[${index}].key`, "state key");
                this.assertStateType(manifest, condition.key, condition.value, source, `${path}.conditions[${index}].value`);
            }
        });
        effects?.forEach((effect, index) => {
            if (effect.type === "giveItem") {
                this.reference(items, effect.item, source, `${path}.effects[${index}].item`, "item");
            } else {
                this.reference(stateKeys, effect.key, source, `${path}.effects[${index}].key`, "state key");
                this.assertStateType(manifest, effect.key, effect.value, source, `${path}.effects[${index}].value`);
            }
        });
    }

    private assertStateType(manifest: UaeGameManifest, key: string, value: unknown, source: UaeSourceText, path: string): void {
        const declaration = manifest.state[key];
        if (declaration && typeof value !== declaration.type) {
            this.fail(source, path, `state '${key}' expects ${declaration.type}, received ${typeof value}`);
        }
    }

    private point(value: unknown, source: UaeSourceText, path: string): void {
        const point = this.record(value, source, path);
        this.number(point.x, source, `${path}.x`);
        this.number(point.y, source, `${path}.y`);
    }

    private bounds(value: unknown, source: UaeSourceText, path: string): void {
        const bounds = this.record(value, source, path);
        this.number(bounds.x, source, `${path}.x`);
        this.number(bounds.y, source, `${path}.y`);
        this.positiveNumber(bounds.width, source, `${path}.width`);
        this.positiveNumber(bounds.height, source, `${path}.height`);
    }

    private uniqueIds(values: unknown[], source: UaeSourceText, path: string): void {
        const seen = new Set<string>();
        values.forEach((value, index) => {
            const record = this.record(value, source, `${path}[${index}]`);
            const id = String(record.id);
            if (seen.has(id)) this.fail(source, `${path}[${index}].id`, `duplicate id '${id}'`);
            seen.add(id);
        });
    }

    private reference(values: Set<string>, value: string, source: UaeSourceText, path: string, kind: string): void {
        if (!values.has(value)) this.fail(source, path, `unknown ${kind} '${value}'`);
    }

    private record(value: unknown, source: UaeSourceText, path: string, label = "mapping"): Record<string, unknown> {
        if (!isRecord(value)) this.fail(source, path, `expected ${label}`);
        return value;
    }

    private array(value: unknown, source: UaeSourceText, path: string): unknown[] {
        if (!Array.isArray(value)) this.fail(source, path, "expected an array");
        return value;
    }

    private id(value: unknown, source: UaeSourceText, path: string): void {
        this.string(value, source, path);
        if (!idPattern.test(value)) this.fail(source, path, `invalid id '${value}'`);
    }

    private string(value: unknown, source: UaeSourceText, path: string): asserts value is string {
        if (typeof value !== "string" || value.trim() === "") this.fail(source, path, "expected a non-empty string");
    }

    private boolean(value: unknown, source: UaeSourceText, path: string): void {
        if (typeof value !== "boolean") this.fail(source, path, "expected a boolean");
    }

    private number(value: unknown, source: UaeSourceText, path: string): asserts value is number {
        if (typeof value !== "number" || !Number.isFinite(value)) this.fail(source, path, "expected a finite number");
    }

    private positiveNumber(value: unknown, source: UaeSourceText, path: string): void {
        this.number(value, source, path);
        if (value <= 0) this.fail(source, path, "expected a positive number");
    }

    private nonNegativeNumber(value: unknown, source: UaeSourceText, path: string): void {
        this.number(value, source, path);
        if (value < 0) this.fail(source, path, "expected a non-negative number");
    }

    private stateValue(value: unknown, source: UaeSourceText, path: string): void {
        if (typeof value !== "boolean" && typeof value !== "number" && typeof value !== "string") {
            this.fail(source, path, "expected a boolean, number, or string");
        }
    }

    private literal(value: unknown, expected: unknown, source: UaeSourceText, path: string): void {
        if (value !== expected) this.fail(source, path, `expected ${JSON.stringify(expected)}`);
    }

    private oneOf(value: unknown, values: readonly unknown[], source: UaeSourceText, path: string): void {
        if (!values.includes(value)) this.fail(source, path, `expected one of: ${values.join(", ")}`);
    }

    private fail(source: UaeSourceText, path: string, message: string): never {
        throw new UaeContentError(source.fileName, path, message);
    }
}
