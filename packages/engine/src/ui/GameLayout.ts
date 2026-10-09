import type { Renderer } from "../graphics/Renderer";
import type { Rectangle } from "../interaction/Rectangle";

export interface GameLayoutOptions {
    messageBoxHeight?: number;
}

export class GameLayout {
    public readonly messageBoxHeight: number;

    public constructor(options: GameLayoutOptions = {}) {
        this.messageBoxHeight =
            options.messageBoxHeight ?? 110;
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
                this.messageBoxHeight
        };
    }

    public getMessageBoxBounds(
        renderer: Renderer
    ): Rectangle {
        const rendererSize = renderer.getSize();

        return {
            x: 0,
            y:
                rendererSize.height -
                this.messageBoxHeight,
            width: rendererSize.width,
            height: this.messageBoxHeight
        };
    }
}