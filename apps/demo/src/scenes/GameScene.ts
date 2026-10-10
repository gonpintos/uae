import {
    ActionSequenceCollection,
    ActionSequenceRunner,
    ActorCollection,
    ActorMovementController,
    ActorRenderer,
    ActorSpeechController,
    ActorSpeechRenderer,
    ClassicAdventureUI,
    containsPoint,
    DialogueCollection,
    DialoguePanel,
    DialoguePresenter,
    DialogueSession,
    DefaultVerbResolver,
    GameCursor,
    GameLayout,
    HotspotDebugRenderer,
    InteractionFacingController,
    InteractionExecutor,
    InteractionPresenter,
    NavigationController,
    NavigationDebugRenderer,
    RoomCollection,
    RoomManager,
    RoomVisualRenderer,
    SceneEntryRegistry,
    ScreenTitle,
    VerbController,
    VerbInteractionCollection,
    type ActionSequenceData,
    type ActorData,
    type DialogueData,
    type DialogueSelectionResult,
    type Hotspot,
    type InteractionResult,
    type PointerButton,
    type Point,
    type RoomData,
    type Scene,
    type SceneContext,
    type VerbId,
    type VerbData,
    type VerbInteractionData
} from "@uae/engine";

export interface GameSceneOptions {
    verbs?: readonly VerbData[];
    sceneId?: string;
    entryOnce?: boolean;
    entryRegistry?: SceneEntryRegistry;
}

export class GameScene implements Scene {
    private readonly actors: ActorCollection;

    private readonly actorRenderer = new ActorRenderer();

    private readonly actorSpeechRenderer = new ActorSpeechRenderer();

    private actorSpeech: ActorSpeechController | null = null;

    private actorMovement: ActorMovementController | null = null;

    private navigation: NavigationController | null = null;

    private readonly sequences: ActionSequenceCollection;

    private sequenceRunner: ActionSequenceRunner | null = null;

    private readonly roomManager: RoomManager;

    private readonly interactions: VerbInteractionCollection;

    private interactionExecutor: InteractionExecutor | null = null;

    private interactionPresenter: InteractionPresenter | null = null;

    private defaultVerbResolver: DefaultVerbResolver | null = null;

    private readonly dialogues: DialogueCollection;

    private dialogueSession: DialogueSession | null = null;

    private dialoguePresenter: DialoguePresenter | null = null;

    private readonly dialoguePanel = new DialoguePanel();

    private readonly hotspotDebugRenderer = new HotspotDebugRenderer();

    private readonly navigationDebugRenderer = new NavigationDebugRenderer();

    private readonly adventureUI: ClassicAdventureUI;

    private readonly cursorRenderer = new GameCursor();

    private readonly layout = new GameLayout();

    private readonly roomVisualRenderer = new RoomVisualRenderer();

    private readonly screenTitleRenderer = new ScreenTitle();

    private screenTitle: string | null = null;

    private message = "";

    private hoveredTargetName: string | null = null;

    private hoveredVerbId: VerbId | null = null;

    private cursorPosition: Point | null = null;

    private readonly verbController: VerbController;

    private sceneEnded = false;

    private classicUIVisible = true;

    private classicUIInteractive = true;

    private readonly controlledActorId: string;

    private readonly initialSequenceId: string | null;

    private readonly sceneId: string;

    private readonly entryOnce: boolean;

    private readonly entryRegistry: SceneEntryRegistry | null;

    private initialSequencePlayed = false;

    private unsubscribePointerDown: (() => void) | null = null;

    private unsubscribePointerMove: (() => void) | null = null;

    private stopCursorAnimation: (() => void) | null = null;

    public constructor(
        roomsData: RoomData[],
        initialRoomId: string,
        dialoguesData: readonly DialogueData[],
        interactionsData: readonly VerbInteractionData[],
        actorsData: readonly ActorData[],
        sequencesData: readonly ActionSequenceData[],
        controlledActorId: string,
        initialSequenceId?: string,
        options: GameSceneOptions = {}
    ) {
        const rooms = new RoomCollection(roomsData);

        this.roomManager = new RoomManager(rooms, initialRoomId);
        this.dialogues = new DialogueCollection(dialoguesData);
        this.interactions = new VerbInteractionCollection(interactionsData);
        this.actors = new ActorCollection(actorsData);
        this.sequences = new ActionSequenceCollection(sequencesData);
        this.controlledActorId = controlledActorId;
        this.initialSequenceId = initialSequenceId ?? null;
        this.sceneId = options.sceneId ?? initialRoomId;
        this.entryOnce = options.entryOnce ?? true;
        this.entryRegistry = options.entryRegistry ?? null;
        this.verbController = new VerbController(options.verbs);
        this.adventureUI = new ClassicAdventureUI({verbs: options.verbs});
    }

