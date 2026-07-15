# Landing Page Design Research: Exec-Ed Course Pages

**Reference page:** [UT Austin McCombs — AI Agents and Generative AI for Business Applications](https://onlineexeced.mccombs.utexas.edu/ai-agents-and-generative-ai-for-business-applications-online)

**Goal:** Identify the reference page's theme and layout, and catalog similar landing page themes/layouts to draw from.

> **Note on tooling:** The Refero design skill/MCP was requested but is not installed in this session (no Refero skill, and no Refero connector in the MCP registry). This research was done via web research instead. To use Refero directly next time, connect its MCP server as a custom connector on claude.ai (Settings → Connectors) using the endpoint from [refero.design](https://refero.design) — it's a curated library of ~30K real web/iOS screens, strong for landing page inspiration.

---

## 1. What the reference page is

The page is a **lead-generation ("brochure funnel") landing page** for a 13-week online certificate, run by **Great Learning** in partnership with UT Austin's McCombs School of Business (Great Learning handles enrollment, payments, and support; McCombs provides faculty and the certificate). The domain `onlineexeced.mccombs.utexas.edu` hosts the whole family of Great Learning × McCombs programs, all built on the same template.

This matters for design research: the page belongs to a well-defined genre — the **university partner-platform exec-ed page** (Great Learning, Emeritus, GetSmarter, 2U) — and the genre's layout is highly converged. Direct fetching of the page was blocked by this environment's network policy, so the section breakdown below combines search-verified program details with the standard Great Learning template structure; verify fine details against the live page.

### Theme
- **Colors:** UT Austin burnt orange (`#BF5700`) as the single accent on a white/light-gray base with charcoal text. The university brand color does double duty as the trust signal and the CTA color.
- **Typography:** Clean geometric/neutral sans throughout; bold weights for headings, no decorative type. The institutional logo lockup (UT Austin + McCombs) carries the prestige, not the typography.
- **Imagery:** Stock-style photography of professionals at work, certificate mockups, tool/partner logo strips, icon-driven feature rows. No illustration, no gradients — deliberately conservative.
- **Overall feel:** Institutional-corporate. Dense, information-forward, optimized for a five-figure-adjacent purchase decision rather than aesthetic delight.

### Layout (top to bottom)
1. **Sticky header** — university logo left, phone number / "Download Brochure" / "Apply Now" CTAs right.
2. **Hero** — program title, one-line value prop ("master AI agents — the next wave of automation"), and a **key-facts bar**: duration (13 weeks), format (online), weekly effort, next cohort start date. Lead-capture form or brochure CTA sits in or immediately beside the hero.
3. **Trust/urgency strip** — application deadline, "applications close once seats fill," partner logos.
4. **Why this program / highlights** — icon grid of quantified specs (3 hands-on projects, 15+ case studies across Finance, Healthcare, Legal, Retail, HR; live mentorship; UT Austin certificate with CEUs).
5. **Curriculum** — accordion of weekly modules (GenAI foundations → LLMs → RAG → agents with tools/memory/planning → multi-agent systems), each expandable. Tools-covered logo grid (Python, LangChain-class tooling, no-code platforms).
6. **Projects & case studies** — cards by industry.
7. **Faculty** — headshot cards with McCombs titles; the single strongest credibility block on these pages.
8. **Certificate** — rendered mockup of the UT Austin certificate.
9. **Testimonials / learner outcomes** — quotes, ratings, sometimes video.
10. **Fees & payment plans** — tuition with installment/financing options, corporate-sponsorship path.
11. **FAQ accordion** → **application steps** → **footer** with the Great Learning partnership disclosure.
12. **Persistent conversion furniture** — sticky bottom bar or floating "Download Brochure" button, often an advisor chat widget.

### Conversion pattern
Everything funnels to two actions: **Download Brochure** (top-of-funnel, gated behind name/email/phone) and **Apply Now** (bottom-of-funnel). Urgency comes from cohort start dates and seat scarcity rather than discount timers.

---

## 2. Similar live pages to study (same genre)

**Same template family (Great Learning × UT Austin):**
- [PG Program in AI & Machine Learning](https://onlineexeced.mccombs.utexas.edu/online-ai-machine-learning-course)
- [Gen AI for Business Applications](https://onlineexeced.mccombs.utexas.edu/gen-ai-for-business-applications-online-course)
- [AI for Business Leaders](https://onlineexeced.mccombs.utexas.edu/ai-for-business-leaders-course)
- [Chief Technology Officer Program](https://onlineexeced.mccombs.utexas.edu/chief-technology-officer-online-program)
- [Program family index](https://onlineexeced.mccombs.utexas.edu/) — useful for seeing the template at a glance

**Adjacent platforms, same layout genre, different themes:**
- **Emeritus** ([emeritus.org](https://emeritus.org/)) — powers pages for MIT Sloan, Kellogg, Wharton, Berkeley, INSEAD. Nearly identical section order; theme swaps to each school's brand color. Notable pattern: transparent 3-way financing block (upfront discount / installments / employer-sponsored) that handles the price objection without gating.
- **GetSmarter** — MIT / LSE / Oxford Saïd short courses. Slightly softer, editorial theme; strong "who this is for" self-selection stats (e.g., MIT's "54% of past participants have 15+ years of experience").
- **MIT Sloan Executive Education** ([executive.mit.edu](https://executive.mit.edu/)) — first-party version of the genre; more restrained, whitespace-heavy, credential-led.
- **Harvard Medical School exec-ed AI cert** — quiet logo top-left, three hard market stats in the hero ("50% of healthcare orgs deploying AI, 40% accuracy gain, $187.9B market"); a good model for stat-anchored heroes.
- **McCombs' other vendor line** ([execed-online.mccombs.utexas.edu](https://execed-online.mccombs.utexas.edu/executive-program-for-energy-leaders)) — same school, different platform; useful A/B of two vendors theming the same brand.

**Modern cohort-course styling (same funnel, fresher themes):**
- **Maven** (maven.com course pages) — minimal black/white, oversized type, instructor-led social proof; the anti-institutional take.
- **Section** and **Reforge** — dark themes, bold editorial type, membership framing.
- **Coursera / edX professional certificate pages** — the mass-market version: ratings, enrollment counts, outcome stats above the fold.

---

## 3. The reusable layout skeleton ("brochure funnel" anatomy)

Across every high-performing page in this genre, the skeleton is:

```
Sticky nav (logo + primary CTA)
└─ Hero: credential signal + 1-line promise + key-facts bar + lead form
└─ Stat anchors (3 quantified proof points)
└─ Who this is for (self-selection)
└─ Highlights (icon grid, quantified: "100+ video lectures", "2 live sessions")
└─ Curriculum accordion + tools logo grid
└─ Projects / case studies (cards)
└─ Faculty (headshot cards)
└─ Certificate mockup
└─ Testimonials
└─ Pricing + payment plans (transparent, not gated)
└─ FAQ accordion
└─ Final CTA + sticky bottom bar
```

Genre-specific findings worth keeping:
- **Name concrete tools, not topics** — "Gain experience with ChatGPT, LangChain, and AutoGPT" outperforms "Learn AI."
- **Let the logo whisper** — prestige brands place the crest small, top-left; the layout stays quiet around it.
- **Two CTAs only** — brochure (low commitment) and apply (high commitment); everything else on the page feeds one of the two.
- **Urgency via cohort mechanics** (start date, seats) reads as legitimate; discount countdowns read as diploma-mill.

---

## 4. Three theme directions for a page in this genre

| Direction | Palette & type | Imagery | Model examples |
|---|---|---|---|
| **Institutional heritage** | One university-brand accent (burnt orange / crimson / navy) on white; neutral sans or serif-display headings | Photography, certificate mockups, crests | McCombs/Great Learning, MIT Sloan, HMS |
| **Modern edtech** | Indigo/violet with gradient accents, rounded cards, generous radius | Flat illustration + product screenshots | Coursera, Emeritus refresh, upGrad |
| **Minimal premium** | Near-black/white, one accent, oversized editorial type, heavy whitespace | Instructor portraits, almost no decoration | Maven, Section, Reforge |

For a personal/GitHub-hosted page borrowing this genre, **minimal premium** is the easiest to execute well without a brand system, while keeping the brochure-funnel skeleton from §3.

---

## 5. Where to browse more themes (Refero + alternatives)

- **[Refero](https://refero.design)** — curated real web + iOS screens (~30K), best for quick landing-page layout research; has an MCP server that can be added as a claude.ai connector.
- **[Mobbin](https://mobbin.com)** — largest library, better for flow/pattern benchmarking at volume.
- **[Land-book](https://land-book.com)** — searchable gallery of well-designed marketing sites.
- **[Landingfolio](https://landingfolio.com)** & **[Lapa Ninja](https://lapa.ninja)** — landing-page-specific galleries with category filters (education).
- **[SaaS Landing Page](https://saaslandingpage.com)** — section-by-section pattern breakdowns (heroes, pricing, FAQs).
- Curated writeups: [Swipe Pages — 9 university & exec-ed examples](https://swipepages.com/blog/9-best-university-executive-education-landing-page-examples-of-2026/), [Swipe Pages — 11 education examples](https://swipepages.com/blog/11-best-education-landing-page-examples-of-2026/), [Landingi — education landing pages](https://landingi.com/blog/education-landing-pages/), [Carnegie — anatomy of a higher-ed landing page](https://www.carnegiehighered.com/higher-education-landing-page-that-converts/).

---

## Sources

- [UT Austin McCombs × Great Learning program hub](https://onlineexeced.mccombs.utexas.edu/)
- [McCombs — Great Learning partnership page](https://www.mccombs.utexas.edu/execed/for-individuals/certificates/great-learning/)
- [Great Learning blog — Texas McCombs GenAI program](https://www.mygreatlearning.com/blog/generative-ai-for-business-applications/)
- [Swipe Pages — 9 Best University & Executive Education Landing Page Examples of 2026](https://swipepages.com/blog/9-best-university-executive-education-landing-page-examples-of-2026/)
- [Swipe Pages — 11 Best Education Landing Page Examples of 2026](https://swipepages.com/blog/11-best-education-landing-page-examples-of-2026/)
- [Landingi — 13 Course and Education Landing Page Examples](https://landingi.com/blog/education-landing-pages/)
- [Carnegie — The Anatomy of a Higher Ed Landing Page that Converts](https://www.carnegiehighered.com/higher-education-landing-page-that-converts/)
- [Emeritus](https://emeritus.org/) · [MIT Sloan Executive Education](https://executive.mit.edu/)
- [Product Hunt — Refero alternatives](https://www.producthunt.com/products/refero/alternatives) · [Toolworthy — Mobbin alternatives](https://www.toolworthy.ai/blog/mobbin-alternatives)
