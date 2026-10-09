import type { VerbId } from "../verb/VerbData";
import type { VerbInteractionData } from "./VerbInteractionData";

export class VerbInteractionCollection {
    private readonly interactions = new Map<string, VerbInteractionData[]>();

    public constructor(interactions: readonly VerbInteractionData[]) {
        for (const interaction of interactions) {
            const key = this.createKey(
                interaction.verb,
                interaction.targetId
            );

            const variants = this.interactions.get(key) ?? [];

            if (variants.some((variant) => !variant.conditions?.length)) {
                throw new Error(
                    `Unreachable verb interaction after unconditional variant: ${interaction.verb} + ${interaction.targetId}`
                );
            }

            variants.push(interaction);
            this.interactions.set(key, variants);
        }
    }

    public getCandidates(
        verb: VerbId,
        targetId: string
    ): readonly VerbInteractionData[] {
        return this.interactions.get(
            this.createKey(verb, targetId)
        ) ?? [];
    }

    private createKey(verb: VerbId, targetId: string): string {
        return `${verb}:${targetId}`;
    }
}