    public enter(context: SceneContext): void {
        this.dialogueSession = new DialogueSession(
            this.dialogues,
            context.state,
            context.inventory
        );
        this.interactionExecutor = new InteractionExecutor(
            this.roomManager,
            this.interactions,
            context.state,
            context.inventory
        );
        this.defaultVerbResolver = new DefaultVerbResolver(
            context.state,
            context.inventory
        );
        this.sceneEnded = false;
        this.classicUIVisible = true;
        this.classicUIInteractive = true;
        this.screenTitle = null;
        this.message = "";
        this.hoveredTargetName = null;
        this.hoveredVerbId = null;
        this.cursorPosition = null;
        this.verbController.completeAction();
        this.actorSpeech = new ActorSpeechController(
            this.actors,
            () => {
                this.drawScreen(context);
            }
        );
        this.dialoguePresenter = new DialoguePresenter(
            this.actorSpeech,
            () => {
                this.drawScreen(context);
            }
        );
        this.actorMovement = new ActorMovementController(
            this.actors,
            () => {
                this.drawScreen(context);
            }
        );
        const interactionFacing = new InteractionFacingController(
            this.actors,
            () => {
                this.drawScreen(context);
            }
        );
        this.interactionPresenter = new InteractionPresenter(
            this.getActorSpeech()
        );
        this.navigation = new NavigationController(
            this.roomManager,
            this.actorMovement,
            interactionFacing
        );
        this.sequenceRunner = new ActionSequenceRunner(
            this.sequences,
            this.actors,
            {
                onActorMoved: () => {
                    this.drawScreen(context);
                },
                onSay: (actor, message) =>
                    this.getActorSpeech().say(actor.id, message),
                onShowTitle: (text) => {
                    this.screenTitle = text;
                    this.drawScreen(context);
                },
                onEndScene: () => {
                    this.sceneEnded = true;
                    this.classicUIInteractive = false;
                    this.drawScreen(context);
                },
                onStarted: (sequence) => {
                    this.classicUIVisible = sequence.ui !== "hidden";
                    this.classicUIInteractive = false;
                    this.hoveredTargetName = null;
                    this.hoveredVerbId = null;
                    this.drawScreen(context);
                },
                onFinished: ({endedScene, sequence}) => {
                    this.classicUIVisible =
                        !endedScene || sequence.ui !== "hidden";
                    this.classicUIInteractive =
                        !endedScene && !this.sceneEnded;
                    this.drawScreen(context);
                }
            },
            undefined,
            this.actorMovement
        );

        this.drawScreen(context);

        this.stopCursorAnimation?.();
        this.stopCursorAnimation = this.cursorRenderer.startAnimation(() => {
            if (this.cursorPosition) {
                this.drawScreen(context);
            }
        });

        this.unsubscribePointerMove =
            context.input.onPointerMove((logicalPosition) => {
                this.cursorPosition = logicalPosition;
                this.updateHover(logicalPosition, context);
                this.drawScreen(context);
            });

        this.unsubscribePointerDown =
            context.input.onPointerDown((logicalPosition, button) => {
                if (
                    !this.classicUIInteractive ||
                    this.sceneEnded ||
                    this.getSequenceRunner().isRunning ||
                    this.getNavigationController().isNavigating ||
                    this.getDialoguePresenter().isPresenting ||
                    this.getActorSpeech().isSpeaking
                ) {
                    return;
                }

                const dialogueSession = this.getDialogueSession();
                const dialogueView = dialogueSession.view;

                if (dialogueView) {
                    if (button !== "primary") {
                        return;
                    }

                    const optionId = this.dialoguePanel.findOptionAt(
                        logicalPosition
                    );

                    if (!optionId) {
                        return;
                    }

                    const selection = dialogueSession.selectOption(
                        optionId
                    );

                    void this.presentDialogueSelection(
                        selection,
                        dialogueView.player.id,
                        dialogueView.npc.id,
                        context
                    );
                    return;
                }

                const selectedVerb = this.adventureUI.findVerbAt(
                    logicalPosition
                );

                if (selectedVerb && button === "primary") {
                    this.verbController.select(selectedVerb);
                    this.message = "";
                    this.drawScreen(context);
                    return;
                }

                const inventoryScroll =
                    this.adventureUI.findInventoryScrollAt(logicalPosition);

                if (inventoryScroll) {
                    if (button === "primary") {
                        this.adventureUI.scrollInventory(inventoryScroll);
                        this.updateHover(logicalPosition, context);
                        this.drawScreen(context);
                    }

                    return;
                }

                const inventoryItemId = this.adventureUI.findItemAt(
                    logicalPosition
                );

                if (inventoryItemId) {
                    this.executeInventoryDefault(inventoryItemId, context);
                    this.drawScreen(context);
                    return;
                }

                if (this.adventureUI.contains(logicalPosition)) {
                    return;
                }

                const gameViewport = this.layout.getGameViewport(context.renderer);

                if (!containsPoint(gameViewport, logicalPosition)) {
                    return;
                }

                const hotspot = this.roomManager.currentRoom.hotspots.findAt(logicalPosition);
  
                if (!hotspot) {
                    if (button === "secondary") {
                        return;
                    }

                    if (
                        this.verbController.selectedVerb ===
                        this.verbController.defaultVerbId
                    ) {
                        void this.walkToPoint(
                            logicalPosition,
                            context
                        );
                        return;
                    }

                    this.message = `Nothing here: x=${Math.round(logicalPosition.x)}, y=${Math.round(logicalPosition.y)}`;
                    this.verbController.completeAction();

                    this.drawScreen(context);
                    return;
                }

                const interactionVerb = this.resolveHotspotVerb(
                    hotspot,
                    button
                );

                if (interactionVerb) {
                    void this.walkToTarget(
                        hotspot,
                        interactionVerb,
                        context
                    );
                }
            });

        if (this.initialSequenceId && this.shouldRunInitialSequence()) {
            void this.runSequence(this.initialSequenceId, context);
        }
    }

