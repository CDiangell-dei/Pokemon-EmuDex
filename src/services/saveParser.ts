/**
 * MoeDex GBA Cloud - Auto-Parser Gen 3 (.sav / .srm)
 * Descriptografa os blocos de memória com PID^OTID e extrai Pokédex, Equipe, 14 Caixas do PC e Nuzlocke Faints
 */

import { PokemonIvStats, PokemonEvStats, PokemonCombatStats } from '../types/pokemon';

export interface ParsedPokemon {
    speciesId: number;
    nickname: string;
    level: number;
    experience: number;
    personality: number;
    otId: number;
    isShiny: boolean;
    isFainted: boolean;
    gender: 'male' | 'female' | 'genderless';
    nature: string;
    currentHp: number;
    maxHp: number;
    heldItem: number;
    moves: number[];
    ivs: PokemonIvStats;
    evs: PokemonEvStats;
    stats?: PokemonCombatStats;
    location: 'party' | 'box';
    boxNumber?: number;
}

export interface ParsedSaveData {
    trainerName: string;
    trainerId: number;
    secretId: number;
    gender: 'boy' | 'girl';
    playTime: {
        hours: number;
        minutes: number;
        seconds: number;
        formatted: string;
    };
    party: ParsedPokemon[];
    boxes: ParsedPokemon[];
    allCaughtDexIds: number[];
    faintedNuzlockeIds: number[];
    activeSlot: 'A' | 'B';
    saveIndex: number;
}

const SECTOR_SIZE = 4096;
const SECTORS_PER_SLOT = 14;
const SIGNATURE = 0x08012025;

const NATURES = [
    'Hardy', 'Lonely', 'Brave', 'Adamant', 'Naughty',
    'Bold', 'Docile', 'Relaxed', 'Impish', 'Lax',
    'Timid', 'Hasty', 'Serious', 'Jolly', 'Naive',
    'Modest', 'Mild', 'Quiet', 'Bashful', 'Rash',
    'Calm', 'Gentle', 'Sassy', 'Careful', 'Quirky'
];

const GEN3_CHARMAP: Record<number, string> = {
    0x00: ' ',
    0xA1: '0', 0xA2: '1', 0xA3: '2', 0xA4: '3', 0xA5: '4',
    0xA6: '5', 0xA7: '6', 0xA8: '7', 0xA9: '8', 0xAA: '9',
    0xBB: 'A', 0xBC: 'B', 0xBD: 'C', 0xBE: 'D', 0xBF: 'E',
    0xC0: 'F', 0xC1: 'G', 0xC2: 'H', 0xC3: 'I', 0xC4: 'J',
    0xC5: 'K', 0xC6: 'L', 0xC7: 'M', 0xC8: 'N', 0xC9: 'O',
    0xCA: 'P', 0xCB: 'Q', 0xCC: 'R', 0xCD: 'S', 0xCE: 'T',
    0xCF: 'U', 0xD0: 'V', 0xD1: 'W', 0xD2: 'X', 0xD3: 'Y',
    0xD4: 'Z',
    0xD5: 'a', 0xD6: 'b', 0xD7: 'c', 0xD8: 'd', 0xD9: 'e',
    0xDA: 'f', 0xDB: 'g', 0xDC: 'h', 0xDD: 'i', 0xDE: 'j',
    0xDF: 'k', 0xE0: 'l', 0xE1: 'm', 0xE2: 'n', 0xE3: 'o',
    0xE4: 'p', 0xE5: 'q', 0xE6: 'r', 0xE7: 's', 0xE8: 't',
    0xE9: 'u', 0xEA: 'v', 0xEB: 'w', 0xEC: 'x', 0xED: 'y',
    0xEE: 'z',
    0xFF: ''
};

function decodeGen3String(bytes: Uint8Array, offset: number, maxLength: number): string {
    let result = '';
    for (let i = 0; i < maxLength; i++) {
        const b = bytes[offset + i];
        if (b === 0xFF || b === 0x00) break;
        result += GEN3_CHARMAP[b] || '?';
    }
    return result.trim();
}

const SUBSTRUCTURE_ORDERS: string[] = [
    'GAEM', 'GAME', 'GEAM', 'GEMA', 'GMAE', 'GMEA',
    'AGEM', 'AGME', 'AEGM', 'AEMG', 'AMGE', 'AMEG',
    'EGAM', 'EGMA', 'EAGM', 'EAMG', 'EMGA', 'EMAG',
    'MGAE', 'MGEA', 'MAGE', 'MAEG', 'MEGA', 'MEAG'
];

