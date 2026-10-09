import type { ActionSequenceData } from "./ActionSequenceData";

export class ActionSequenceCollection {
    private readonly sequences = new Map<string, ActionSequenceData>();

    public constructor(sequences: readonly ActionSequenceData[]) {
        for (const sequence of sequences) {
            if (this.sequences.has(sequence.id)) {
                throw new Error(`Duplicate action sequence id: ${sequence.id}`);
            }

            this.sequences.set(sequence.id, sequence);
        }
    }

    public getById(sequenceId: string): ActionSequenceData {
        const sequence = this.sequences.get(sequenceId);

        if (!sequence) {
            throw new Error(`Action sequence not found: ${sequenceId}`);
        }

        return sequence;
    }
}
