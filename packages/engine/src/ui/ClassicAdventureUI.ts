import type { AssetCatalog } from "../assets/AssetCatalog";
import { RenderLayer } from "../graphics/RenderLayer";
import type { Renderer } from "../graphics/Renderer";
import type { PointerPosition } from "../input/InputManager";
import type { InventoryItemData } from "../inventory/InventoryItemData";
import {
    containsPoint,
    type Rectangle
} from "../interaction/Rectangle";
import {
    defaultVerbs,
    getDefaultVerbId,
    type VerbData,
    type VerbId
} from "../verb/VerbData";
import { ActionLine } from "./ActionLine";
import { InventoryPanel } from "./InventoryPanel";
import { VerbPanel } from "./VerbPanel";

export interface ClassicAdventureUIView {
    selectedVerb: VerbId;
    targetName: string | null;
    statusMessage?: string;
    items: readonly InventoryItemData[];
    visible?: boolean;
    interactive?: boolean;
}

export interface ClassicAdventureUIOptions {
    verbs?: readonly VerbData[];
    layer?: number;
    disabledOverlayAlpha?: number;
}

export class ClassicAdventureUI {
    public readonly defaultVerbId: VerbId;

    private readonly layer: number;

    private readonly actionLine: ActionLine;

    private readonly verbPanel: VerbPanel;

    private readonly inventoryPanel: InventoryPanel;

    private readonly disabledOverlayAlpha: number;

    private bounds: Rectangle | null = null;

    private visible = false;

    private interactive = false;

    public constructor(options: ClassicAdventureUIOptions = {}) {
        const verbs = options.verbs ?? defaultVerbs;

        this.defaultVerbId = getDefaultVerbId(verbs);
        this.layer = options.layer ?? RenderLayer.Interface;
        this.actionLine = new ActionLine({verbs, layer: this.layer + 3});
        this.verbPanel = new VerbPanel({verbs, layer: this.layer + 1});
        this.inventoryPanel = new InventoryPanel({layer: this.layer + 1});
        this.disabledOverlayAlpha = options.disabledOverlayAlpha ?? 0.32;
    }

    public get isVisible(): boolean {
        return this.visible;
    }

    public get isInteractive(): boolean {
        return this.interactive;
    }

    public draw(
        renderer: Renderer,
        bounds: Rectangle,
        view: ClassicAdventureUIView,
        assets?: AssetCatalog
    ): void {
        this.visible = view.visible ?? true;
        this.interactive =
            this.visible && (view.interactive ?? true);

        if (!this.visible) {
            this.bounds = null;
            return;
        }

        this.drawBackground(renderer, bounds);

        const actionBounds: Rectangle = {
            x: bounds.x + 10,
            y: bounds.y + 4,
            width: bounds.width - 20,
            height: 28
        };
        const controlsY = bounds.y + 34;
        const controlsHeight = bounds.height - 40;
        const gap = 10;
        const verbWidth = Math.floor((bounds.width - 30) * 0.56);
        const verbBounds: Rectangle = {
            x: bounds.x + 10,
            y: controlsY,
            width: verbWidth,
            height: controlsHeight
        };
        const inventoryBounds: Rectangle = {
            x: verbBounds.x + verbBounds.width + gap,
            y: controlsY,
            width: bounds.x + bounds.width - 10 -
                (verbBounds.x + verbBounds.width + gap),
            height: controlsHeight
        };
        const actionText = view.targetName
            ? this.actionLine.buildText(view.selectedVerb, view.targetName)
            : view.statusMessage ||
                this.actionLine.buildText(view.selectedVerb, null);

        this.actionLine.draw(renderer, actionBounds, actionText);
        this.verbPanel.draw(renderer, view.selectedVerb, verbBounds);
        this.inventoryPanel.draw(
            renderer,
            view.items,
            assets,
            inventoryBounds
        );

        if (!this.interactive) {
            renderer.drawRectangle({
                ...bounds,
                color: "#000000",
                alpha: this.disabledOverlayAlpha,
                layer: this.layer + 4
            });
        }
    }

    public drawBackground(
        renderer: Renderer,
        bounds: Rectangle
    ): void {
        this.bounds = {...bounds};

        renderer.drawRectangle({
            ...bounds,
            color: "#15111f",
            alpha: 1,
            strokeColor: "#a58254",
            strokeWidth: 2,
            layer: this.layer
        });
    }

    public contains(position: PointerPosition): boolean {
        return this.bounds !== null && containsPoint(this.bounds, position);
    }

    public findVerbAt(position: PointerPosition): VerbId | null {
        if (!this.interactive) {
            return null;
        }

        return this.verbPanel.findVerbAt(position);
    }

    public findItemAt(position: PointerPosition): string | null {
        if (!this.interactive) {
            return null;
        }

        return this.inventoryPanel.findItemAt(position);
    }

    public buildActionText(
        verbId: VerbId,
        targetName: string | null
    ): string {
        return this.actionLine.buildText(verbId, targetName);
    }
}
