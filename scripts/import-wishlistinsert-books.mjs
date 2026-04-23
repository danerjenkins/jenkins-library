import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const WISHLIST_PATH = path.join(ROOT, "wishlistinsert.md");
const ENV_PATH = path.join(ROOT, ".env");

const TITLE_FIXES = {
  "Notes from a Dead House": {
    title: "Notes from the House of the Dead",
    author: "Fyodor Dostoevsky",
  },
};

const SERIES_RULES = {
  "Dune Messiah": { name: "Dune", label: "2", sort: 2 },
  "Shadow of the Giant": { name: "Shadow series", label: "4", sort: 4 },
  "Shadows in Flight": { name: "Shadow series", label: "5", sort: 5 },
  "The Last Shadow": { name: "Shadow series", label: "6", sort: 6 },
  "Wrath of the Triple Goddess": {
    name: "Percy Jackson",
    label: "7",
    sort: 7,
  },
  "The Red Pyramid": { name: "The Kane Chronicles", label: "1", sort: 1 },
  "The Throne of Fire": { name: "The Kane Chronicles", label: "2", sort: 2 },
  "The Serpent's Shadow": {
    name: "The Kane Chronicles",
    label: "3",
    sort: 3,
  },
  "Assassin's Apprentice": {
    name: "The Farseer Trilogy",
    label: "1",
    sort: 1,
  },
  "Royal Assassin": {
    name: "The Farseer Trilogy",
    label: "2",
    sort: 2,
  },
  "Assassin's Quest": {
    name: "The Farseer Trilogy",
    label: "3",
    sort: 3,
  },
  "A Wizard of Earthsea": { name: "Earthsea Cycle", label: "1", sort: 1 },
  "Tales from Earthsea": { name: "Earthsea Cycle", label: "5", sort: 5 },
  "Catching Fire": { name: "The Hunger Games", label: "2", sort: 2 },
  "The Ballad of Songbirds and Snakes": {
    name: "The Hunger Games",
    label: "0.25",
    sort: 0.25,
  },
  "Artemis Fowl": { name: "Artemis Fowl", label: "1", sort: 1 },
  "The Lost Hero": { name: "The Heroes of Olympus", label: "1", sort: 1 },
  "The Son of Neptune": {
    name: "The Heroes of Olympus",
    label: "2",
    sort: 2,
  },
  "The Mark of Athena": {
    name: "The Heroes of Olympus",
    label: "3",
    sort: 3,
  },
  "The House of Hades": {
    name: "The Heroes of Olympus",
    label: "4",
    sort: 4,
  },
  "The Blood of Olympus": {
    name: "The Heroes of Olympus",
    label: "5",
    sort: 5,
  },
};

function parseEnvFile(filePath) {
  const result = {};
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    result[line.slice(0, idx)] = line.slice(idx + 1);
  }
  return result;
}

