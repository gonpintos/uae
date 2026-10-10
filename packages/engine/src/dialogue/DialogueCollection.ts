import type {
    DialogueData,
    DialogueOptionData
} from "./DialogueData";

export class DialogueCollection {
    private readonly dialogues: Map<string, DialogueData>;

    public constructor(dialogues: readonly DialogueData[]) {
        this.dialogues = new Map();

        for (const dialogue of dialogues) {
            if (this.dialogues.has(dialogue.id)) {
                throw new Error(`Duplicate dialogue id: ${dialogue.id}`);
            }

            this.assertUniqueOptionIds(dialogue);
            this.dialogues.set(dialogue.id, dialogue);
        }
    }

    public getById(dialogueId: string): DialogueData {
        const dialogue = this.dialogues.get(dialogueId);

        if (!dialogue) {
            throw new Error(`Dialogue not found: ${dialogueId}`);
        }

        return dialogue;
    }

    private assertUniqueOptionIds(dialogue: DialogueData): void {
        const optionIds = new Set<string>();

        const nodes = dialogue.nodes ?? [];

        if (nodes.length > 0) {
            const nodeIds = new Set<string>();

            for (const node of nodes) {
                if (nodeIds.has(node.id)) {
                    throw new Error(`Duplicate node id in dialogue ${dialogue.id}: ${node.id}`);
                }
                nodeIds.add(node.id);

                for (const option of node.options) {
                    this.assertUniqueOptionId(dialogue.id, option, optionIds);
                }
            }

            if (!dialogue.startNodeId || !nodeIds.has(dialogue.startNodeId)) {
                throw new Error(`Dialogue start node not found in ${dialogue.id}: ${dialogue.startNodeId ?? "(missing)"}`);
            }

            for (const node of nodes) {
                for (const option of node.options) {
                    if (option.gotoNodeId && !nodeIds.has(option.gotoNodeId)) {
                        throw new Error(`Dialogue target node not found in ${dialogue.id}: ${option.gotoNodeId}`);
                    }
                }
            }

            return;
        }

        for (const option of dialogue.options ?? []) {
            this.assertUniqueOptionId(dialogue.id, option, optionIds);
        }
    }

    private assertUniqueOptionId(
        dialogueId: string,
        option: DialogueOptionData,
        optionIds: Set<string>
    ): void {
        if (optionIds.has(option.id)) {
            throw new Error(
                `Duplicate option id in dialogue ${dialogueId}: ${option.id}`
            );
        }

        optionIds.add(option.id);
    }
}
