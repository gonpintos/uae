export interface RoomVisualData {
    id: string;

    x: number;
    y: number;
    width: number;
    height: number;

    color?: string;
    
    imageAssetId?: string;
    
    alpha?: number;
    
    label?: string;

    layer?: number;
}