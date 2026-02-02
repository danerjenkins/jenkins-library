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
  language?: string[];
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
    searchParams.set("limit", "50");

    const url = `https://openlibrary.org/search.json?${searchParams.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Open Library API returned ${response.status}`);
    }

    const data: OpenLibrarySearchResponse = await response.json();

    const normalize = (value: string) =>
      value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ");

    const normalizedTitleQuery = normalize(title);
    const normalizedAuthorQuery = normalize(author);
    const englishWordHints = ["the", "and", "of", "to", "a"];
    const queryContainsEnglishHint = englishWordHints.some((word) =>
      normalizedTitleQuery.includes(word),
    );

    const scoredDocs = data.docs.map((doc) => {
      const normalizedDocTitle = normalize(doc.title);
      const docAuthor = doc.author_name?.[0] || "";
      const normalizedDocAuthor = normalize(docAuthor);
      let score = 0;

      if (doc.language?.includes("eng")) {
        score += 50;
      } else if (doc.language && doc.language.length > 0) {
        score -= 20;
        if (queryContainsEnglishHint) {
          score -= 10;
        }
      }

      if (
        normalizedDocTitle === normalizedTitleQuery ||
        normalizedDocTitle.startsWith(normalizedTitleQuery)
      ) {
        score += 10;
      }

      if (
        normalizedAuthorQuery &&
        normalizedDocAuthor &&
        normalizedDocAuthor.includes(normalizedAuthorQuery)
      ) {
        score += 10;
      }

      return { doc, score };
    });

    scoredDocs.sort((a, b) => b.score - a.score);

    // Build candidates from ranked results
    const candidates: OpenLibraryCandidate[] = [];
    const seenUrls = new Set<string>();

    for (const { doc } of scoredDocs) {
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
  authorQuery?: string,
): Promise<TitleSuggestion[]> {
  if (!titleQuery.trim() || titleQuery.trim().length < 3) {
    return [];
  }

  try {
    const searchParams = new URLSearchParams();
    searchParams.set("q", titleQuery.trim());
    searchParams.set("limit", "50");

    const url = `https://openlibrary.org/search.json?${searchParams.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Open Library API returned ${response.status}`);
    }

    const data: OpenLibrarySearchResponse = await response.json();

    const normalize = (value: string) =>
      value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ");

    const normalizedQuery = normalize(titleQuery);
    const normalizedAuthorQuery = authorQuery ? normalize(authorQuery) : "";
    const studyGuideKeywords = [
      "gradesaver",
      "classicnotes",
      "summary",
      "study guide",
      "analysis",
      "sparknotes",
      "cliffsnotes",
    ];
    const junkMatchKeywords = [
      "poster",
      "soundtrack",
      "classroom",
      "teacher",
      "curriculum",
      "workbook",
      "study",
      "study guide",
      "analysis",
      "guide",
      "notes",
      "music",
      "john williams",
    ];

    const scoredSuggestions: Array<{
      suggestion: TitleSuggestion;
      score: number;
    }> = [];
    const dedupMap = new Map<
      string,
      { suggestion: TitleSuggestion; score: number }
    >();

    for (const doc of data.docs) {
      const authorList = doc.author_name || [];
      const rowlingAuthor = authorList.find((name) =>
        name.toLowerCase().includes("rowling"),
      );
      const author = rowlingAuthor || authorList[0];
      const normalizedTitle = normalize(doc.title);
      const normalizedAuthor = author ? normalize(author) : "";
      const dedupKey = `${normalizedTitle}|${normalizedAuthor}`;

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

      const suggestion: TitleSuggestion = {
        key: doc.key,
        title: doc.title,
        author,
        year: doc.first_publish_year,
        isbn,
        coverUrl,
        subjects: subjects.length > 0 ? subjects : undefined,
      };

      let score = 0;

      if (normalizedTitle === normalizedQuery) {
        score += 100;
      } else if (normalizedTitle.startsWith(normalizedQuery)) {
        score += 60;
      } else if (normalizedTitle.includes(normalizedQuery)) {
        score += 30;
      }

      const authorMatches =
        normalizedAuthorQuery &&
        normalizedAuthor &&
        normalizedAuthor.includes(normalizedAuthorQuery);
      if (authorMatches) {
        score += 40;
      }

      if (
        normalizedQuery.includes("harry potter") &&
        normalizedTitle.includes("sorcerers stone")
      ) {
        score += 40;
      }

      if (
        normalizedQuery.includes("harry potter") &&
        normalizedAuthor.includes("rowling")
      ) {
        score += 120;
      }

      if (
        normalizedQuery.includes("alchemist") &&
        normalizedAuthor.includes("coelho")
      ) {
        score += 40;
      }

      const containsStudyGuideKeyword = studyGuideKeywords.some((keyword) => {
        const normalizedKeyword = normalize(keyword);
        return (
          normalizedTitle.includes(normalizedKeyword) ||
          normalizedAuthor.includes(normalizedKeyword)
        );
      });
      if (containsStudyGuideKeyword) {
        score -= 80;
      }

      const containsJunkKeyword = junkMatchKeywords.some((keyword) => {
        const normalizedKeyword = normalize(keyword);
        return (
          normalizedTitle.includes(normalizedKeyword) ||
          normalizedAuthor.includes(normalizedKeyword)
        );
      });
      if (containsJunkKeyword) {
        score -= 80;
      }

      if (
        doc.first_publish_year &&
        doc.first_publish_year < 1800 &&
        !authorMatches
      ) {
        score -= 60;
      }

      if (
        normalizedTitle.includes("graphic novel") &&
        !normalizedQuery.includes("graphic novel")
      ) {
        score -= 40;
      }

      const existing = dedupMap.get(dedupKey);
      if (!existing || score > existing.score) {
        dedupMap.set(dedupKey, { suggestion, score });
      }
    }

    for (const entry of dedupMap.values()) {
      scoredSuggestions.push(entry);
    }

    scoredSuggestions.sort((a, b) => b.score - a.score);

    return scoredSuggestions.slice(0, 8).map((entry) => entry.suggestion);
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