export function parseGen3Save(buffer: ArrayBuffer | Uint8Array, gameCodeHint: string = 'BPEE'): ParsedSaveData {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    if (bytes.length < 65536) {
        throw new Error("Arquivo de save muito pequeno para o formato Game Boy Advance (mínimo 64KB).");
    }

    const slotASectors: Map<number, Uint8Array> = new Map();
    const slotBSectors: Map<number, Uint8Array> = new Map();

    let slotAMaxIndex = -1;
    let slotBMaxIndex = -1;

    for (let sec = 0; sec < 14; sec++) {
        const offset = sec * SECTOR_SIZE;
        const view = new DataView(bytes.buffer, bytes.byteOffset + offset, SECTOR_SIZE);
        const sectionId = view.getUint16(0x0FF4, true);
        const sig = view.getUint32(0x0FF8, true);
        const saveIndex = view.getUint32(0x0FFC, true);

        if (sig === SIGNATURE && sectionId < 14) {
            slotASectors.set(sectionId, bytes.subarray(offset, offset + SECTOR_SIZE));
            if (saveIndex > slotAMaxIndex) slotAMaxIndex = saveIndex;
        }
    }

    if (bytes.length >= 131072) {
        for (let sec = 14; sec < 28; sec++) {
            const offset = sec * SECTOR_SIZE;
            const view = new DataView(bytes.buffer, bytes.byteOffset + offset, SECTOR_SIZE);
            const sectionId = view.getUint16(0x0FF4, true);
            const sig = view.getUint32(0x0FF8, true);
            const saveIndex = view.getUint32(0x0FFC, true);

            if (sig === SIGNATURE && sectionId < 14) {
                slotBSectors.set(sectionId, bytes.subarray(offset, offset + SECTOR_SIZE));
                if (saveIndex > slotBMaxIndex) slotBMaxIndex = saveIndex;
            }
        }
    }

    const useSlotB = (slotBMaxIndex > slotAMaxIndex && slotBSectors.size >= 10);
    const activeSectors = useSlotB ? slotBSectors : slotASectors;
    const activeSlot = useSlotB ? 'B' : 'A';
    const activeSaveIndex = useSlotB ? slotBMaxIndex : slotAMaxIndex;

    const sec0 = activeSectors.get(0);
    let trainerName = 'Treinador';
    let trainerId = 0;
    let secretId = 0;
    let gender: 'boy' | 'girl' = 'boy';
    let playTime = { hours: 0, minutes: 0, seconds: 0, formatted: '00:00:00' };

    if (sec0) {
        const view0 = new DataView(sec0.buffer, sec0.byteOffset, sec0.byteLength);
        trainerName = decodeGen3String(sec0, 0x0000, 7) || 'Treinador';
        gender = sec0[0x0008] === 1 ? 'girl' : 'boy';
        trainerId = view0.getUint16(0x000A, true);
        secretId = view0.getUint16(0x000C, true);

        const hours = view0.getUint16(0x000E, true);
        const minutes = sec0[0x0010];
        const seconds = sec0[0x0011];
        playTime = {
            hours,
            minutes,
            seconds,
            formatted: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        };
    }

    const party: ParsedPokemon[] = [];
    const sec1 = activeSectors.get(1);
    const isRS = gameCodeHint.startsWith('AXV') || gameCodeHint.startsWith('AXP');
    const partyOffset = isRS ? 0x0234 : 0x0034;

    if (sec1 && sec1.length >= partyOffset + 4) {
        const view1 = new DataView(sec1.buffer, sec1.byteOffset, sec1.byteLength);
        const partyCount = Math.min(6, view1.getUint32(partyOffset, true));

        for (let i = 0; i < partyCount; i++) {
            const pOffset = partyOffset + 4 + (i * 100);
            if (pOffset + 100 <= sec1.length) {
                const monBytes = sec1.subarray(pOffset, pOffset + 100);
                const mon = parsePokemonStruct(monBytes, trainerId, secretId, true);
                if (mon && mon.speciesId > 0 && mon.speciesId <= 1025) {
                    party.push(mon);
                }
            }
        }
    }

    const boxes: ParsedPokemon[] = [];
    const pcBoxData = new Uint8Array(4096 * 9);
    for (let secId = 5; secId <= 13; secId++) {
        const secData = activeSectors.get(secId);
        if (secData) {
            pcBoxData.set(secData.subarray(0, 3968), (secId - 5) * 3968);
        }
    }

    const BOX_STRUCT_SIZE = 80;
    const TOTAL_BOX_MONS = 14 * 30; // 420
    const startPcOffset = 4;

    for (let i = 0; i < TOTAL_BOX_MONS; i++) {
        const monOffset = startPcOffset + (i * BOX_STRUCT_SIZE);
        if (monOffset + BOX_STRUCT_SIZE <= pcBoxData.length) {
            const monBytes = pcBoxData.subarray(monOffset, monOffset + BOX_STRUCT_SIZE);
            const mon = parsePokemonStruct(monBytes, trainerId, secretId, false);
            if (mon && mon.speciesId > 0 && mon.speciesId <= 1025) {
                mon.boxNumber = Math.floor(i / 30) + 1;
                boxes.push(mon);
            }
        }
    }

    const caughtSet = new Set<number>();
    party.forEach(p => caughtSet.add(p.speciesId));
    boxes.forEach(p => caughtSet.add(p.speciesId));

    const faintedNuzlockeIds: number[] = party.filter(p => p.isFainted).map(p => p.speciesId);

    return {
        trainerName,
        trainerId,
        secretId,
        gender,
        playTime,
        party,
        boxes,
        allCaughtDexIds: Array.from(caughtSet),
        faintedNuzlockeIds,
        activeSlot,
        saveIndex: activeSaveIndex
    };
}

