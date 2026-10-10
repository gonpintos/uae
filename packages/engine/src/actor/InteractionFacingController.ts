import type { Hotspot } from "../interaction/Hotspot";
import type { Actor } from "./Actor";
import type { ActorCollection } from "./ActorCollection";

export type ActorFacedHandler = (actor: Actor) => void;

export class InteractionFacingController {
    private readonly actors: ActorCollection;

    private readonly onActorFaced: ActorFacedHandler;

    public constructor(
        actors: ActorCollection,
        onActorFaced: ActorFacedHandler = () => undefined
    ) {
        this.actors = actors;
        this.onActorFaced = onActorFaced;
    }

    public faceInteraction(actorId: string, hotspot: Hotspot): void {
        const actor = this.actors.getById(actorId);
        const targetActor = hotspot.actorId
            ? this.actors.findById(hotspot.actorId)
            : null;

        if (targetActor) {
            actor.faceToward(targetActor.x);
            targetActor.faceToward(actor.x);
            this.onActorFaced(actor);

            if (targetActor.id !== actor.id) {
                this.onActorFaced(targetActor);
            }

            return;
        }

        actor.faceToward(
            hotspot.bounds.x + hotspot.bounds.width / 2
        );
        this.onActorFaced(actor);
    }
}
