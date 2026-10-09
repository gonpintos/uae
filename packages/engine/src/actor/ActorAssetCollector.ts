import type { ActorData } from "./ActorData";

export class ActorAssetCollector {
    public collect(actors: readonly ActorData[]): readonly string[] {
        const assetIds = new Set<string>();

        for (const actor of actors) {
            const clips = [
                actor.animations?.idle,
                actor.animations?.walk
            ];

            for (const clip of clips) {
                if (!clip) {
                    continue;
                }

                for (const rawAssetId of clip.frameAssetIds) {
                    const assetId = rawAssetId.trim();

                    if (!assetId) {
                        throw new Error(`Actor "${actor.id}" has an empty frame asset id.`);
                    }

                    assetIds.add(assetId);
                }
            }
        }

        return [...assetIds];
    }
}
