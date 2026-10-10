import type { AssetCatalog } from "../assets/AssetCatalog";
import { RenderLayer } from "../graphics/RenderLayer";
import type { Renderer } from "../graphics/Renderer";
import type {
    IntroData,
    IntroImageScreenData,
    IntroScreenData,
    IntroTextScreenData
} from "./IntroData";

export class IntroRenderer {
    public draw(
        renderer: Renderer,
        assets: AssetCatalog,
        data: IntroData,
        screen: IntroScreenData
    ): void {
        const size = renderer.getSize();

        renderer.clear();
        renderer.drawRectangle({
            x: 0,
            y: 0,
            width: size.width,
            height: size.height,
            color: data.backgroundColor ?? "#000000",
            alpha: 1,
            layer: RenderLayer.Background
        });

        if (screen.type === "text") {
            this.drawTextScreen(
                renderer,
                data,
                screen
            );
            return;
        }

        this.drawImageScreen(
            renderer,
            assets,
            data,
            screen
        );
    }

    private drawTextScreen(
        renderer: Renderer,
        data: IntroData,
        screen: IntroTextScreenData
    ): void {
        const size = renderer.getSize();

        renderer.drawText({
            text: screen.text,
            x: size.width / 2,
            y: size.height / 2,
            fontSize: screen.fontSize ?? 64,
            lineHeight: screen.lineHeight ?? 78,
            color: data.textColor ?? "#ffffff",
            strokeColor: "#000000",
            strokeWidth: 5,
            fontWeight: "bold",
            align: "center",
            anchorX: 0.5,
            anchorY: 0.5,
            layer: RenderLayer.Modal
        });
    }

    private drawImageScreen(
        renderer: Renderer,
        assets: AssetCatalog,
        data: IntroData,
        screen: IntroImageScreenData
    ): void {
        const size = renderer.getSize();
        const imageBounds = this.getImageBounds(
            size.width,
            size.height,
            screen.aspectRatio
        );

        renderer.drawImage({
            source: assets.getSource(screen.assetId),
            ...imageBounds,
            layer: RenderLayer.RoomBackground
        });

        if (!screen.caption) {
            return;
        }

        const supportHeight = 170;
        const supportY = size.height - supportHeight;

        renderer.drawRectangle({
            x: 0,
            y: supportY,
            width: size.width,
            height: supportHeight,
            color: "#000000",
            alpha: 0.82,
            layer: RenderLayer.Interface
        });
        renderer.drawText({
            text: screen.caption,
            x: size.width / 2,
            y: supportY + supportHeight / 2,
            fontSize: 30,
            lineHeight: 38,
            color: data.textColor ?? "#ffffff",
            strokeColor: "#000000",
            strokeWidth: 4,
            fontWeight: "bold",
            align: "center",
            anchorX: 0.5,
            anchorY: 0.5,
            layer: RenderLayer.Modal
        });
    }

    private getImageBounds(
        viewportWidth: number,
        viewportHeight: number,
        aspectRatio: number | undefined
    ): {x: number; y: number; width: number; height: number} {
        if (!aspectRatio) {
            return {
                x: 0,
                y: 0,
                width: viewportWidth,
                height: viewportHeight
            };
        }

        const viewportAspectRatio = viewportWidth / viewportHeight;

        if (aspectRatio > viewportAspectRatio) {
            const height = viewportWidth / aspectRatio;

            return {
                x: 0,
                y: (viewportHeight - height) / 2,
                width: viewportWidth,
                height
            };
        }

        const width = viewportHeight * aspectRatio;

        return {
            x: (viewportWidth - width) / 2,
            y: 0,
            width,
            height: viewportHeight
        };
    }
}
