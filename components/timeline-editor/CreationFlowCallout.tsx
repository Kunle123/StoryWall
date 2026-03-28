import type { ReactNode } from "react";
import Link from "next/link";
import { Lightbulb } from "lucide-react";

export type CreationFlowStep = 1 | 2 | 3 | 4 | 5 | 6;

const STEP_COPY: Record<
  CreationFlowStep,
  { title: string; body: ReactNode }
> = {
  1: {
    title: "Start with a premise strangers get in seconds",
    body: (
      <>
        Name a <strong className="text-foreground">specific</strong> story—not vague
        topics. In the description, sketch the arc: where it starts, key turns, and why it
        matters <em>now</em>. Strong fits: explainers, rise/fall, history, anything where{" "}
        <strong className="text-foreground">order in time</strong> is the point.{" "}
        <Link
          href="/guide/great-stories"
          className="text-primary font-medium underline-offset-4 hover:underline"
        >
          What makes a great StoryWall?
        </Link>
      </>
    ),
  },
  2: {
    title: "Build a chronological arc",
    body: (
      <>
        Choose a voice, then generate events or add them manually. Most strong walls use
        about <strong className="text-foreground">6–12 beats</strong>—each event is one step
        in the story. You can delete or merge panels later; clarity beats cleverness.
      </>
    ),
  },
  3: {
    title: "Make every panel earn its place",
    body: (
      <>
        Each event should do <strong className="text-foreground">one job</strong> (context,
        turn, consequence…). If two panels repeat, cut one. Descriptions and image prompts
        should <strong className="text-foreground">sharpen the moment</strong>, not decorate
        it.
      </>
    ),
  },
  4: {
    title: "One visual world",
    body: (
      <>
        Sticking to one style helps readers follow the arc{" "}
        <strong className="text-foreground">visually</strong> as well as in text—especially
        when they skim.
      </>
    ),
  },
  5: {
    title: "Images that add meaning",
    body: (
      <>
        <strong className="text-foreground">AI</strong> uses your credits;{" "}
        <strong className="text-foreground">upload</strong> when you already have the right
        photo. Either way, each image should make the beat clearer or more memorable—not
        filler. See{" "}
        <Link
          href="/guide/great-stories"
          className="text-primary font-medium underline-offset-4 hover:underline"
        >
          the guide
        </Link>
        .
      </>
    ),
  },
  6: {
    title: "Before you publish",
    body: (
      <>
        Is the premise obvious from the title? Would you be{" "}
        <strong className="text-foreground">proud to share</strong> this with a friend? If
        not, go back and tighten—then publish and share.{" "}
        <Link
          href="/guide/great-stories"
          className="text-primary font-medium underline-offset-4 hover:underline"
        >
          Reminders
        </Link>
        .
      </>
    ),
  },
};

export function CreationFlowCallout({ step }: { step: CreationFlowStep }) {
  const { title, body } = STEP_COPY[step];
  return (
    <div
      className="rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-muted-foreground"
      role="note"
    >
      <div className="flex gap-3">
        <Lightbulb
          className="w-5 h-5 shrink-0 text-primary mt-0.5"
          aria-hidden
        />
        <div className="space-y-1.5 min-w-0">
          <p className="font-medium text-foreground leading-snug">{title}</p>
          <div className="leading-relaxed">{body}</div>
        </div>
      </div>
    </div>
  );
}
