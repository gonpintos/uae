import type { Point } from "../math/Point";

export type PointerPosition = Point;

export type PointerDownHandler = (
    position: PointerPosition
) => void;

export type PointerMoveHandler = (
    position: PointerPosition | null
) => void;

export type PointerPositionMapper = (
    position: PointerPosition
) => PointerPosition | null;

export interface InputManager {
    initialize(
        target: HTMLElement,
        positionMapper: PointerPositionMapper
    ): void;

    onPointerDown(
        handler: PointerDownHandler
    ): () => void;

    onPointerMove(
        handler: PointerMoveHandler
    ): () => void;

    destroy(): void;
}
