/**
 * MoeDex GBA Cloud - IndexedDB Storage Layer (Nativo & 100% Local)
 */

const DB_NAME = 'moedex_cloud_db_v2';
const DB_VERSION = 1;

export interface StoredRom {
    gameCode: string;          // Ex: 'BPRE', 'BPEE', 'AXVE'
    title: string;             // Ex: 'POKEMON FIRE', 'POKEMON EMER'
    filename: string;
    romData: ArrayBuffer;
    size: number;
    addedAt: number;
    lastPlayedAt: number;
}

export interface StoredSave {
    gameCode: string;
    sramData: Uint8Array;
    updatedAt: number;
}

class MoeDexDatabase {
    private db: IDBDatabase | null = null;
    private initPromise: Promise<IDBDatabase> | null = null;

    public async getDB(): Promise<IDBDatabase> {
        if (this.db) return this.db;
        if (this.initPromise) return this.initPromise;

        this.initPromise = new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains('roms')) {
                    db.createObjectStore('roms', { keyPath: 'gameCode' });
                }
                if (!db.objectStoreNames.contains('saves')) {
                    db.createObjectStore('saves', { keyPath: 'gameCode' });
                }
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onerror = () => reject(new Error(`Erro ao abrir IndexedDB: ${request.error?.message}`));
        });

        return this.initPromise;
    }

    public async saveRom(rom: StoredRom): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('roms', 'readwrite');
            tx.objectStore('roms').put(rom);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    public async getRom(gameCode: string): Promise<StoredRom | null> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('roms', 'readonly');
            const req = tx.objectStore('roms').get(gameCode);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        });
    }

    public async listRoms(): Promise<Omit<StoredRom, 'romData'>[]> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('roms', 'readonly');
            const req = tx.objectStore('roms').getAll();
            req.onsuccess = () => {
                const results = (req.result || []).map(r => {
                    const { romData, ...meta } = r;
                    return meta;
                });
                resolve(results);
            };
            req.onerror = () => reject(req.error);
        });
    }

    public async saveSram(gameCode: string, sramData: Uint8Array): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('saves', 'readwrite');
            tx.objectStore('saves').put({ gameCode, sramData, updatedAt: Date.now() });
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    public async getSram(gameCode: string): Promise<StoredSave | null> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('saves', 'readonly');
            const req = tx.objectStore('saves').get(gameCode);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        });
    }
}

export const db = new MoeDexDatabase();
