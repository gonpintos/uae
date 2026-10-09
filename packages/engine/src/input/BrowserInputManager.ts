import type {
    InputManager,
    PointerDownHandler,
    PointerPositionMapper
} from "./InputManager";

export class BrowserInputManager
    implements InputManager {

    private target: HTMLElement | null = null;

    private positionMapper:
        PointerPositionMapper | null = null;

    public initialize(
        target: HTMLElement,
        positionMapper: PointerPositionMapper
    ): void {
        this.target = target;
        this.positionMapper = positionMapper;
    }

    public onPointerDown(
        handler: PointerDownHandler
    ): () => void {
        if (!this.target || !this.positionMapper) {
            throw new Error(
                "InputManager must be initialized before use."
            );
        }

        const target = this.target;
        const positionMapper = this.positionMapper;

        const listener = (
            event: PointerEvent
        ): void => {
            const browserPosition = {
                x: event.clientX,
                y: event.clientY
            };

            const logicalPosition =
                positionMapper(browserPosition);

            if (!logicalPosition) {
                return;
            }

            handler(logicalPosition);
        };

        target.addEventListener(
            "pointerdown",
            listener
        );

        return () => {
            target.removeEventListener(
                "pointerdown",
                listener
            );
        };
    }

    public destroy(): void {
        this.target = null;
        this.positionMapper = null;
    }
}