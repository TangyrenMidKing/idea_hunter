import { adjectives, animals, colors, uniqueNamesGenerator } from 'unique-names-generator';

const ROOM_CODE_WORD_COUNT = 3;

export function normalizeRoomCode(code: string) {
  return code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function generateRoomCode() {
  return normalizeRoomCode(uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    length: ROOM_CODE_WORD_COUNT,
    separator: '-',
    style: 'upperCase',
  }));
}
