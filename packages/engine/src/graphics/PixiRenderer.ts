import {
    Application,
    Assets,
    Container,
    Graphics,
    Point as PixiPoint,
    Sprite,
    Text    
} from "pixi.js";

import type { Texture } from "pixi.js";

import type { Point } from "../math/Point";

import type {
    ImageOptions,
    RectangleOptions,
    Renderer,
    RendererSize,
    TextOptions
} from "./Renderer";

export class PixiRenderer implements Renderer {
    private readonly application: Application;

    private readonly logicalRoot: Container;

    private logicalSize: RendererSize | null = null;
    
    private readonly textures = new Map<string, Texture>();

    private viewportScale = 1;

    private viewportOffsetX = 0;

    private viewportOffsetY = 0;

    private resizeObserver: ResizeObserver | null = null;

    public constructor() {
        this.application = new Application();
        this.logicalRoot = new Container();
        this.logicalRoot.sortableChildren = true;
    }

    public async initialize(
        container: HTMLElement,
        logicalSize: RendererSize
    ): Promise<void> {
        this.logicalSize = logicalSize;

        await this.application.init({
            background: "#111111",
            resizeTo: container
        });

        this.application.stage.addChild(
            this.logicalRoot
        );

        container.appendChild(
            this.application.canvas
        );

        this.updateViewport();
        
        this.resizeObserver = new ResizeObserver(() => {
            window.requestAnimationFrame(() => {
                this.updateViewport();
            });
        });

        this.resizeObserver.observe(container);
    }

    public async loadImages(sources: readonly string[]): Promise<void> {
        const uniqueSources = [
            ...new Set(sources)
        ];

        await Promise.all(
            uniqueSources.map(
                async (source): Promise<void> => {
                    const texture = await Assets.load<Texture>(source);

                    this.textures.set(source,texture);
                }
            )
        );
    }

    public drawText(options: TextOptions): void {
        const text = new Text({
            text: options.text,
            style: {
                fill: options.color ?? "#ffffff",
                stroke: options.strokeColor && (options.strokeWidth ?? 0) > 0
                    ? {
                        color: options.strokeColor,
                        width: options.strokeWidth ?? 1
                    }
                    : undefined,
                fontFamily: "monospace",
                fontSize: options.fontSize ?? 18,
                lineHeight: options.lineHeight,
                align: options.align ?? "left",
                fontWeight:
                    options.fontWeight ?? "normal"
            }
        });

        text.anchor.set(
            options.anchorX ?? 0,
            options.anchorY ?? 0
        );
        text.position.set(options.x, options.y);

        text.zIndex = options.layer ?? 0;

        this.logicalRoot.addChild(text);

        console.log(
            "Stage children:",
            this.application.stage.children.length
        );

        console.log(
            "Logical root children:",
            this.logicalRoot.children.length
        );
    }

    public drawRectangle(
        options: RectangleOptions
    ): void {
        const rectangle = new Graphics();

        rectangle.rect(
            options.x,
            options.y,
            options.width,
            options.height
        );

        /*
        * Por defecto seguimos rellenando el rectángulo
        * para no romper el código existente.
        */
        if (options.fill ?? true) {
            rectangle.fill({
                color: options.color ?? "#ffffff",
                alpha: options.alpha ?? 0.25
            });
        }

        /*
        * El borde es opcional.
        */
        if (
            options.strokeColor &&
            (options.strokeWidth ?? 0) > 0
        ) {
            rectangle.stroke({
                color: options.strokeColor,
                width: options.strokeWidth ?? 1,
                alpha: options.strokeAlpha ?? 1
            });
        }

        rectangle.zIndex = options.layer ?? 0;

        this.logicalRoot.addChild(rectangle);
    }

    public drawImage(options: ImageOptions): void {
        const texture = this.textures.get(options.source);

        if (!texture) {
            throw new Error(`Image was not loaded: ${options.source}`);
        }

        const sprite = new Sprite(texture);

        sprite.width = options.width;
        sprite.height = options.height;

        if (options.flipHorizontal) {
            sprite.position.set(
                options.x + options.width,
                options.y
            );
            sprite.scale.x *= -1;
        } else {
            sprite.position.set(options.x, options.y);
        }

        sprite.alpha = options.alpha ?? 1;
        
        sprite.zIndex = options.layer ?? 0;

        this.logicalRoot.addChild(sprite);
    }

    public getSize(): RendererSize {
        if (!this.logicalSize) {
            throw new Error("Renderer must be initialized before use.");
        }

        return {
            width: this.logicalSize.width,
            height: this.logicalSize.height
        };
    }

    public getViewportScale(): number {
        return this.viewportScale;
    }

    public getInputTarget(): HTMLElement {
        return this.application.canvas;
    }

    public toLogicalPosition(
        position: Point
    ): Point | null {
        if (!this.logicalSize) {
            throw new Error(
                "Renderer must be initialized before use."
            );
        }

        /*
        * Convierte las coordenadas del navegador
        * a coordenadas internas de PixiJS.
        */
        const rendererPosition =
            new PixiPoint();

        this.application.renderer.events.mapPositionToPoint(
            rendererPosition,
            position.x,
            position.y
        );

        /*
        * Convierte la posición interna de PixiJS
        * al sistema local de logicalRoot.
        *
        * Esto deshace automáticamente:
        * - la escala;
        * - el desplazamiento horizontal;
        * - el desplazamiento vertical.
        */
        const logicalPosition =
            this.logicalRoot.toLocal(
                rendererPosition
            );

        const isOutside =
            logicalPosition.x < 0 ||
            logicalPosition.y < 0 ||
            logicalPosition.x >
                this.logicalSize.width ||
            logicalPosition.y >
                this.logicalSize.height;

        if (isOutside) {
            return null;
        }

        return {
            x: logicalPosition.x,
            y: logicalPosition.y
        };
    }

    public clear(): void {
        this.logicalRoot.removeChildren();
    }

    private updateViewport(): void {
        if (!this.logicalSize) {
            return;
        }

        const rendererWidth =
            this.application.screen.width;

        const rendererHeight =
            this.application.screen.height;

        if (
            rendererWidth <= 0 ||
            rendererHeight <= 0
        ) {
            return;
        }

        this.viewportScale = Math.min(
            rendererWidth / this.logicalSize.width,
            rendererHeight / this.logicalSize.height
        );

        const scaledWidth =
            this.logicalSize.width *
            this.viewportScale;

        const scaledHeight =
            this.logicalSize.height *
            this.viewportScale;

        this.viewportOffsetX =
            (rendererWidth - scaledWidth) / 2;

        this.viewportOffsetY =
            (rendererHeight - scaledHeight) / 2;

        this.logicalRoot.scale.set(
            this.viewportScale
        );

        this.logicalRoot.position.set(
            this.viewportOffsetX,
            this.viewportOffsetY
        );
    }
    
}
