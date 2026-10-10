export class SceneEntryRegistry {
    private readonly completed = new Set<string>();

    public shouldRun(sceneId: string, sequenceId: string, once: boolean): boolean {
        if (!once) {
            return true;
        }

        const key = `${sceneId}:${sequenceId}`;

        if (this.completed.has(key)) {
            return false;
        }

        this.completed.add(key);
        return true;
    }
}
