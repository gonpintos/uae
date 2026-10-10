export type VerbId = string;

export interface VerbData {
    id: VerbId;
    label: string;
    isDefault?: boolean;
}

export const defaultVerbs: readonly VerbData[] = [
    {
        id: "goTo",
        label: "Ir a",
        isDefault: true
    },
    {
        id: "look",
        label: "Mirar"
    },
    {
        id: "use",
        label: "Usar"
    },
    {
        id: "talkTo",
        label: "Hablar con"
    }
];

export function getDefaultVerbId(
    verbs: readonly VerbData[]
): VerbId {
    const defaultVerb = verbs.find((verb) => verb.isDefault) ?? verbs[0];

    if (!defaultVerb) {
        throw new Error("At least one verb must be configured.");
    }

    return defaultVerb.id;
}
