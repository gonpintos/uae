import type { PointerPosition } from "../input/InputManager";

export interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}

export function containsPoint(
    rectangle: Rectangle,
    position: PointerPosition
): boolean {
    const insideHorizontally =
        position.x >= rectangle.x &&
        position.x <= rectangle.x + rectangle.width;

    const insideVertically =
        position.y >= rectangle.y &&
        position.y <= rectangle.y + rectangle.height;

    return insideHorizontally && insideVertically;
}