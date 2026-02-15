
export function removeSpecialCharacters(input: string): string {
    return input.replace(/[^a-zA-Z0-9\s]/g, "");
}