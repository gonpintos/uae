import {
    defaultVerbs,
    getDefaultVerbId,
    type VerbData,
    type VerbId
} from "./VerbData";

export class VerbController {
    public readonly defaultVerbId: VerbId;

    private selectedVerbId: VerbId;

    public constructor(verbs: readonly VerbData[] = defaultVerbs) {
        this.defaultVerbId = getDefaultVerbId(verbs);
        this.selectedVerbId = this.defaultVerbId;
    }

    public get selectedVerb(): VerbId {
        return this.selectedVerbId;
    }

    public select(verbId: VerbId): void {
        this.selectedVerbId = verbId;
    }

    public completeAction(): void {
        this.selectedVerbId = this.defaultVerbId;
    }
}
