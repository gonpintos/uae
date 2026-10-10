import type { ActorMovementController } from "../actor/ActorMovementController";
import type { InteractionFacingController } from "../actor/InteractionFacingController";
import type { Hotspot } from "../interaction/Hotspot";
import type { Point } from "../math/Point";
import type { RoomManager } from "../room/RoomManager";

export type NavigationArrivalAction = () => void | Promise<void>;

export class NavigationController {
    private readonly roomManager: RoomManager;

    private readonly movement: ActorMovementController;

    private readonly facing: InteractionFacingController | null;

    private navigating = false;

    private pendingArrivalAction: NavigationArrivalAction | null = null;

    public constructor(
        roomManager: RoomManager,
        movement: ActorMovementController,
        facing?: InteractionFacingController
    ) {
        this.roomManager = roomManager;
        this.movement = movement;
        this.facing = facing ?? null;
    }

    public get isNavigating(): boolean {
        return this.navigating;
    }

    public async walkToPoint(
        actorId: string,
        destination: Point
    ): Promise<boolean> {
        return this.navigate(actorId, destination, null);
    }

    public async walkToTarget(
        actorId: string,
        hotspot: Hotspot,
        onArrival: NavigationArrivalAction
    ): Promise<boolean> {
        if (!hotspot.interactionPosition) {
            if (this.navigating || this.movement.isMoving) {
                return false;
            }

            this.facing?.faceInteraction(actorId, hotspot);
            await onArrival();
            return true;
        }

        return this.navigate(
            actorId,
            hotspot.interactionPosition,
            async () => {
                this.facing?.faceInteraction(actorId, hotspot);
                await onArrival();
            }
        );
    }

    public cancel(): void {
        this.movement.cancel();
        this.pendingArrivalAction = null;
    }

    private async navigate(
        actorId: string,
        destination: Point,
        onArrival: NavigationArrivalAction | null
    ): Promise<boolean> {
        if (
            this.navigating ||
            this.movement.isMoving ||
            !this.roomManager.currentRoom.canWalkTo(destination)
        ) {
            return false;
        }

        this.navigating = true;
        this.pendingArrivalAction = onArrival;

        try {
            const arrived = await this.movement.moveTo(
                actorId,
                destination
            );

            if (!arrived) {
                return false;
            }

            const arrivalAction = this.pendingArrivalAction;

            this.pendingArrivalAction = null;

            if (arrivalAction) {
                await arrivalAction();
            }

            return true;
        } finally {
            this.pendingArrivalAction = null;
            this.navigating = false;
        }
    }
}