function normalize(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(the|a|an)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(text) {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&lsquo;|&rsquo;/g, "'")
    .replace(/&mdash;/g, "-")
    .replace(/&ndash;/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitleAuthor(line) {
  const body = line.replace(/^\s*-\s*/, "").trim();
  for (const sep of [" â€” ", " — ", " – ", " - "]) {
    const idx = body.indexOf(sep);
    if (idx >= 0) {
      return {
        title: body.slice(0, idx).trim(),
        author: body.slice(idx + sep.length).trim(),
      };
    }
  }
  return { title: body.trim(), author: "" };
}

function parseWishlist(filePath) {
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const items = [];
  let section = "";
  for (const line of lines) {
    if (line.startsWith("## ")) {
      section = line.replace(/^##\s*/, "").trim();
      continue;
    }
    if (!/^\s*-\s+/.test(line)) continue;
    const parsed = extractTitleAuthor(line);
    const fixed = TITLE_FIXES[parsed.title] ?? parsed;
    items.push({
      originalTitle: parsed.title,
      title: fixed.title,
      author: fixed.author,
      section,
    });
  }
  return items;
}

function extractYear(publishedDate) {
  if (!publishedDate) return null;
  const match = String(publishedDate).match(/\d{4}/);
  return match ? Number(match[0]) : null;
}

function extractIsbn(industryIdentifiers) {
  if (!Array.isArray(industryIdentifiers)) return null;
  const isbn13 = industryIdentifiers.find((item) => item.type === "ISBN_13");
  if (isbn13?.identifier) return isbn13.identifier;
  const isbn10 = industryIdentifiers.find((item) => item.type === "ISBN_10");
  return isbn10?.identifier ?? null;
}

function authorScore(candidateAuthors, targetAuthor) {
  if (!targetAuthor) return 0;
  const target = normalize(targetAuthor);
  const joined = normalize((candidateAuthors ?? []).join(" "));
  if (!joined) return 0;
  if (joined === target) return 60;
  if (joined.includes(target) || target.includes(joined)) return 40;
  const tokens = target.split(" ").filter((token) => token.length > 2);
  const matches = tokens.filter((token) => joined.includes(token)).length;
  return matches * 8;
}

function titleScore(candidateTitle, targetTitle) {
  const candidate = normalize(candidateTitle ?? "");
  const target = normalize(targetTitle);
  if (!candidate) return 0;
  if (candidate === target) return 200;
  if (candidate.startsWith(target) || target.startsWith(candidate)) return 120;
  if (candidate.includes(target) || target.includes(candidate)) return 80;
  const candidateTokens = new Set(candidate.split(" "));
  let overlap = 0;
  for (const token of target.split(" ")) {
    if (candidateTokens.has(token)) overlap += 1;
  }
  return overlap * 10;
}

function pickCover(imageLinks, volumeId) {
  const ordered = [
    imageLinks?.extraLarge,
    imageLinks?.large,
    imageLinks?.medium,
    imageLinks?.small,
    imageLinks?.thumbnail,
    imageLinks?.smallThumbnail,
  ].filter(Boolean);
  const best = ordered[0];
  if (best) {
    return String(best).replace(/^http:/, "https:");
  }
  if (!volumeId) return null;
  return `https://books.google.com/books/content?id=${encodeURIComponent(volumeId)}&printsec=frontcover&img=1&zoom=1&source=gbs_api`;
}

function mapGenre(section, categories, title, description) {
  const haystack = `${section} ${(categories ?? []).join(" ")} ${title} ${description}`
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

  if (section.includes("Popular fantasy")) return "Fantasy";
  if (section.includes("Popular sci-fi")) return "Science Fiction";
  if (section.includes("Mystery")) return "Mystery";
  if (section.includes("Must-own classics")) return "Classic";
  if (section.includes("World literature")) return "Classic";
  if (section.includes("General must-read nonfiction")) return "Non-fiction";
  if (section.includes("Must-own philosophy")) {
    if (
      /bible|christ|religion|religious|stoic|stoicism|faith|philosophy|philosophical/.test(
        haystack,
      )
    ) {
      return "Non-fiction";
    }
    return "Religion";
  }
  if (section.includes("Modern and popular literary fiction")) {
    if (
      /historical|world war|afghanistan|greece|trojan|myth|mythology/.test(
        haystack,
      )
    ) {
      return "Historical Fiction";
    }
    if (/dystopia|science fiction|speculative/.test(haystack)) {
      return "Science Fiction";
    }
    return "Literary Fiction";
  }
  if (section.includes("Popular fantasy, YA, and speculative staples")) {
    if (/science fiction|space opera|mars|moon|robot/.test(haystack)) {
      return "Science Fiction";
    }
    if (/historical/.test(haystack)) {
      return "Historical Fiction";
    }
    return "Fantasy";
  }
  if (section.includes("Books in series you partially own")) {
    if (
      /poirot|detective|murder|crime|thriller|hannibal|serial killer/.test(
        haystack,
      )
    ) {
      return "Mystery";
    }
    if (/space|science fiction|robot|alien|mars/.test(haystack)) {
      return "Science Fiction";
    }
    return "Fantasy";
  }

  if (/mystery|detective|crime|thriller|serial killer|poirot/.test(haystack)) {
    return "Mystery";
  }
  if (/science fiction|space opera|dystopia|robot|alien|mars/.test(haystack)) {
    return "Science Fiction";
  }
  if (
    /fantasy|magic|wizard|dragon|mythology|mythic|sorcery|earthsea/.test(
      haystack,
    )
  ) {
    return "Fantasy";
  }
  if (/history|historical|war|civil war|slave narrative/.test(haystack)) {
    return "Historical Fiction";
  }
  if (/memoir|biography|essays|politics|philosophy|nonfiction/.test(haystack)) {
    return "Non-fiction";
  }
  if (/religion|faith|christian|scripture|spiritual/.test(haystack)) {
    return "Religion";
  }
  if (/classic|poetry|tragedies|epic poem|play/.test(haystack)) {
    return "Classic";
  }
  return "Literary Fiction";
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "library-import/1.0",
      accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return await response.json();
}

async function searchGoogleBooks(title, author) {
  const queries = [];
  if (author && author.toLowerCase() !== "unknown" && author.toLowerCase() !== "anonymous") {
    queries.push(`intitle:"${title}" inauthor:"${author}"`);
  }
  queries.push(`"${title}" "${author}"`);
  queries.push(`intitle:"${title}"`);

  const seen = new Set();
  const candidates = [];

  for (const query of queries) {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&printType=books`;
    try {
      const json = await fetchJson(url);
      for (const item of json.items ?? []) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        candidates.push(item);
      }
    } catch {
      // Ignore transient lookup failures and fall through to the next query.
    }
    await sleep(120);
  }

  let best = null;
  let bestScore = -Infinity;

  for (const item of candidates) {
    const info = item.volumeInfo ?? {};
    let score = 0;
    score += titleScore(info.title, title);
    score += authorScore(info.authors, author);
    if (info.description) score += 10;
    if (info.industryIdentifiers?.length) score += 8;
    if (info.pageCount) score += 4;
    if (info.imageLinks) score += 10;
    if (info.printType === "BOOK") score += 3;
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }

  return best;
}

async function fetchWikipediaSummary(title, author) {
  const search = `${title} ${author}`.trim();
  const searchUrl =
    "https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=" +
    encodeURIComponent(search) +
    "&utf8=1&format=json&origin=*";
  try {
    const searchJson = await fetchJson(searchUrl);
    const pageTitle = searchJson?.query?.search?.[0]?.title;
    if (!pageTitle) return { summary: null, image: null };
    const summaryUrl =
      "https://en.wikipedia.org/api/rest_v1/page/summary/" +
      encodeURIComponent(pageTitle);
    const summaryJson = await fetchJson(summaryUrl);
    return {
      summary: summaryJson.extract ?? null,
      image: summaryJson.originalimage?.source ?? null,
    };
  } catch {
    return { summary: null, image: null };
  }
}

async function ensureSeries(client, seriesMap, rule) {
  if (!rule) return null;
  const existing = seriesMap.get(rule.name.toLowerCase());
  if (existing) return existing;
  const { data, error } = await client
    .from("series")
    .insert({ name: rule.name, parent_series_id: null })
    .select("id, name, parent_series_id")
    .single();
  if (error) throw error;
  seriesMap.set(data.name.toLowerCase(), data);
  return data;
}

async function main() {
  const env = parseEnvFile(ENV_PATH);
  const schema = (env.VITE_SUPABASE_SCHEMA || "").trim() || "public";
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
  const client = schema === "public" ? supabase : supabase.schema(schema);

  const items = parseWishlist(WISHLIST_PATH);
  const { data: existingBooks, error: existingBooksError } = await client
    .from("books")
    .select("id, title")
    .is("deleted_at", null);
  if (existingBooksError) throw existingBooksError;

  const existingByTitle = new Map(
    (existingBooks ?? []).map((row) => [normalize(row.title), row]),
  );

  const { data: existingSeries, error: existingSeriesError } = await client
    .from("series")
    .select("id, name, parent_series_id");
  if (existingSeriesError) throw existingSeriesError;
  const seriesMap = new Map(
    (existingSeries ?? []).map((row) => [row.name.toLowerCase(), row]),
  );

  const inserted = [];
  const skipped = [];
  const unresolved = [];

  for (const item of items) {
    const normalizedTitle = normalize(item.title);
    if (existingByTitle.has(normalizedTitle)) {
      skipped.push({ title: item.title, reason: "already exists" });
      continue;
    }

    const google = await searchGoogleBooks(item.title, item.author);
    const info = google?.volumeInfo ?? {};
    const wiki = await fetchWikipediaSummary(item.title, item.author);

    const finalTitle = info.title?.trim() || item.title;
    const finalAuthor =
      info.authors?.length && item.author.toLowerCase() !== "unknown"
        ? info.authors.join("; ")
        : item.author;
    const description =
      decodeHtml(info.description ?? "") || wiki.summary || null;
    const coverUrl = pickCover(info.imageLinks, google?.id) || wiki.image || null;
    const isbn = extractIsbn(info.industryIdentifiers);
    const publishedYear = extractYear(info.publishedDate);
    const pages = Number.isFinite(info.pageCount) ? info.pageCount : null;
    const genre = mapGenre(
      item.section,
      info.categories,
      finalTitle,
      description ?? "",
    );

    const insertRow = {
      title: finalTitle,
      author: finalAuthor,
      genre,
      description,
      isbn,
      published_year: publishedYear,
      cover_url: coverUrl,
      finished: false,
      read_by_dane: false,
      read_by_emma: false,
      format: null,
      pages,
      ownership_status: "wishlist",
    };

    const { data: created, error: insertError } = await client
      .from("books")
      .insert(insertRow)
      .select("id, title, author")
      .single();
    if (insertError) throw insertError;

    existingByTitle.set(normalize(finalTitle), created);

    const seriesRule = SERIES_RULES[finalTitle] ?? SERIES_RULES[item.title] ?? null;
    if (seriesRule) {
      const series = await ensureSeries(client, seriesMap, seriesRule);
      const { error: seriesError } = await client.from("book_series").upsert(
        {
          book_id: created.id,
          series_id: series.id,
          series_label: seriesRule.label ?? null,
          series_sort: seriesRule.sort ?? null,
        },
        { onConflict: "book_id" },
      );
      if (seriesError) throw seriesError;
    }

    inserted.push({
      title: finalTitle,
      author: finalAuthor,
      cover: Boolean(coverUrl),
      description: Boolean(description),
      isbn: Boolean(isbn),
      publishedYear,
      pages,
      genre,
      series: seriesRule?.name ?? null,
    });

    if (!coverUrl || !description) {
      unresolved.push({
        title: finalTitle,
        missingCover: !coverUrl,
        missingDescription: !description,
      });
    }

    await sleep(120);
  }

  const report = {
    parsedCount: items.length,
    insertedCount: inserted.length,
    skippedCount: skipped.length,
    unresolvedCount: unresolved.length,
    skipped,
    unresolved,
    inserted,
  };

  const reportPath = path.join(ROOT, "wishlistinsert-import-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
