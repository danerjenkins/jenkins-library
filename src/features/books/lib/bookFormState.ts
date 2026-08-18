export interface BookFormSnapshot {
  title: string;
  author: string;
  genre: string;
  description: string;
  isbn: string;
  finished: boolean;
  coverUrl: string;
  coverPhotoUrl: string;
  format: string;
  pages: string;
  readByDane: boolean;
  readByEmma: boolean;
  ownershipStatus: "owned" | "wishlist";
  seriesName: string;
  seriesLabel: string;
  publisher: string;
  minPlayers: string;
  maxPlayers: string;
  playTimeMinutes: string;
  minAge: string;
  complexity: string;
  category: string;
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim();
}

export function createBookFormSnapshot(
  snapshot: Omit<BookFormSnapshot, "coverPhotoUrl"> & {
    coverPhotoUrl: string | null;
  },
): BookFormSnapshot {
  return {
    title: normalizeText(snapshot.title),
    author: normalizeText(snapshot.author),
    genre: normalizeText(snapshot.genre),
    description: normalizeText(snapshot.description),
    isbn: normalizeText(snapshot.isbn),
    finished: snapshot.finished,
    coverUrl: normalizeText(snapshot.coverUrl),
    coverPhotoUrl: normalizeText(snapshot.coverPhotoUrl),
    format: normalizeText(snapshot.format),
    pages: normalizeText(snapshot.pages),
    readByDane: snapshot.readByDane,
    readByEmma: snapshot.readByEmma,
    ownershipStatus: snapshot.ownershipStatus,
    seriesName: normalizeText(snapshot.seriesName),
    seriesLabel: normalizeText(snapshot.seriesLabel),
    publisher: normalizeText(snapshot.publisher),
    minPlayers: normalizeText(snapshot.minPlayers),
    maxPlayers: normalizeText(snapshot.maxPlayers),
    playTimeMinutes: normalizeText(snapshot.playTimeMinutes),
    minAge: normalizeText(snapshot.minAge),
    complexity: normalizeText(snapshot.complexity),
    category: normalizeText(snapshot.category),
  };
}

export function serializeBookFormSnapshot(snapshot: BookFormSnapshot) {
  return JSON.stringify(snapshot);
}
