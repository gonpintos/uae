import type { PointerPosition } from "../input/InputManager";
import type { Point } from "../math/Point";
import {
    containsPoint,
    type Rectangle
} from "./Rectangle";
import type { InteractionAction } from "./InteractionAction";
import type { DefaultVerb } from "./DefaultVerb";

export type HotspotInteraction = InteractionAction;

export interface HotspotOptions extends Rectangle {
    id: string;
    name?: string;
    /** Actor represented by this hotspot, when applicable. */
    actorId?: string;
    /** Ground anchor where the controlled actor stands to interact. */
    interactionPosition?: Point;
    interaction?: HotspotInteraction;
    defaultVerb?: DefaultVerb;
}

export class Hotspot {
    public readonly id: string;

    public readonly name: string;

    public readonly actorId: string | null;

    public readonly bounds: Rectangle;

    public readonly interaction: HotspotInteraction | null;

    public readonly interactionPosition: Point | null;

    public readonly defaultVerb: DefaultVerb | null;

    public constructor(options: HotspotOptions) {
        this.id = options.id;
        this.name = options.name ?? options.id;
        this.actorId = options.actorId ?? null;

        this.bounds = {
            x: options.x,
            y: options.y,
            width: options.width,
            height: options.height
        };

        this.interaction = options.interaction ?? null;
        this.defaultVerb = options.defaultVerb ?? null;
        this.interactionPosition = options.interactionPosition
            ? {...options.interactionPosition}
            : null;
    }

    public contains(position: PointerPosition): boolean {
        return containsPoint(this.bounds, position);
    }
}
