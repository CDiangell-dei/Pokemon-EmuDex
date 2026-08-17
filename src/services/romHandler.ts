/**
 * MoeDex GBA Cloud - ROM Handler
 * Gerencia descompressão ZIP (fflate), leitura de Header GBA (0xA0..0xAF) e URLs seguras de Blob
 */

import { unzipSync } from 'fflate';
import { db, StoredRom } from './db';

export interface RomHeaderInfo {
    title: string;             // 12 chars no offset 0xA0
    gameCode: string;          // 4 chars no offset 0xAC
    makerCode: string;         // 2 chars no offset 0xB0
    headerChecksum: number;    // byte 0xBD
    headerValid: boolean;
    baseGame: string;
    isMoemonLikely: boolean;
}

export function parseGbaHeader(buffer: ArrayBuffer): RomHeaderInfo {
    if (buffer.byteLength < 0xC0) {
        throw new Error("Arquivo menor que o cabeçalho mínimo do Game Boy Advance (192 bytes).");
    }

    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);

    let rawTitle = '';
    for (let i = 0x00A0; i < 0x00AC; i++) {
        const b = bytes[i];
        if (b === 0) break;
        if (b >= 32 && b <= 126) rawTitle += String.fromCharCode(b);
    }
    const title = rawTitle.trim() || 'POKEMON GBA';

    let gameCode = '';
    for (let i = 0x00AC; i < 0x00B0; i++) {
        const b = bytes[i];
        if (b >= 32 && b <= 126) gameCode += String.fromCharCode(b);
    }
    gameCode = gameCode.trim() || 'BPEE';

    let chk = 0;
    for (let i = 0x00A0; i <= 0x00BC; i++) {
        chk = (chk - bytes[i]) & 0xFF;
    }
    chk = (chk - 0x19) & 0xFF;
    const expectedChecksum = view.getUint8(0x00BD);
    const headerValid = (chk === expectedChecksum);

    const baseGame = identifyBaseGame(gameCode, title);
    const isMoemonLikely = title.toUpperCase().includes('MOE') || title.toUpperCase().includes('MM');

    return {
        title,
        gameCode,
        makerCode: '01',
        headerChecksum: expectedChecksum,
        headerValid,
        baseGame,
        isMoemonLikely
    };
}

export function identifyBaseGame(gameCode: string, title: string): string {
    const code = gameCode.toUpperCase();
    const t = title.toUpperCase();

    if (code.startsWith('BPR') || t.includes('FIRE') || t.includes('RED')) return 'FireRed';
    if (code.startsWith('BPG') || t.includes('LEAF') || t.includes('GREEN')) return 'LeafGreen';
    if (code.startsWith('BPE') || t.includes('EMER') || t.includes('ESME')) return 'Emerald';
    if (code.startsWith('AXV') || t.includes('RUBY')) return 'Ruby';
    if (code.startsWith('AXP') || t.includes('SAPP')) return 'Sapphire';
    return 'Pokémon Gen 3 GBA';
}

class BlobUrlRegistry {
    private urls = new Set<string>();

    public create(buffer: ArrayBuffer, mimeType: string = 'application/octet-stream'): string {
        const blob = new Blob([buffer], { type: mimeType });
        const url = URL.createObjectURL(blob);
        this.urls.add(url);
        return url;
    }

    public revoke(url: string): void {
        if (this.urls.has(url)) {
            URL.revokeObjectURL(url);
            this.urls.delete(url);
        }
    }

    public revokeAll(): void {
        this.urls.forEach(url => URL.revokeObjectURL(url));
        this.urls.clear();
    }
}

export const blobManager = new BlobUrlRegistry();

export async function processRomUpload(file: File): Promise<{ header: RomHeaderInfo; storedRom: StoredRom }> {
    const rawBuffer = await file.arrayBuffer();
    let finalGbaBuffer: ArrayBuffer | null = null;
    let extractedName = file.name;

    if (file.name.toLowerCase().endsWith('.zip')) {
        const unzipped = unzipSync(new Uint8Array(rawBuffer));
        const gbaFileName = Object.keys(unzipped).find(n => n.toLowerCase().endsWith('.gba'));
        if (!gbaFileName) {
            throw new Error("Nenhum arquivo .gba foi encontrado dentro do arquivo ZIP enviado.");
        }
        const decompressed = unzipped[gbaFileName];
        finalGbaBuffer = decompressed.buffer.slice(decompressed.byteOffset, decompressed.byteOffset + decompressed.byteLength);
        extractedName = gbaFileName;
    } else if (file.name.toLowerCase().endsWith('.gba')) {
        finalGbaBuffer = rawBuffer;
    } else {
        throw new Error("Formato não suportado. Por favor, selecione um arquivo .gba ou .zip.");
    }

    const header = parseGbaHeader(finalGbaBuffer);

    const storedRom: StoredRom = {
        gameCode: header.gameCode,
        title: header.title,
        filename: extractedName,
        romData: finalGbaBuffer,
        size: finalGbaBuffer.byteLength,
        addedAt: Date.now(),
        lastPlayedAt: Date.now()
    };

    await db.saveRom(storedRom);

    return { header, storedRom };
}
