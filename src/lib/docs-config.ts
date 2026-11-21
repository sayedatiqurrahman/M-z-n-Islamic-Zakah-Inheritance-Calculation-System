import GithubSlugger from "github-slugger";

export interface DocItem {
  slug: string;
  title: string;
  file: string;
  description: string;
}

export const DOCS: DocItem[] = [
  {
    slug: "architecture",
    title: "Architecture",
    file: "ARCHITECTURE.md",
    description: "Layers, request flow, internationalisation, and security",
  },
  {
    slug: "fiqh-methodology",
    title: "Fiqh Methodology",
    file: "FIQH_METHODOLOGY.md",
    description: "Madhhab handling, versioning, and refusal policy",
  },
  {
    slug: "zakah-calculation",
    title: "Zakah Calculation",
    file: "ZAKAH_CALCULATION.md",
    description: "Asset policy, calculation steps, and formulas",
  },
  {
    slug: "inheritance-calculation",
    title: "Inheritance Calculation",
    file: "INHERITANCE_CALCULATION.md",
    description: "Shares, exclusion, ʿawl, radd, and rounding",
  },
  {
    slug: "reference-verification",
    title: "Reference Verification",
    file: "REFERENCE_VERIFICATION.md",
    description: "Evidence statuses and verification workflow",
  },
  {
    slug: "database",
    title: "Database",
    file: "DATABASE.md",
    description: "Models, relations, migrations, and anonymous sessions",
  },
  {
    slug: "testing",
    title: "Testing",
    file: "TESTING.md",
    description: "Automated tests and manual verification checklist",
  },
  {
    slug: "price-sources",
    title: "Price Sources",
    file: "PRICE_SOURCES.md",
    description: "Live price and currency data sources",
  },
];

const GITHUB_DOCS_BASE =
  "https://github.com/sayedatiqurrahman/M-z-n-Islamic-Zakah-Inheritance-Calculation-System/blob/main/docs";

export function getDocBySlug(slug: string): DocItem | undefined {
  return DOCS.find((d) => d.slug === slug);
}

export function githubDocUrl(file: string): string {
  return `${GITHUB_DOCS_BASE}/${file}`;
}

export interface TocHeading {
  id: string;
  text: string;
  depth: number;
}

export function extractToc(markdown: string): TocHeading[] {
  const lines = markdown.split(/\r?\n/);
  const headings: TocHeading[] = [];
  const slugger = new GithubSlugger();
  let inFence = false;

  for (const line of lines) {
    const fence = line.match(/^(```|~~~)/);
    if (fence) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = /^(#{2,4})\s+(.+?)\s*$/.exec(line);
    if (!match) continue;
    const depth = match[1].length;
    const text = match[2].replace(/\s+#*$/, "").replace(/`([^`]+)`/g, "$1").trim();
    const id = slugger.slug(text);
    headings.push({ id, text, depth });
  }

  return headings;
}
