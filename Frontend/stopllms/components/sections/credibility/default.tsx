import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";

const highlights = [
  {
    title: "Backed by the Dobson Centre",
    description:
      "The Lean Startup Program run by McGill University&apos;s Dobson Centre for Entrepreneurship selected StopLLMs for its latest cohort, validating the need for healthier relationships with AI.",
  },
  {
    title: "Guided by seasoned mentors",
    description:
      "We now receive hands-on coaching from experienced founders and operators who challenge our roadmap, go-to-market plans, and impact metrics.",
  },
  {
    title: "Trusted peer community",
    description:
      "Building alongside a cohort of mission-driven startups keeps us accountable and sharp as we test and scale responsible technology habits.",
  },
] satisfies {
  title: string;
  description: string;
}[];

export default function CredibilitySection() {
  return (
    <Section className="bg-muted/30">
      <div className="max-w-container mx-auto flex flex-col items-center gap-8 text-center">
        <Badge
          variant="outline"
          className="px-4 py-1.5 text-xs uppercase tracking-wide text-muted-foreground"
        >
          Recognition
        </Badge>
        <h2 className="text-3xl font-semibold text-balance sm:text-5xl">
          Accepted into the Dobson Lean Startup Program
        </h2>
        <p className="text-muted-foreground max-w-3xl text-balance text-base sm:text-lg">
          Joining the Dobson Lean Startup Program gives StopLLMs access to world-class mentorship and evidence-based frameworks as we help people stay in control of AI.
        </p>
        <div className="grid w-full gap-6 text-left sm:grid-cols-2 xl:grid-cols-3">
          {highlights.map((highlight) => (
            <Card key={highlight.title}>
              <CardTitle>{highlight.title}</CardTitle>
              <CardDescription>{highlight.description}</CardDescription>
            </Card>
          ))}
        </div>
        <Button asChild size="lg" variant="glow">
          <Link href="/about">See how we&apos;re growing</Link>
        </Button>
      </div>
    </Section>
  );
}
