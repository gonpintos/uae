import type { IntroData } from "./IntroData";

export class IntroAssetCollector {
    public collect(data: IntroData): readonly string[] {
        return [
            ...new Set(
                data.screens
                    .filter((screen) => screen.type === "image")
                    .map((screen) => screen.assetId)
            )
        ];
    }
}
