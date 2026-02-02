/**
 * Open Library API integration
 * https://openlibrary.org/dev/docs/api/search
 */

export interface OpenLibraryCandidate {
  key: string;
  title: string;
  author?: string;
  coverUrl: string;
}

export interface TitleSuggestion {
  key: string;
  title: string;
  author?: string;
  year?: number;
  isbn?: string;
  coverUrl?: string;
  subjects?: string[];
}

interface OpenLibrarySearchDoc {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  isbn?: string[];
  cover_edition_key?: string;
  first_publish_year?: number;
  subject?: string[];
  subject_facet?: string[];
}

interface OpenLibrarySearchResponse {
  docs: OpenLibrarySearchDoc[];
  numFound: number;
}

/**
 * Search for book cover candidates using Open Library API
 */
export async function searchCoverCandidates(params: {
  title: string;
  author: string;
}): Promise<OpenLibraryCandidate[]> {
  const { title, author } = params;

  if (!title.trim() && !author.trim()) {
    return [];
  }

  try {
    // Build search query
    const searchParams = new URLSearchParams();
    if (title.trim()) {
      searchParams.set("title", title.trim());
    }
    if (author.trim()) {
      searchParams.set("author", author.trim());
    }
    searchParams.set("limit", "10");

    const url = `https://openlibrary.org/search.json?${searchParams.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Open Library API returned ${response.status}`);
    }

    const data: OpenLibrarySearchResponse = await response.json();

    // Build candidates from search results
    const candidates: OpenLibraryCandidate[] = [];
    const seenUrls = new Set<string>();

    for (const doc of data.docs) {
      let coverUrl: string | null = null;

      // Prefer cover_i (most reliable)
      if (doc.cover_i) {
        coverUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
      }
      // Fallback to ISBN if available
      else if (doc.isbn && doc.isbn.length > 0) {
        coverUrl = `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-M.jpg`;
      }
      // Fallback to OLID if available
      else if (doc.cover_edition_key) {
        coverUrl = `https://covers.openlibrary.org/b/olid/${doc.cover_edition_key}-M.jpg`;
      }

      // Only include if we have a cover URL and haven't seen it before
      if (coverUrl && !seenUrls.has(coverUrl)) {
        seenUrls.add(coverUrl);
        candidates.push({
          key: doc.key,
          title: doc.title,
          author: doc.author_name?.[0],
          coverUrl,
        });

        // Limit to 8 candidates
        if (candidates.length >= 8) {
          break;
        }
      }
    }

    return candidates;
  } catch (error) {
    console.error("Failed to search Open Library:", error);
    throw error;
  }
}

/**
 * Guess the most likely author for a given book title
 * Returns null if no author can be determined
 */
export async function guessAuthorByTitle(
  title: string,
): Promise<{ author: string; confidenceHint?: string } | null> {
  if (!title.trim() || title.trim().length < 4) {
    return null;
  }

  try {
    const searchParams = new URLSearchParams();
    searchParams.set("title", title.trim());
    searchParams.set("limit", "5");

    const url = `https://openlibrary.org/search.json?${searchParams.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Open Library API returned ${response.status}`);
    }

    const data: OpenLibrarySearchResponse = await response.json();

    // Use the first result with an author
    for (const doc of data.docs) {
      if (doc.author_name && doc.author_name.length > 0) {
        // Use first author or join first two with comma
        const author =
          doc.author_name.length === 1
            ? doc.author_name[0]
            : doc.author_name.slice(0, 2).join(", ");

        return {
          author,
          confidenceHint:
            data.numFound > 1 ? "Multiple matches found" : undefined,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Failed to guess author from Open Library:", error);
    return null;
  }
}

/**
 * Search for title suggestions with typeahead/autocomplete
 */
export async function searchTitleSuggestions(
  titleQuery: string,
): Promise<TitleSuggestion[]> {
  if (!titleQuery.trim() || titleQuery.trim().length < 3) {
    return [];
  }

  try {
    const searchParams = new URLSearchParams();
    searchParams.set("title", titleQuery.trim());
    searchParams.set("limit", "8");

    const url = `https://openlibrary.org/search.json?${searchParams.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Open Library API returned ${response.status}`);
    }

    const data: OpenLibrarySearchResponse = await response.json();

    // Build suggestions from search results
    const suggestions: TitleSuggestion[] = [];
    const seenKeys = new Set<string>();

    for (const doc of data.docs) {
      // Create dedup key from title + author
      const author = doc.author_name?.[0];
      const dedupKey = `${doc.title}|${author || ""}`;

      if (seenKeys.has(dedupKey)) {
        continue;
      }
      seenKeys.add(dedupKey);

      // Choose best ISBN (prefer 13-digit, else first)
      let isbn: string | undefined;
      if (doc.isbn && doc.isbn.length > 0) {
        const isbn13 = doc.isbn.find((i) => i.length === 13);
        isbn = isbn13 || doc.isbn[0];
      }

      // Derive cover URL if cover_i exists
      let coverUrl: string | undefined;
      if (doc.cover_i) {
        coverUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-S.jpg`;
      }

      const subjects = (doc.subject || doc.subject_facet || [])
        .filter((s) => typeof s === "string")
        .slice(0, 10);

      suggestions.push({
        key: doc.key,
        title: doc.title,
        author,
        year: doc.first_publish_year,
        isbn,
        coverUrl,
        subjects: subjects.length > 0 ? subjects : undefined,
      });

      // Limit to 8 suggestions
      if (suggestions.length >= 8) {
        break;
      }
    }

    return suggestions;
  } catch (error) {
    console.error(
      "Failed to search title suggestions from Open Library:",
      error,
    );
    return [];
  }
}

/**
 * Predict a simple genre based on Open Library subjects
 */
export function predictGenreFromSubjects(subjects?: string[]): string | null {
  if (!subjects || subjects.length === 0) {
    return null;
  }

  const normalized = subjects.map((s) => s.toLowerCase()).join(" |");

  if (normalized.includes("science fiction")) return "Science Fiction";
  if (normalized.includes("fantasy")) return "Fantasy";
  if (normalized.includes("fiction")) return "Fiction";
  if (normalized.includes("history")) return "History";
  if (normalized.includes("biography") || normalized.includes("biographical")) {
    return "Biography";
  }
  if (normalized.includes("religion") || normalized.includes("theology")) {
    return "Theology";
  }
  if (normalized.includes("philosophy")) return "Philosophy";
  if (normalized.includes("self-help") || normalized.includes("psychology")) {
    return "Self-Help";
  }
  if (normalized.includes("children")) return "Children";
  if (normalized.includes("young adult") || normalized.includes("ya")) {
    return "Young Adult";
  }

  return null;
}
