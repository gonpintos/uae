import { RenderLayer } from "./RenderLayer";

const depthScale = 10_000;

export function getWorldDepthLayer(depthY: number): number {
    if (!Number.isFinite(depthY)) {
        throw new Error(`Invalid world depth: ${depthY}`);
    }

    return RenderLayer.RoomObject + depthY / depthScale;
}