    public exit(context: SceneContext): void {
        this.unsubscribePointerDown?.();
        this.unsubscribePointerDown = null;
        this.unsubscribePointerMove?.();
        this.unsubscribePointerMove = null;
        this.stopCursorAnimation?.();
        this.stopCursorAnimation = null;
        this.dialogueSession = null;
        this.interactionExecutor = null;
        this.interactionPresenter = null;
        this.defaultVerbResolver = null;
        this.dialoguePresenter?.cancel();
        this.dialoguePresenter = null;
        this.actorSpeech?.cancel();
        this.actorSpeech = null;
        this.navigation?.cancel();
        this.navigation = null;
        this.sequenceRunner?.cancel();
        this.sequenceRunner = null;
        this.actorMovement = null;

        context.renderer.clear();
    }

    private drawScreen(context: SceneContext): void {
        context.renderer.clear();

        const gameViewport = this.layout.getGameViewport(context.renderer);

        const interfaceBounds = this.layout.getInterfaceBounds(context.renderer);

        context.renderer.drawRectangle({
            ...gameViewport,
            color: "#111111",
            alpha: 1
        });

        context.renderer.drawText({
            text: this.roomManager.currentRoom.name,
            x: 40,
            y: 40,
            fontSize: 32,
            fontWeight: "bold"
        });

        this.roomVisualRenderer.draw(context.renderer, this.roomManager.currentRoom, context.assets);

        this.actorRenderer.draw(
            context.renderer,
            this.actors,
            context.assets
        );

        const speech = this.getActorSpeech().current;

        if (speech) {
            this.actorSpeechRenderer.draw(
                context.renderer,
                speech,
                this.actors
            );
        }

        if (
            context.config.debug.enabled &&
            context.config.debug.showHotspots
        ) {
            this.hotspotDebugRenderer.draw(
                context.renderer,
                this.roomManager.currentRoom.hotspots
            );
        }

        if (
            context.config.debug.enabled &&
            context.config.debug.showNavigation
        ) {
            this.navigationDebugRenderer.draw(
                context.renderer,
                this.roomManager.currentRoom,
                this.actors,
                this.controlledActorId
            );
        }

        const dialogueView = this.getDialogueSession().view;
        const dialoguePresenting = this.getDialoguePresenter().isPresenting;
        const cinematicUI =
            this.classicUIVisible && !this.classicUIInteractive;

        if (cinematicUI) {
            this.drawClassicAdventureUI(
                context,
                interfaceBounds
            );
        } else if (dialogueView && !dialoguePresenting) {
            this.dialoguePanel.draw(
                context.renderer,
                interfaceBounds,
                dialogueView
            );
        } else if (dialoguePresenting) {
            this.adventureUI.drawBackground(
                context.renderer,
                interfaceBounds
            );
        } else {
            this.drawClassicAdventureUI(
                context,
                interfaceBounds
            );
        }

        if (this.screenTitle) {
            this.screenTitleRenderer.draw(
                context.renderer,
                this.screenTitle
            );
        }

        if (this.cursorPosition) {
            this.cursorRenderer.draw(
                context.renderer,
                this.cursorPosition
            );
        }

    }

