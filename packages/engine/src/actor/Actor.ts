import type { ActorData } from "./ActorData";

export class Actor {
    public readonly id: string;

    public readonly name: string;

    public readonly width: number;

    public readonly height: number;

    public readonly color: string;

    private positionX: number;

    private positionY: number;

    public constructor(data: ActorData) {
        this.id = data.id;
        this.name = data.name;
        this.positionX = data.x;
        this.positionY = data.y;
        this.width = data.width;
        this.height = data.height;
        this.color = data.color ?? "#47704f";
    }

    public get x(): number {
        return this.positionX;
    }

    public get y(): number {
        return this.positionY;
    }

    public moveTo(x: number, y: number): void {
        this.positionX = x;
        this.positionY = y;
    }

    public moveBy(deltaX: number, deltaY: number): void {
        this.positionX += deltaX;
        this.positionY += deltaY;
    }
}
