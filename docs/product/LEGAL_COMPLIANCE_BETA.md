# Legal / compliance pass (beta)

**Feature matrix [row 36](./FEATURE_PRIORITIZATION_MATRIX.md)** · **GitHub** [#12](https://github.com/Kunle123/StoryWall/issues/12)

**Jurisdiction:** StoryWall is **UK-based**. Policies and this checklist assume compliance with **United Kingdom** law and regulation, including:

| Area | Primary framework |
|------|-------------------|
| Personal data | **UK GDPR** (retained EU law as amended) and the **Data Protection Act 2018** |
| Cookies & similar tech | **Privacy and Electronic Communications Regulations (PECR)** 2003 (as amended), read with UK GDPR where relevant |
| Regulator | **Information Commissioner’s Office (ICO)** — [ico.org.uk](https://ico.org.uk) |
| Consumer / contract terms | **English and Welsh law** (see Terms — governing law) unless you agree otherwise with counsel |

Use this for **private beta** and **wider testing** before treating legal work as “done.” **UK counsel** should review final copy. If you later **target users outside the UK** in a material way, get jurisdiction-specific advice (this checklist is not enough on its own).

## In the product (shipped paths)

| Item | Where | Notes |
|------|--------|--------|
| **Terms & Conditions** | `/legal/terms` | Linked from site **Footer** (all `(main)` routes). |
| **Privacy Policy** | `/legal/privacy` | UK GDPR framing; links to Cookie Policy. |
| **Cookie Policy** | `/legal/cookies` | Describes Clerk, analytics, etc.; align with what you actually run. |
| **Acceptable Use** | `/legal/acceptable-use` | Content and conduct rules. |
| **Sitemap** | `app/sitemap.ts` | Policy URLs included for crawlers / Search Console. |
| **Terms acceptance** | `/legal/accept-terms` · API `accept-terms` | Optional flow for recording acceptance (see schema). |

## Ops & contacts (not automated)

See **[`docs/LEGAL_SETUP.md`](../LEGAL_SETUP.md)** for **email** inboxes (`privacy@`, `copyright@`, `legal@`, …), forwarding, and DMCA expectations. Beta is **not** complete until someone monitors **privacy@** / support paths you publish.

## Checklist before “beta-ready” legal

- [ ] **Footer** visible on main journeys (home, discover, profile) — global `(main)` layout.
- [ ] **Policy accuracy**: product reality matches Privacy (Clerk, Stripe, GA, AI providers, hosting).
- [ ] **Cookie / analytics**: if you use non-essential cookies or GA, practices match **Cookie Policy**; consider a consent pattern if your audience/lawyers require it (policy already describes consent for non-essential).
- [ ] **Age / audience**: if you target minors, update policies and product gates — currently written for general audience.
- [ ] **Emails** in policies resolve to monitored inboxes (or update addresses in pages).
- [ ] **UK counsel review** of all four policy pages and live product behaviour.

## Related

- [`LAUNCH_GATES_CHECKLIST.md`](./LAUNCH_GATES_CHECKLIST.md) §1 — **Legal baseline** gate.
- [`PRODUCTION_READINESS_CHECKLIST.md`](../PRODUCTION_READINESS_CHECKLIST.md) — legal section.

---

*Last updated: 2026-03-28*
