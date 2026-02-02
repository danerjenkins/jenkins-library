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

interface OpenLibrarySearchDoc {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  isbn?: string[];
  cover_edition_key?: string;
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
