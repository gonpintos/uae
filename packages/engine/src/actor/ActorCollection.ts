import { Actor } from "./Actor";
import type { ActorData } from "./ActorData";

export class ActorCollection implements Iterable<Actor> {
    private readonly actors = new Map<string, Actor>();

    public constructor(actorData: readonly ActorData[]) {
        for (const data of actorData) {
            if (this.actors.has(data.id)) {
                throw new Error(`Duplicate actor id: ${data.id}`);
            }

            this.actors.set(data.id, new Actor(data));
        }
    }

    public getById(actorId: string): Actor {
        const actor = this.actors.get(actorId);

        if (!actor) {
            throw new Error(`Actor not found: ${actorId}`);
        }

        return actor;
    }

    public [Symbol.iterator](): Iterator<Actor> {
        return this.actors.values();
    }
}
