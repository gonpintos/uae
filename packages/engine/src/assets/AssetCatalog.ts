export type AssetDefinitions = Record<string, string>;

export class AssetCatalog {
    private readonly sources = new Map<string, string>();

    public constructor(definitions: AssetDefinitions = {}) {
        for (
            const [id, source]
            of Object.entries(definitions)
        ) {
            if (!id.trim()) {
                throw new Error("Asset id cannot be empty.");
            }

            if (!source.trim()) {
                throw new Error(`Asset source cannot be empty: ${id}`);
            }

            this.sources.set(id, source);
        }
    }

    public getSource(id: string): string {
        const source = this.sources.get(id);

        if (!source) {
            throw new Error(`Unknown asset id: ${id}`);
        }

        return source;
    }

    public getSources(ids: readonly string[]): readonly string[] {
        const uniqueIds = [
            ...new Set(ids)
        ];

        const sources = uniqueIds.map(
            (id) => this.getSource(id)
        );

        return [
            ...new Set(sources)
        ];
    }

    public getAllSources(): readonly string[] {
        return [
            ...new Set(this.sources.values())
        ];
    }

    public has(id: string): boolean {
        return this.sources.has(id);
    }
}