export interface IntroTextScreenData {
    type: "text";
    text: string;
    durationMs: number;
    fontSize?: number;
    lineHeight?: number;
}

export interface IntroImageScreenData {
    type: "image";
    assetId: string;
    durationMs: number;
    aspectRatio?: number;
    caption?: string;
}

export type IntroScreenData =
    | IntroTextScreenData
    | IntroImageScreenData;

export interface IntroData {
    screens: readonly IntroScreenData[];
    backgroundColor?: string;
    textColor?: string;
}
