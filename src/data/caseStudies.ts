export type CaseStudy = {
  slug: string;
  brandName: string;
  category: string;
  shortHook: string;
  overview: string;
  sections: {
    heading: string;
    body: string;
  }[];
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "hismile",
    brandName: "Hismile",
    category: "Oral care",
    shortHook:
      "A bold brand angle and creator-friendly product format helped Hismile make teeth whitening feel social-first instead of clinical.",
    overview:
      "Hismile turned a traditionally boring category into something visual, giftable, and easy to demonstrate online. Its growth came from sharp branding, product simplicity, and content that made the result feel easy to imagine.",
    sections: [
      {
        heading: "Why the brand stood out",
        body:
          "Hismile avoided the sterile look that dominates oral care and built a brand that felt modern, playful, and highly shareable. That made it easier to win attention in social feeds where packaging and first impressions matter.",
      },
      {
        heading: "What made the offer easy to sell",
        body:
          "The product was easy to understand, easy to demonstrate, and tied to a visible before-and-after outcome. That combination reduced friction for new customers and gave creators a simple story to tell in short-form content.",
      },
      {
        heading: "Takeaway for MarketAI users",
        body:
          "Products with a clear visual payoff, strong packaging, and broad creator appeal can outperform even in crowded categories. Look for items where the content angle is obvious within a few seconds.",
      },
    ],
  },
  {
    slug: "gymshark",
    brandName: "Gymshark",
    category: "Fitness apparel",
    shortHook:
      "Gymshark scaled by building community identity first, then turning that identity into a repeatable apparel engine.",
    overview:
      "Gymshark became more than activewear by making customers feel part of a movement. Its growth blended influencer trust, fitness culture, and product drops that gave shoppers a reason to keep coming back.",
    sections: [
      {
        heading: "Brand before product saturation",
        body:
          "Gymshark invested heavily in perception, athletes, and community moments that made the brand feel aspirational. That emotional pull gave its apparel more pricing power than generic alternatives.",
      },
      {
        heading: "How community fueled retention",
        body:
          "The company used creators and events to create belonging, not just awareness. Customers were not only buying leggings or tees; they were buying into a lifestyle signal they wanted to be associated with.",
      },
      {
        heading: "Takeaway for MarketAI users",
        body:
          "In categories with many lookalike products, positioning and identity can create the edge. Strong products matter, but consistent community-driven branding can be the difference between a trend and a durable business.",
      },
    ],
  },
  {
    slug: "bloom-nutrition",
    brandName: "Bloom Nutrition",
    category: "Wellness supplements",
    shortHook:
      "Bloom Nutrition used accessible wellness messaging and highly repeatable creator content to make greens powders feel mainstream.",
    overview:
      "Bloom Nutrition grew by packaging a familiar supplement format in a way that felt more approachable and lifestyle-friendly. The brand benefited from content loops that fit naturally into morning routine videos and wellness storytelling.",
    sections: [
      {
        heading: "Making a dense category approachable",
        body:
          "Supplements can feel intimidating or overly technical. Bloom simplified the message, emphasized habit-building, and paired the product with soft, routine-based content that matched how customers wanted to see wellness online.",
      },
      {
        heading: "Why the content loop worked",
        body:
          "Routine content is easy to reproduce, easy to personalize, and easy for audiences to picture themselves following. That gave Bloom a stream of low-friction creator content without needing a complicated product explanation every time.",
      },
      {
        heading: "Takeaway for MarketAI users",
        body:
          "Products that fit neatly into daily rituals can have strong content repeatability. If a product can become part of a routine story, it often gets more durable attention than one-off novelty items.",
      },
    ],
  },
];

export function getCaseStudyBySlug(slug: string) {
  return caseStudies.find((caseStudy) => caseStudy.slug === slug) ?? null;
}
