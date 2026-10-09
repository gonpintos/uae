import type { Point } from "../math/Point";

export interface TextOptions {
    text: string;
    x: number;
    y: number;
    fontSize?: number;
    color?: string;
    fontWeight?: "normal" | "bold";
    
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

export interface ImageOptions {
    source: string;

    x: number;
    y: number;
    width: number;
    height: number;

    alpha?: number;

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

    drawImage(options: ImageOptions): void;

    getSize(): RendererSize;

    getInputTarget(): HTMLElement;

    toLogicalPosition(position: Point): Point | null;

    clear(): void;

}