export class UaeContentError extends Error {
    public readonly fileName: string;

    public readonly fieldPath: string;

    public constructor(fileName: string, fieldPath: string, message: string) {
        super(`${fileName}:${fieldPath}: ${message}`);
        this.name = "UaeContentError";
        this.fileName = fileName;
        this.fieldPath = fieldPath;
    }
}