    private drawClassicAdventureUI(
        context: SceneContext,
        bounds: {x: number; y: number; width: number; height: number}
    ): void {
        this.adventureUI.draw(
            context.renderer,
            bounds,
            {
                selectedVerb: this.verbController.selectedVerb,
                displayVerb: this.hoveredVerbId,
                targetName: this.hoveredTargetName,
                statusMessage: this.message,
                items: context.inventory.items,
                visible: this.classicUIVisible,
                interactive: this.classicUIInteractive
            },
            context.assets
        );
    }

    private applyInteractionResult(
        result: InteractionResult,
        context: SceneContext
    ): void {
        if (result.type === "startDialogue") {
            this.getDialogueSession().start(result.dialogueId);
            return;
        }

        if (result.type === "triggerAction") {
            void this.runSequence(result.actionId, context);
            return;
        }

        if (result.type === "say") {
            this.message = "";
            this.hoveredTargetName = null;
            this.hoveredVerbId = null;
            void this.presentInteractionSpeech(result, context);
            return;
        }

        this.message = result.message;
        this.hoveredTargetName = null;
        this.hoveredVerbId = null;
        this.verbController.completeAction();
    }

    private async presentInteractionSpeech(
        result: Extract<InteractionResult, {type: "say"}>,
        context: SceneContext
    ): Promise<void> {
        try {
            await this.getInteractionPresenter().present(result);
        } catch (error: unknown) {
            console.error("Interaction speech failed.", error);
            this.message = "No se pudo reproducir la respuesta.";
        } finally {
            this.verbController.completeAction();
            this.drawScreen(context);
        }
    }

    private updateHover(
        position: Point | null,
        context: SceneContext
    ): void {
        this.hoveredTargetName = null;
        this.hoveredVerbId = null;

        if (!this.classicUIInteractive || !position) {
            return;
        }

        const inventoryItemId = this.adventureUI.findItemAt(position);

        if (inventoryItemId) {
            const item = context.inventory.items.find(
                (item) => item.id === inventoryItemId
            );

            if (item) {
                this.hoveredTargetName = item.name;
                this.hoveredVerbId = this.getDefaultVerbResolver().resolve(
                    item.defaultVerb
                );
            }

            return;
        }

        if (this.adventureUI.contains(position)) {
            return;
        }

        const gameViewport = this.layout.getGameViewport(context.renderer);

        if (!containsPoint(gameViewport, position)) {
            return;
        }

        this.hoveredTargetName =
            this.roomManager.currentRoom.hotspots.findAt(position)?.name ?? null;
    }

    private executeInventoryDefault(
        itemId: string,
        context: SceneContext
    ): void {
        const item = context.inventory.items.find(
            (candidate) => candidate.id === itemId
        );
        const verb = this.getDefaultVerbResolver().resolve(item?.defaultVerb);

        if (!verb) {
            return;
        }

        const result = this.getInteractionExecutor().execute(verb, itemId);

        this.applyInteractionResult(result, context);
    }

    private resolveHotspotVerb(
        hotspot: Hotspot,
        button: PointerButton
    ): VerbId | null {
        return this.getDefaultVerbResolver().resolveTarget(
            button,
            this.verbController.selectedVerb,
            hotspot.defaultVerb
        );
    }

