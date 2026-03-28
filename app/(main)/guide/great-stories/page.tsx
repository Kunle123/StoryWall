import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "What makes a great StoryWall | StoryWall",
  description:
    "Clear premise, chronological arc, tight panels, meaningful images, and a share-worthy payoff — how to build visual stories people finish and share.",
  alternates: { canonical: "/guide/great-stories" },
  openGraph: {
    title: "What makes a great StoryWall",
    description:
      "How to build visual timelines that are clear, paced, and worth sharing.",
    url: "/guide/great-stories",
  },
};

export default function GreatStoriesGuidePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-16 pb-10 max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          What makes a great StoryWall
        </h1>
        <p className="text-lg text-muted-foreground mb-10">
          A strong StoryWall is not just well written. It does five things at once
          — and it should feel worth sharing when you&apos;re done.
        </p>

        <section className="space-y-10 text-foreground/95">
          <div>
            <h2 className="font-display text-xl font-semibold mb-3">
              1. An instantly clear premise
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Someone should understand the point in a few seconds.{" "}
              <strong className="text-foreground">Clarity beats cleverness.</strong>
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Strong titles sound like: &ldquo;How OpenAI evolved from nonprofit lab to
              global platform,&rdquo; &ldquo;The rise and fall of WeWork,&rdquo; &ldquo;How
              women won the vote in Britain.&rdquo; Weak ones are vague: &ldquo;Thoughts on
              politics,&rdquo; &ldquo;A history of technology.&rdquo; The best stories answer:
              how did we get here? what happened next? why did this matter? what changed over
              time?
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold mb-3">
              2. Naturally chronological
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Your format is a timeline — sequence should matter. Aim for a clear beginning,
              a small number of turning points, and an ending or present-day payoff.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Strong fits: movements, company arcs, biographies, crises, breakthroughs,
              elections, social change, personal journeys with visible stages. Weak fits:
              abstract opinion pieces, listicles, topics with no meaningful timeline, stories
              that are comparisons without a journey. You want:{" "}
              <strong className="text-foreground">
                &ldquo;I need to see this unfold step by step.&rdquo;
              </strong>
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold mb-3">
              3. Every panel earns its place
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Most strong stories use roughly{" "}
              <strong className="text-foreground">6–10 beats</strong> for something light, or{" "}
              <strong className="text-foreground">8–12</strong> for a richer piece. Each beat
              should do one job: context, turning point, surprise, escalation, consequence, or
              resolution. If two panels do the same job, remove one.
            </p>
            <p className="text-sm text-muted-foreground">
              Aim for tight, paced, inevitable — never bloated.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold mb-3">
              4. Images add meaning, not decoration
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Images should make the story easier to grasp, more memorable, or more emotional
              — establish time and place, highlight a person or event, show contrast, or nail
              a turning point. Avoid generic filler, inconsistent style, or pictures that only
              repeat the caption.
            </p>
            <p className="text-sm text-muted-foreground">
              Ask:{" "}
              <strong className="text-foreground">
                would this be much less compelling without the visuals?
              </strong>
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold mb-3">
              5. A share impulse
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              The best StoryWalls feel useful, surprising, resonant, or conversation-starting.
              Readers should think things like: &ldquo;I finally understand this,&rdquo;
              &ldquo;I didn&apos;t know that,&rdquo; or &ldquo;Other people need to see
              this.&rdquo;
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-6">
            <h2 className="font-display text-lg font-semibold mb-3">
              A simple structure that usually works
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground leading-relaxed">
              <li>
                <span className="text-foreground font-medium">Hook</span> — one sentence that
                makes people care
              </li>
              <li>
                <span className="text-foreground font-medium">Setup</span> — the world before
              </li>
              <li>
                <span className="text-foreground font-medium">Inciting event</span> — what
                started it
              </li>
              <li>
                <span className="text-foreground font-medium">Escalation</span> — what
                intensified
              </li>
              <li>
                <span className="text-foreground font-medium">Turning point</span> — the key
                shift
              </li>
              <li>
                <span className="text-foreground font-medium">Consequence</span> — what
                followed
              </li>
              <li>
                <span className="text-foreground font-medium">Resolution / today</span> —
                why it matters now
              </li>
            </ol>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold mb-3">
              Scoring rubric (internal)
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              Rate 1–5 on: clear premise, chronology matters, strong turning points, images
              materially help, clear payoff, share-worthy. Rough guide:{" "}
              <strong className="text-foreground">~22+/30</strong> is flagship-quality;
              under that may still ship, but isn&apos;t your best showcase.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              At this stage, &ldquo;perfect&rdquo; means: easy to start, satisfying to finish,
              looks good on mobile, you&apos;re proud to share, and some readers actually do.{" "}
              <strong className="text-foreground">
                If you wouldn&apos;t send it to a friend, keep editing.
              </strong>
            </p>
          </div>

          <div className="pt-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Start a StoryWall
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
