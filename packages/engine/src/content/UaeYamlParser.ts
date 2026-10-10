import { parseDocument } from "yaml";

import { UaeContentError } from "./UaeContentError";
import type { UaeSourceText } from "./UaeContentTypes";

export class UaeYamlParser {
    public parse(source: UaeSourceText): unknown {
        const document = parseDocument(source.text, {
            prettyErrors: true,
            strict: true,
            uniqueKeys: true
        });

        const error = document.errors[0];

        if (error) {
            throw new UaeContentError(
                source.fileName,
                "$",
                error.message
            );
        }

        const value: unknown = document.toJS({maxAliasCount: 0});

        if (!isRecord(value)) {
            throw new UaeContentError(
                source.fileName,
                "$",
                "expected a YAML mapping"
            );
        }

        return value;
    }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
