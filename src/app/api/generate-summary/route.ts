import { GoogleGenAI } from "@google/genai";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { formatCurrency, getCompetitionLabel, type ProductOpportunity } from "@/lib/products";
import { createClient as createServerSupabaseClient } from "../../../../utils/supabase/server";

type SummaryRequest = {
  product: ProductOpportunity;
};

type SummarySections = {
  pros: string;
  cons: string;
  targetAudience: string;
  finalRecommendation: string;
};

let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  const geminiApiKey =
    process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? null;

  if (!geminiApiKey) {
    return null;
  }

  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: geminiApiKey });
  }

  return aiClient;
}

function normalizeSummaryText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/^(\*\*|##?\s*)?Product Opportunity Summary:\s*/i, "")
    .trim();
}

function formatSummary(sections: SummarySections) {
  return [
    `Pros: ${sections.pros.trim()}`,
    `Cons: ${sections.cons.trim()}`,
    `Target Audience: ${sections.targetAudience.trim()}`,
    `Final Recommendation: ${sections.finalRecommendation.trim()}`,
  ].join("\n\n");
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
      },
      { status: 500 },
    );
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json(
      { error: "Please log in before generating AI summaries." },
      { status: 401 },
    );
  }

  const ai = getAiClient();

  if (!ai) {
    return NextResponse.json(
      { error: "Missing GEMINI_API_KEY or GOOGLE_API_KEY." },
      { status: 500 },
    );
  }

  let body: SummaryRequest;

  try {
    body = (await request.json()) as SummaryRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const product = body.product;

  if (!product?.productName) {
    return NextResponse.json(
      { error: "A valid product object is required." },
      { status: 400 },
    );
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are an ecommerce analyst. Return valid JSON only.

Write a concise product opportunity summary for a dropshipping or ecommerce seller.
Each field should be 1-2 complete sentences, practical, and fully finished.
Do not include markdown, headings, or any text outside the JSON object.

Product name: ${product.productName}
Trend score: ${Math.round(product.trendScore)} / 100
Competition level: ${getCompetitionLabel(product.competitionScore)}
Competition score: ${Math.round(product.competitionScore)} / 100
Opportunity score: ${Math.round(product.opportunityScore)} / 100
Amazon price: ${formatCurrency(product.amazonPrice)}
Supplier price: ${formatCurrency(product.supplierPrice)}
Profit margin: ${formatCurrency(product.profitMargin)}
Other sellers: ${product.competitionCount}
TikTok mentions: ${product.tiktokMentions}
Google Trends score: ${product.googleTrendsScore}`,
      config: {
        temperature: 0.2,
        candidateCount: 1,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: "object",
          additionalProperties: false,
          required: [
            "pros",
            "cons",
            "targetAudience",
            "finalRecommendation",
          ],
          properties: {
            pros: { type: "string" },
            cons: { type: "string" },
            targetAudience: { type: "string" },
            finalRecommendation: { type: "string" },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];

    if (candidate?.finishReason === "MAX_TOKENS") {
      throw new Error(
        "Gemini stopped early because it hit the output token limit.",
      );
    }

    const rawText = response.text ? normalizeSummaryText(response.text) : "";

    if (!rawText) {
      throw new Error("Gemini returned an empty summary.");
    }

    let parsed: SummarySections;

    try {
      parsed = JSON.parse(rawText) as SummarySections;
    } catch {
      throw new Error("Gemini returned an invalid summary format.");
    }

    const summary = formatSummary(parsed);

    if (!summary) {
      throw new Error("Gemini returned an empty summary.");
    }

    return NextResponse.json({ summary });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate summary.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
