export interface WaitSequenceAction {
    type: "wait";
    durationMs: number;
}

export interface SaySequenceAction {
    type: "say";
    actorId: string;
    message: string;
}

export interface MoveToSequenceAction {
    type: "moveTo";
    actorId: string;
    x: number;
    y: number;
    durationMs?: number;
}

export interface MoveByStepsSequenceAction {
    type: "moveBySteps";
    actorId: string;
    steps: number;
    deltaX: number;
    deltaY: number;
    stepDurationMs?: number;
}

export interface EndSceneSequenceAction {
    type: "endScene";
}

export interface ShowTitleSequenceAction {
    type: "showTitle";
    text: string;
}

export type ActionSequenceStep =
    | WaitSequenceAction
    | SaySequenceAction
    | MoveToSequenceAction
    | MoveByStepsSequenceAction
    | ShowTitleSequenceAction
    | EndSceneSequenceAction;

export interface ActionSequenceData {
    id: string;
    ui?: "hidden";
    actions: readonly ActionSequenceStep[];
}
