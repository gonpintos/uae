import type { Point } from "../math/Point";

export interface TextOptions {
    text: string;
    x: number;
    y: number;
    fontSize?: number;
    lineHeight?: number;
    color?: string;
    strokeColor?: string;
    strokeWidth?: number;
    fontWeight?: "normal" | "bold";
    align?: "left" | "center" | "right";
    anchorX?: number;
    anchorY?: number;
    
    layer?: number;
}

export interface RectangleOptions {
    x: number;
    y: number;
    width: number;
    height: number;

    /*
     * Configuración del relleno.
     */
    fill?: boolean;
    color?: string;
    alpha?: number;

    /*
     * Configuración del borde.
     */
    strokeColor?: string;
    strokeWidth?: number;
    strokeAlpha?: number;

    layer?: number;
}

export interface LineOptions {
    from: Point;
    to: Point;
    color?: string;
    width?: number;
    alpha?: number;
    layer?: number;
}

export interface ImageOptions {
    source: string;

    x: number;
    y: number;
    width: number;
    height: number;

    alpha?: number;

    flipHorizontal?: boolean;

    layer?: number;
}

export interface RendererSize {
    width: number;
    height: number;
}

export interface Renderer {
    initialize(container: HTMLElement, logicalSize: RendererSize): Promise<void>;

    loadImages(sources: readonly string[]): Promise<void>;

    drawText(options: TextOptions): void;

    drawRectangle(options: RectangleOptions): void;

    drawLine(options: LineOptions): void;

    drawImage(options: ImageOptions): void;

    getSize(): RendererSize;

    getViewportScale?(): number;

    getInputTarget(): HTMLElement;

    toLogicalPosition(position: Point): Point | null;

    clear(): void;

}
