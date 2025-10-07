import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import Footer from "@/components/sections/footer/default";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Section } from "@/components/ui/section";

const CHROME_WEB_STORE_URL =
  "https://chromewebstore.google.com/detail/stop-llms/ffeakphhflnpgnjlblnpohnnhodjnial";

type NextStep = {
  title: string;
  description: string;
  href?: string;
  linkText?: string;
};

const nextSteps = [
  {
    title: "Sign in to StopLLMs",
    description:
      "Return to the StopLLMs extension or web app and log in with your verified email to finish onboarding.",
  },
  {
    title: "Set mindful guardrails",
    description:
      "Update your usage goals so we can remind you to pause before visiting AI chatbots when it matters most.",
  },
  {
    title: "Need a refresher?",
    description:
      "Visit our documentation on GitHub for installation tips, feature overviews, and troubleshooting guidance.",
    href: "https://github.com/Deonaf24/aiDetox",
    linkText: "Read the docs",
  },
] satisfies NextStep[];

export const metadata: Metadata = {
  title: "Email verified — StopLLMs",
  description:
    "Confirmation page letting you know your StopLLMs email address has been verified successfully.",
};

export default function EmailVerifiedPage() {
  return (
    <main className="flex flex-col">
      <Section className="flex-1">
        <div className="max-w-container mx-auto flex flex-col items-center gap-12 text-center">
          <Card className="max-w-2xl w-full items-center text-center">
            <span className="bg-primary/10 text-primary border border-primary/20 flex size-16 items-center justify-center rounded-full">
              <CheckCircle2 aria-hidden="true" className="size-8" />
            </span>
            <CardTitle className="text-balance text-3xl sm:text-4xl">
              You&apos;re all verified!
            </CardTitle>
            <CardDescription className="text-lg text-balance">
              Thanks for confirming your email address. You can now sign in to StopLLMs and keep building mindful technology habits with the tools you trust.
            </CardDescription>
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/">Go to the homepage</Link>
            </Button>
            <p className="text-muted-foreground text-sm">
              If you started verification from the extension, you can close this tab—the confirmation will sync automatically the next time you open it.
            </p>
          </Card>

          <div className="flex w-full flex-col items-center gap-6">
            <div className="flex flex-col gap-2 text-center">
              <h2 className="text-foreground text-2xl font-semibold sm:text-3xl">
                What happens next?
              </h2>
              <p className="text-muted-foreground max-w-2xl text-balance">
                Follow these quick reminders to make the most of your verified account and stay intentional with AI assistance.
              </p>
            </div>
            <div className="grid w-full max-w-4xl gap-4 text-left sm:grid-cols-3">
              {nextSteps.map((step) => (
                <Card key={step.title} className="h-full gap-4 text-left">
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    {step.description}
                    {step.href && step.linkText && (
                      <>
                        {" "}
                        <a
                          href={step.href}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary font-medium underline-offset-4 hover:underline"
                        >
                          {step.linkText}
                        </a>
                        .
                      </>
                    )}
                  </CardDescription>
                </Card>
              ))}
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className="text-muted-foreground text-sm">
                Need to install the extension again?
              </p>
              <Button asChild variant="glow" size="lg">
                <a href={CHROME_WEB_STORE_URL} target="_blank" rel="noreferrer">
                  Reinstall StopLLMs
                </a>
              </Button>
            </div>
          </div>
        </div>
      </Section>
      <Footer />
    </main>
  );
}
