import OpenAI from "openai";
import { NextResponse } from "next/server";

import { formatCurrency, getCompetitionLabel, type ProductOpportunity } from "@/lib/products";

type SummaryRequest = {
  product: ProductOpportunity;
};

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function POST(request: Request) {
  if (!openai) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY." },
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
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      instructions:
        "You are an ecommerce analyst. Write a concise product opportunity summary for a dropshipping or ecommerce seller. Use exactly these section labels: Pros, Cons, Target Audience, Final Recommendation. Keep each section short and practical.",
      input: `Product name: ${product.productName}
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
      max_output_tokens: 250,
    });

    return NextResponse.json({ summary: response.output_text });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate summary.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