function parsePokemonStruct(bytes: Uint8Array, playerTid: number, playerSid: number, isParty: boolean): ParsedPokemon | null {
    if (bytes.length < 80) return null;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    const pid = view.getUint32(0x00, true);
    const otid = view.getUint32(0x04, true);
    if (pid === 0 && otid === 0) return null;

    const nickname = decodeGen3String(bytes, 0x08, 10);
    const key = pid ^ otid;

    const encBytes = bytes.subarray(0x20, 0x20 + 48);
    const decBytes = new Uint8Array(48);
    const decView = new DataView(decBytes.buffer);

    const encView = new DataView(encBytes.buffer, encBytes.byteOffset, encBytes.byteLength);
    for (let i = 0; i < 12; i++) {
        const decryptedWord = encView.getUint32(i * 4, true) ^ key;
        decView.setUint32(i * 4, decryptedWord, true);
    }

    const orderIndex = pid % 24;
    const order = SUBSTRUCTURE_ORDERS[orderIndex];

    const substructs: Record<string, Uint8Array> = {};
    for (let i = 0; i < 4; i++) {
        const char = order[i];
        substructs[char] = decBytes.subarray(i * 12, (i + 1) * 12);
    }

    const gBytes = substructs['G'];
    const gView = new DataView(gBytes.buffer, gBytes.byteOffset, gBytes.byteLength);
    const rawSpecies = gView.getUint16(0x00, true);
    const heldItem = gView.getUint16(0x02, true);
    const experience = gView.getUint32(0x04, true);

    const aBytes = substructs['A'];
    const aView = new DataView(aBytes.buffer, aBytes.byteOffset, aBytes.byteLength);
    const moves = [
        aView.getUint16(0x00, true),
        aView.getUint16(0x02, true),
        aView.getUint16(0x04, true),
        aView.getUint16(0x06, true)
    ].filter(m => m > 0);

    const eBytes = substructs['E'];
    const evs: PokemonEvStats = {
        hp: eBytes[0],
        attack: eBytes[1],
        defense: eBytes[2],
        speed: eBytes[3],
        spAttack: eBytes[4],
        spDefense: eBytes[5]
    };

    const mBytes = substructs['M'];
    const mView = new DataView(mBytes.buffer, mBytes.byteOffset, mBytes.byteLength);
    const ivData = mView.getUint32(0x04, true);

    const ivHp = ivData & 0x1F;
    const ivAtk = (ivData >> 5) & 0x1F;
    const ivDef = (ivData >> 10) & 0x1F;
    const ivSpeed = (ivData >> 15) & 0x1F;
    const ivSpAtk = (ivData >> 20) & 0x1F;
    const ivSpDef = (ivData >> 25) & 0x1F;
    const ivTotal = ivHp + ivAtk + ivDef + ivSpeed + ivSpAtk + ivSpDef;
    const ivPercent = Math.round((ivTotal / 186) * 100);

    const ivs: PokemonIvStats = {
        hp: ivHp,
        attack: ivAtk,
        defense: ivDef,
        speed: ivSpeed,
        spAttack: ivSpAtk,
        spDefense: ivSpDef,
        total: ivTotal,
        percent: ivPercent
    };

    const tid16 = otid & 0xFFFF;
    const sid16 = (otid >> 16) & 0xFFFF;
    const pidHi = (pid >> 16) & 0xFFFF;
    const pidLo = pid & 0xFFFF;
    const isShiny = ((tid16 ^ sid16 ^ pidHi ^ pidLo) < 8);

    const nature = NATURES[pid % 25] || 'Hardy';

    let level = 1;
    let currentHp = 10;
    let maxHp = 10;
    let isFainted = false;
    let stats: PokemonCombatStats | undefined = undefined;

    if (isParty && bytes.length >= 100) {
        level = bytes[84];
        currentHp = view.getUint16(86, true);
        maxHp = view.getUint16(88, true);
        isFainted = (currentHp === 0);

        stats = {
            attack: view.getUint16(90, true),
            defense: view.getUint16(92, true),
            speed: view.getUint16(94, true),
            spAttack: view.getUint16(96, true),
            spDefense: view.getUint16(98, true)
        };
    }

    return {
        speciesId: rawSpecies,
        nickname: nickname || `Pokémon #${rawSpecies}`,
        level,
        experience,
        personality: pid,
        otId: otid,
        isShiny,
        isFainted,
        gender: 'genderless',
        nature,
        currentHp,
        maxHp,
        heldItem,
        moves,
        ivs,
        evs,
        stats,
        location: isParty ? 'party' : 'box'
    };
}
