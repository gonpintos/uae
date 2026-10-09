import {
    containsPoint,
    DialogueCollection,
    DialoguePanel,
    DialogueSession,
    GameLayout,
    HotspotDebugRenderer,
    InteractionExecutor,
    MessageBox,
    RoomCollection,
    RoomManager,
    RoomVisualRenderer,
    type DialogueData,
    type InteractionResult,
    type RoomData,
    type Scene,
    type SceneContext
} from "@uae/engine";

export class GameScene implements Scene {
    private readonly roomManager: RoomManager;

    private readonly interactionExecutor: InteractionExecutor;

    private readonly dialogues: DialogueCollection;

    private dialogueSession: DialogueSession | null = null;

    private readonly dialoguePanel = new DialoguePanel();

    private readonly hotspotDebugRenderer = new HotspotDebugRenderer();

    private readonly layout = new GameLayout({messageBoxHeight: 110});

    private readonly roomVisualRenderer = new RoomVisualRenderer();

    private readonly messageBox = new MessageBox();

    private message = "Click an interactive area";

    private unsubscribePointerDown: (() => void) | null = null;

    public constructor(
        roomsData: RoomData[],
        initialRoomId: string,
        dialoguesData: readonly DialogueData[]
    ) {
        const rooms = new RoomCollection(roomsData);

        this.roomManager = new RoomManager(rooms, initialRoomId);
        this.interactionExecutor = new InteractionExecutor(this.roomManager);
        this.dialogues = new DialogueCollection(dialoguesData);
    }

    public enter(context: SceneContext): void {
        this.dialogueSession = new DialogueSession(
            this.dialogues,
            context.state
        );

        this.drawScreen(context);

        this.unsubscribePointerDown =
            context.input.onPointerDown((logicalPosition) => {
                const dialogueSession = this.getDialogueSession();
                const dialogueView = dialogueSession.view;

                if (dialogueView) {
                    const optionId = this.dialoguePanel.findOptionAt(
                        logicalPosition
                    );

                    if (!optionId) {
                        return;
                    }

                    const selection = dialogueSession.selectOption(
                        optionId
                    );

                    if (selection.ended) {
                        const completedLines = [
                            `${dialogueView.player.name}: «${selection.turn.playerLine}»`,
                            selection.turn.npcLine
                                ? `${dialogueView.npc.name}: «${selection.turn.npcLine}»`
                                : null,
                            selection.turn.playerClosingLine
                                ? `${dialogueView.player.name}: «${selection.turn.playerClosingLine}»`
                                : null
                        ].filter((line): line is string => line !== null);

                        this.message = completedLines.join("\n");
                    }

                    this.drawScreen(context);
                    return;
                }

                const gameViewport = this.layout.getGameViewport(context.renderer);

                if (!containsPoint(gameViewport, logicalPosition)) {
                    return;
                }

                const hotspot = this.roomManager.currentRoom.hotspots.findAt(logicalPosition);
  
                if (!hotspot) {
                    this.message = `Nothing here: x=${Math.round(logicalPosition.x)}, y=${Math.round(logicalPosition.y)}`;

                    this.drawScreen(context);
                    return;
                }

                if (!hotspot.interaction) {
                    this.message = `You clicked: ${hotspot.id}`;

                    this.drawScreen(context);
                    return;
                }

                const result = this.interactionExecutor.execute(hotspot.interaction);

                this.applyInteractionResult(result);
                this.drawScreen(context);
            });
    }

    public exit(context: SceneContext): void {
        this.unsubscribePointerDown?.();
        this.unsubscribePointerDown = null;
        this.dialogueSession = null;

        context.renderer.clear();
    }

    private drawScreen(context: SceneContext): void {
        context.renderer.clear();

        const gameViewport = this.layout.getGameViewport(context.renderer);

        const messageBoxBounds = this.layout.getMessageBoxBounds(context.renderer);

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

        if (
            context.config.debug.enabled &&
            context.config.debug.showHotspots
        ) {
            this.hotspotDebugRenderer.draw(
                context.renderer,
                this.roomManager.currentRoom.hotspots
            );
        }

        this.messageBox.draw(
            context.renderer,
            messageBoxBounds,
            this.message
        );

        const dialogueView = this.getDialogueSession().view;

        if (dialogueView) {
            this.dialoguePanel.draw(
                context.renderer,
                this.dialoguePanel.getBounds(context.renderer),
                dialogueView
            );
        }

    }

    private applyInteractionResult(
        result: InteractionResult
    ): void {
        if (result.type === "startDialogue") {
            this.getDialogueSession().start(result.dialogueId);
            return;
        }

        this.message = result.message;
    }

    private getDialogueSession(): DialogueSession {
        if (!this.dialogueSession) {
            throw new Error("GameScene must be entered before using dialogues.");
        }

        return this.dialogueSession;
    }

}
