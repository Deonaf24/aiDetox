import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/sections/footer/default";

import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "About StopLLMs",
  description:
    "Learn about the mission, team, and roadmap guiding StopLLMs as we help people stay in control of their thinking.",
};

const features = [
  {
    title: "Mindful checkpoints",
    description:
      "Reflection prompts encourage you to pause, articulate intent, and decide whether AI assistance is truly needed before continuing.",
  },
  {
    title: "Adaptive usage limits",
    description:
      "Personalized guardrails help you set healthy boundaries with daily caps, cooldowns, and context-aware reminders.",
  },
  {
    title: "Progress insights",
    description:
      "Lightweight analytics highlight streaks, mindful wins, and trends so you can celebrate progress without feeling surveilled.",
  },
  {
    title: "Accountability",
    description:
      "Streaks and leaderboard with your friends help keep you accountable and consistent.",
  },
] satisfies {
  title: string;
  description: string;
}[];

const team = [
  {
    name: "Eli Polterovich",
    role: "Co-founder & CEO",
    bio: "Product strategist focused on designing gentle friction that restores attention and confidence without sacrificing productivity.",
  },
  {
    name: "Deon Aftahi",
    role: "Co-founder & CTO",
    bio: "Engineer behind the StopLLMs extension, bridging behavioral science with privacy-first systems that work across modern browsers.",
  },
  {
    name: "Advisors & Community",
    role: "Psychologists, Industry Professionals, and early adopters",
    bio: "A growing circle of experts and supporters pressure-test our ideas, share lived experiences, and help define responsible AI practices.",
  },
] satisfies {
  name: string;
  role: string;
  bio: string;
}[];

const roadmap = [
  {
    title: "Public release",
    timeframe: "Summer 2025",
    description:
      "We're happy to announce that Stop LLMs is officially available to download on the Chrome Web Store.",
  },
  {
    title: "Cross-platform coverage",
    timeframe: "Q3 2025",
    description:
      "Expand beyond Chromium with Firefox support, mobile companions, and integrations wherever AI access decisions are made.",
  },
  {
    title: "Stop LLMs Platform for Educators",
    timeframe: "2026",
    description:
      "We're expanding our platform from the browser into the classroom, with plans to create tools which allow for teachers and parents to ensure that the next generation isn't overraliant on AI. ",
  },
  {
    title: "World's First AI Detox clinic",
    timeframe: "Beyond",
    description:
      "We want to become the one stop shop for all problems related to AI. Whether that be emotional dependance, addiction, or simply overreliance.",
  },
] satisfies {
  title: string;
  timeframe: string;
  description: string;
}[];

export default function AboutPage() {
  return (
    <main className="flex flex-col">
      <Section id="mission">
        <div className="max-w-container mx-auto flex flex-col items-center gap-6 text-center sm:gap-8">
          <div className="flex flex-col items-center gap-4 sm:gap-6">
            <span className="text-primary/80 text-sm font-semibold uppercase tracking-wide">
              Our mission
            </span>
            <h1 className="text-4xl leading-tight font-semibold text-balance sm:text-6xl sm:leading-tight">
              We build gentle guardrails that keep humans in control of AI.
            </h1>
            <p className="text-muted-foreground max-w-3xl text-lg text-balance sm:text-xl">
              StopLLMs helps workers, students, and teams stay sharp by introducing purposeful pauses before outsourcing tough thinking. We combine behavioral science, community accountability, and respectful technology to reinforce your own voice.
            </p>
          </div>
          <div className="grid w-full gap-4 text-left sm:grid-cols-3">
            <div className="bg-muted/40 rounded-lg p-5">
              <h2 className="text-lg font-semibold">Protect attention</h2>
              <p className="text-muted-foreground text-sm">
                Minimize autopilot AI usage by giving yourself a moment to notice impulses and choose with intention.
              </p>
            </div>
            <div className="bg-muted/40 rounded-lg p-5">
              <h2 className="text-lg font-semibold">Celebrate progress</h2>
              <p className="text-muted-foreground text-sm">
                Track meaningful streaks and mindful wins that show how your skills are growing without AI shortcuts.
              </p>
            </div>
            <div className="bg-muted/40 rounded-lg p-5">
              <h2 className="text-lg font-semibold">Respect privacy</h2>
              <p className="text-muted-foreground text-sm">
                Log only what is needed, never your content, so accountability never comes at the cost of trust.
              </p>
            </div>
          </div>
          <Button asChild size="lg">
            <Link href="#features">Explore the platform</Link>
          </Button>
        </div>
      </Section>

      <Section id="features" className="bg-muted/20">
        <div className="max-w-container mx-auto flex flex-col gap-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="text-primary/80 text-sm font-semibold uppercase tracking-wide">
              Product pillars
            </span>
            <h2 className="text-3xl font-semibold text-balance sm:text-5xl">
              Features designed for mindful technology habits.
            </h2>
            <p className="text-muted-foreground max-w-2xl text-balance">
              Every interaction is crafted to reinforce agency. From gentle nudges to opt-in sharing, StopLLMs fits around your goals instead of dictating them.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      <Section id="team">
        <div className="max-w-container mx-auto flex flex-col gap-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="text-primary/80 text-sm font-semibold uppercase tracking-wide">
              The people behind StopLLMs
            </span>
            <h2 className="text-3xl font-semibold text-balance sm:text-5xl">
              A team committed to healthier AI habits.
            </h2>
            <p className="text-muted-foreground max-w-2xl text-balance">
              We blend entrepreneurship, engineering, and community building experience to ensure StopLLMs is practical, humane, and ready for the next generation of work.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {team.map((member) => (
              <Card key={member.name}>
                <CardTitle>{member.name}</CardTitle>
                <CardDescription>
                  <span className="text-primary text-sm font-semibold uppercase tracking-wide">
                    {member.role}
                  </span>
                  {member.bio}
                </CardDescription>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      <Section id="roadmap" className="bg-muted/20">
        <div className="max-w-container mx-auto flex flex-col gap-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="text-primary/80 text-sm font-semibold uppercase tracking-wide">
              Roadmap
            </span>
            <h2 className="text-3xl font-semibold text-balance sm:text-5xl">
              What we&apos;re building next.
            </h2>
            <p className="text-muted-foreground max-w-2xl text-balance">
              Our roadmap is shaped with community feedback. Each milestone deepens the support we provide without compromising your autonomy.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {roadmap.map((item) => (
              <Card key={item.title}>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>
                  <span className="text-primary text-sm font-semibold uppercase tracking-wide">
                    {item.timeframe}
                  </span>
                  {item.description}
                </CardDescription>
              </Card>
            ))}
          </div>
          <div className="flex justify-center">
            <Button asChild size="lg" variant="glow">
              <Link href="/">Return to the homepage</Link>
            </Button>
          </div>
        </div>
      </Section>
      <Footer />
    </main>
  );
}
