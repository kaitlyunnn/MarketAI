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
    "Hismile turned a boring oral care product into a visual, creator-friendly brand that people actually wanted to post and share.",
  overview:
    "Hismile redefined how oral care is marketed by shifting away from clinical positioning and into lifestyle branding. Instead of selling hygiene, they sold confidence and transformation. Their products were designed to be understood instantly, look good on camera, and fit naturally into short-form content. This allowed them to scale through creators and social platforms rather than relying on traditional advertising.",
  sections: [
    {
      heading: "Why it caught attention",
      body:
        "Most oral care brands rely on clinical messaging, sterile colors, and dentist-style credibility. Hismile broke that pattern by using bright, bold packaging and a modern aesthetic that felt closer to beauty or skincare than healthcare. This made the product stand out instantly in fast-moving feeds where visual appeal determines whether someone keeps watching. Instead of blending in, the product created a pattern interrupt that captured attention within seconds.",
    },
    {
      heading: "How the content loop worked",
      body:
        "Hismile’s product naturally enabled a repeatable content formula. Creators could hook viewers with a quick question or close-up, demonstrate the product in a simple and visual way, and then show a clear before-and-after result. This structure required almost no creativity or scripting, making it easy to replicate at scale. Because the outcome was visible and easy to understand, the content performed well on short-form platforms where clarity and speed are critical.",
    },
    {
      heading: "Distribution strategy",
      body:
        "Instead of relying on one viral moment, Hismile scaled through volume and repetition. They worked with a large number of creators, especially micro-influencers, all producing similar styles of content. Because the product was easy to film and explain, it could be promoted consistently across hundreds of accounts. This created constant exposure, strong social proof, and familiarity in users’ feeds, which increased trust and conversion rates over time.",
    },
    {
      heading: "Takeaway for sellers",
      body:
        "Winning products are not just functional — they are easy to show, easy to understand, and visually appealing. If a product requires too much explanation, it becomes harder to sell in short-form environments. Focus on products with clear before-and-after results, strong packaging, and simple creator angles. The easier it is for someone to make content around your product, the faster it can spread and convert cold traffic.",
    },
  ],
},
{
  slug: "gymshark",
  brandName: "Gymshark",
  category: "Fitness apparel",
  shortHook:
    "Gymshark scaled by turning customers into a community, building a fitness identity people wanted to belong to.",
  overview:
    "Gymshark didn’t win by having a radically different product — they won by building a brand people identified with. In a crowded fitness apparel market, they focused on community, creators, and consistent storytelling. The result was a brand that felt like a movement, where customers weren’t just buying clothes, they were buying into a lifestyle and identity.",
  sections: [
    {
      heading: "Brand before commodity",
      body:
        "Fitness apparel is highly saturated, with many products looking and performing similarly. Gymshark differentiated by building a strong brand identity first. Through consistent visuals, clean aesthetics, and a clear fitness-focused message, they created perceived value beyond the product itself. Their partnerships with athletes and influencers reinforced this identity, making the brand feel aspirational and premium even when the products were comparable to competitors.",
    },
    {
      heading: "Creator-led growth",
      body:
        "Gymshark heavily invested in early influencer marketing before it became mainstream. They partnered with up-and-coming fitness creators rather than established celebrities, allowing them to grow together. These creators consistently wore and promoted Gymshark, creating authentic and repeated exposure across platforms. This strategy made the brand feel native to social media and helped it spread organically through fitness communities.",
    },
    {
      heading: "Community as retention",
      body:
        "Gymshark didn’t just acquire customers — they built a community. Through product launches, fitness events, and social engagement, customers felt like they were part of something bigger. This emotional connection increased retention and brand loyalty. Instead of one-time purchases, customers continued buying because they identified with the brand and wanted to stay involved in the community.",
    },
    {
      heading: "Launch-driven demand",
      body:
        "Gymshark used limited drops and launch events to create urgency and hype. Instead of always being fully stocked, they turned product releases into moments that customers anticipated. This scarcity-driven model increased demand and engagement, while also reinforcing the idea that owning Gymshark products was part of being ‘in’ the community.",
    },
    {
      heading: "Takeaway for sellers",
      body:
        "When products are easily replaceable, brand and positioning become the real advantage. Focus on building an identity that your target audience wants to be part of. Use creators to represent that identity, and create moments (like drops or events) that give people a reason to engage repeatedly. The strongest ecommerce brands don’t just sell products — they build communities people stay loyal to.",
    },
  ],
},
{
  slug: "bloom-nutrition",
  brandName: "Bloom Nutrition",
  category: "Wellness supplements",
  shortHook:
    "Bloom Nutrition scaled by turning supplements into a simple, aesthetic daily habit that fit naturally into routine-based content.",
  overview:
    "Bloom Nutrition grew by reframing supplements from a complex health decision into an easy, everyday wellness habit. Instead of focusing on technical ingredients or scientific claims, the brand leaned into lifestyle, simplicity, and routine. Their products were designed to feel approachable, look good on camera, and integrate seamlessly into content formats that were already popular on social media.",
  sections: [
    {
      heading: "Making the category feel accessible",
      body:
        "The supplement space is often filled with complicated terminology, aggressive claims, and intimidating branding. Bloom simplified everything. They used clean packaging, soft colors, and straightforward messaging to make the product feel beginner-friendly. By focusing on benefits like feeling better or improving daily habits rather than technical details, they lowered the barrier to entry and made supplements feel less overwhelming to a broader audience.",
    },
    {
      heading: "Routine-based positioning",
      body:
        "Instead of positioning the product as a one-time purchase, Bloom framed it as part of a daily routine. This shifted the focus from decision-making to habit-building. When a product becomes something people use every day, it naturally increases retention and lifetime value. It also makes the product easier to market because it fits into consistent, repeatable behaviors rather than one-off use cases.",
    },
    {
      heading: "Why creators could repeat it",
      body:
        "Bloom fit perfectly into existing content formats like morning routines, wellness resets, and ‘day in the life’ videos. Creators didn’t need to invent new ideas — they could simply include the product in content they were already making. This made promotion feel natural and scalable. Because the format was repeatable, the brand was able to generate consistent exposure across many creators without needing constant creative reinvention.",
    },
    {
      heading: "Aesthetic-driven growth",
      body:
        "The product was designed to look good on camera, from the packaging to the mixing process. Visual elements like pouring, stirring, and showing the final drink created satisfying and engaging content moments. This made the product more likely to be featured and shared, especially on platforms where aesthetic appeal drives engagement.",
    },
    {
      heading: "Takeaway for sellers",
      body:
        "Products that fit into daily routines have a major advantage in both content and retention. If your product can become part of a habit, it’s easier to market and easier to sell repeatedly. Focus on simplifying your message, making the product visually appealing, and ensuring it fits naturally into content people are already creating. The easier it is to integrate into everyday life, the more durable your growth will be.",
    },
  ],
},
];

export function getCaseStudyBySlug(slug: string) {
  return caseStudies.find((caseStudy) => caseStudy.slug === slug) ?? null;
}
