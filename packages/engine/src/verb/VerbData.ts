export type VerbId = "look" | "use" | "goTo" | "talkTo";

export interface VerbData {
    id: VerbId;
    label: string;
}

export const defaultVerbs: readonly VerbData[] = [
    {
        id: "look",
        label: "Mirar"
    },
    {
        id: "use",
        label: "Usar"
    },
    {
        id: "goTo",
        label: "Ir a"
    },
    {
        id: "talkTo",
        label: "Hablar con"
    }
];
