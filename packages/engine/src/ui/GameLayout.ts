import type { Renderer } from "../graphics/Renderer";
import type { Rectangle } from "../interaction/Rectangle";

export interface GameLayoutOptions {
    interfaceHeight?: number;
    /** @deprecated Use interfaceHeight. */
    messageBoxHeight?: number;
}

export class GameLayout {
    public readonly messageBoxHeight: number;

    public readonly interfaceHeight: number;

    public constructor(options: GameLayoutOptions = {}) {
        this.interfaceHeight =
            options.interfaceHeight ?? options.messageBoxHeight ?? 110;
        this.messageBoxHeight = this.interfaceHeight;
    }

    public getGameViewport(
        renderer: Renderer
    ): Rectangle {
        const rendererSize = renderer.getSize();

        return {
            x: 0,
            y: 0,
            width: rendererSize.width,
            height:
                rendererSize.height -
                this.interfaceHeight
        };
    }

    public getInterfaceBounds(
        renderer: Renderer
    ): Rectangle {
        const rendererSize = renderer.getSize();

        return {
            x: 0,
            y: rendererSize.height - this.interfaceHeight,
            width: rendererSize.width,
            height: this.interfaceHeight
        };
    }

    public getMessageBoxBounds(
        renderer: Renderer
    ): Rectangle {
        return this.getInterfaceBounds(renderer);
    }
}
