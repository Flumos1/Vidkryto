const LEGAL_FORMS = new Set([
  "тов",
  "пат",
  "прат",
  "дп",
  "кп",
  "кпп",
  "фоп",
  "пп",
  "ат",
  "at",
  "llc",
  "ltd",
  "limited",
  "inc",
  "corp",
  "corporation",
  "company",
  "co",
  "plc",
  "gmbh",
  "ag",
  "sa",
  "bv",
  "oy",
  "ab",
]);

/** Normalizes a company or sanctions entity name for exact-match comparison. */
export function normalizeEntityName(raw: string): string {
  const base = String(raw || "")
    .toLowerCase()
    .replace(/[’'`«»"“”„]/g, " ")
    .replace(/[^a-zа-яіїєґ0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = base.split(" ").filter(Boolean);
  const filtered = tokens.filter((t) => !LEGAL_FORMS.has(t));
  return (filtered.length >= 2 ? filtered : tokens).join(" ");
}

export function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .trim();
}
