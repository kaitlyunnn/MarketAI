export type ProductRow = {
  product_name: string;
  amazon_price: number | string | null;
  supplier_price: number | string | null;
  competition_count: number | string | null;
  tiktok_mentions: number | string | null;
  google_trends_score: number | string | null;
  ai_summary?: string | null;
};

export const PRODUCT_SELECT_FIELDS =
  "product_name, amazon_price, supplier_price, competition_count, tiktok_mentions, google_trends_score, ai_summary";

export type ProductOpportunity = {
  id: string;
  slug: string;
  productName: string;
  amazonPrice: number;
  supplierPrice: number;
  competitionCount: number;
  tiktokMentions: number;
  googleTrendsScore: number;
  aiSummary: string | null;
  profitMargin: number;
  trendScore: number;
  rawTrendScore: number;
  competitionScore: number;
  opportunityScore: number;
};

function toNumber(value: number | string | null) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function normalizeScore(value: number, max: number) {
  if (max <= 0) {
    return 0;
  }

  return (value / max) * 100;
}

export function slugifyProductName(productName: string) {
  return productName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatScore(value: number) {
  return Math.round(value);
}

export function getCompetitionLabel(score: number) {
  const roundedScore = formatScore(score);

  if (roundedScore <= 35) {
    return "High";
  }

  if (roundedScore <= 65) {
    return "Medium";
  }

  return "Low";
}

export function buildOpportunities(rows: ProductRow[]) {
  const enriched = rows.map((row, index) => {
    const amazonPrice = toNumber(row.amazon_price);
    const supplierPrice = toNumber(row.supplier_price);
    const competitionCount = toNumber(row.competition_count);
    const tiktokMentions = toNumber(row.tiktok_mentions);
    const googleTrendsScore = toNumber(row.google_trends_score);

    return {
      id: `${row.product_name}-${index}`,
      slug: slugifyProductName(row.product_name),
      productName: row.product_name,
      amazonPrice,
      supplierPrice,
      competitionCount,
      tiktokMentions,
      googleTrendsScore,
      aiSummary: row.ai_summary ?? null,
      profitMargin: amazonPrice - supplierPrice,
      rawTrendScore: tiktokMentions + googleTrendsScore,
    };
  });

  const maxProfitMargin = Math.max(
    ...enriched.map((product) => Math.max(product.profitMargin, 0)),
    0,
  );
  const maxTikTokMentions = Math.max(
    ...enriched.map((product) => Math.max(product.tiktokMentions, 0)),
    0,
  );
  const maxGoogleTrendsScore = Math.max(
    ...enriched.map((product) => Math.max(product.googleTrendsScore, 0)),
    0,
  );
  const maxCompetitionCount = Math.max(
    ...enriched.map((product) => Math.max(product.competitionCount, 0)),
    0,
  );

  return enriched
    .map((product) => {
      const profitMarginScore = normalizeScore(
        Math.max(product.profitMargin, 0),
        maxProfitMargin,
      );
      const normalizedTikTokScore = normalizeScore(
        Math.max(product.tiktokMentions, 0),
        maxTikTokMentions,
      );
      const normalizedGoogleScore = normalizeScore(
        Math.max(product.googleTrendsScore, 0),
        maxGoogleTrendsScore,
      );
      const normalizedTrendScore =
        normalizedTikTokScore * 0.5 + normalizedGoogleScore * 0.5;
      const lowCompetitionScore =
        maxCompetitionCount <= 0
          ? 100
          : ((maxCompetitionCount - Math.max(product.competitionCount, 0)) /
              maxCompetitionCount) *
            100;

      const opportunityScore =
        normalizedTrendScore * 0.5 +
        profitMarginScore * 0.3 +
        lowCompetitionScore * 0.2;

      return {
        ...product,
        trendScore: normalizedTrendScore,
        competitionScore: lowCompetitionScore,
        opportunityScore,
      };
    })
    .sort((a, b) => b.opportunityScore - a.opportunityScore);
}