    private async runSequence(
        sequenceId: string,
        context: SceneContext
    ): Promise<void> {
        try {
            await this.getSequenceRunner().run(sequenceId);
        } catch (error: unknown) {
            console.error("Action sequence failed.", error);
            this.message = `Sequence failed: ${sequenceId}`;
            this.drawScreen(context);
        } finally {
            this.verbController.completeAction();
            this.drawScreen(context);
        }
    }

    private async presentDialogueSelection(
        selection: DialogueSelectionResult,
        playerActorId: string,
        npcActorId: string,
        context: SceneContext
    ): Promise<void> {
        try {
            await this.getDialoguePresenter().present(
                selection,
                {
                    playerActorId,
                    npcActorId
                }
            );
        } catch (error: unknown) {
            console.error("Dialogue presentation failed.", error);
            this.message = "No se pudo reproducir el diálogo.";
            this.drawScreen(context);
        } finally {
            if (selection.ended) {
                this.verbController.completeAction();
                this.drawScreen(context);
            }
        }
    }

    private async walkToPoint(
        destination: {x: number; y: number},
        context: SceneContext
    ): Promise<void> {
        try {
            const arrived = await this.getNavigationController().walkToPoint(
                this.controlledActorId,
                destination
            );

            if (!arrived) {
                this.message = "No puedo caminar hasta ahí.";
                this.drawScreen(context);
            }
        } catch (error: unknown) {
            console.error("Navigation failed.", error);
            this.message = "No pude llegar hasta ahí.";
            this.drawScreen(context);
        }
    }

    private async walkToTarget(
        hotspot: Hotspot,
        verb: VerbId,
        context: SceneContext
    ): Promise<void> {
        try {
            const arrived = await this.getNavigationController().walkToTarget(
                this.controlledActorId,
                hotspot,
                () => {
                    const result = this.getInteractionExecutor().execute(
                        verb,
                        hotspot.id
                    );

                    this.applyInteractionResult(result, context);
                    this.drawScreen(context);
                }
            );

            if (!arrived) {
                this.message = "No puedo acercarme hasta ahí.";
                this.drawScreen(context);
            }
        } catch (error: unknown) {
            console.error("Target navigation failed.", error);
            this.message = "No pude acercarme hasta ahí.";
            this.drawScreen(context);
        }
    }

    private getDialogueSession(): DialogueSession {
        if (!this.dialogueSession) {
            throw new Error("GameScene must be entered before using dialogues.");
        }

        return this.dialogueSession;
    }

    private shouldRunInitialSequence(): boolean {
        if (!this.initialSequenceId) {
            return false;
        }

        if (this.entryRegistry) {
            return this.entryRegistry.shouldRun(
                this.sceneId,
                this.initialSequenceId,
                this.entryOnce
            );
        }

        if (!this.entryOnce) {
            return true;
        }

        if (this.initialSequencePlayed) {
            return false;
        }

        this.initialSequencePlayed = true;
        return true;
    }

    private getInteractionExecutor(): InteractionExecutor {
        if (!this.interactionExecutor) {
            throw new Error("GameScene must be entered before using interactions.");
        }

        return this.interactionExecutor;
    }

    private getInteractionPresenter(): InteractionPresenter {
        if (!this.interactionPresenter) {
            throw new Error("GameScene must be entered before presenting interactions.");
        }

        return this.interactionPresenter;
    }

    private getDefaultVerbResolver(): DefaultVerbResolver {
        if (!this.defaultVerbResolver) {
            throw new Error("GameScene must be entered before resolving default verbs.");
        }

        return this.defaultVerbResolver;
    }

    private getSequenceRunner(): ActionSequenceRunner {
        if (!this.sequenceRunner) {
            throw new Error("GameScene must be entered before using sequences.");
        }

        return this.sequenceRunner;
    }

    private getNavigationController(): NavigationController {
        if (!this.navigation) {
            throw new Error("GameScene must be entered before using navigation.");
        }

        return this.navigation;
    }

    private getActorSpeech(): ActorSpeechController {
        if (!this.actorSpeech) {
            throw new Error("GameScene must be entered before using actor speech.");
        }

        return this.actorSpeech;
    }

    private getDialoguePresenter(): DialoguePresenter {
        if (!this.dialoguePresenter) {
            throw new Error("GameScene must be entered before presenting dialogues.");
        }

        return this.dialoguePresenter;
    }

}
