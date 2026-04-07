import type { SaveFile, SaveMeta } from '../features/season/types';

const SAVE_INDEX_KEY = 'f1-manager-save-index-v1';
const SAVE_PREFIX = 'f1-manager-save-v1:';

function getSaveKey(id: string) {
    return `${SAVE_PREFIX}${id}`;
}

function readIndex(): SaveMeta[] {
    const raw = localStorage.getItem(SAVE_INDEX_KEY);
    if (!raw) return [];

    try {
        return JSON.parse(raw) as SaveMeta[];
    } catch {
        return [];
    }
}

function writeIndex(index: SaveMeta[]) {
    localStorage.setItem(SAVE_INDEX_KEY, JSON.stringify(index));
}

export function listBrowserSaves(): SaveMeta[] {
    return [...readIndex()].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
}

export function readBrowserSave(id: string): SaveFile | null {
    const raw = localStorage.getItem(getSaveKey(id));
    if (!raw) return null;

    try {
        return JSON.parse(raw) as SaveFile;
    } catch {
        return null;
    }
}

export function writeBrowserSave(save: SaveFile) {
    localStorage.setItem(getSaveKey(save.meta.id), JSON.stringify(save));

    const index = readIndex();
    const existingIndex = index.findIndex((entry) => entry.id === save.meta.id);

    if (existingIndex >= 0) {
        index[existingIndex] = save.meta;
    } else {
        index.push(save.meta);
    }

    writeIndex(index);
}

export function deleteBrowserSave(id: string) {
    localStorage.removeItem(getSaveKey(id));
    const index = readIndex().filter((entry) => entry.id !== id);
    writeIndex(index);
}

export function createSaveId() {
    return crypto.randomUUID();
}

export async function readJsonFile(file: File): Promise<unknown> {
    const text = await file.text();
    return JSON.parse(text);
}

export function downloadJson(filename: string, value: unknown) {
    const blob = new Blob([JSON.stringify(value, null, 2)], {
        type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}