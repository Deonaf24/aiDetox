import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

import { cn } from "@/lib/utils";

import Github from "../../logos/github";
import { Badge } from "../../ui/badge";
import { Button, type ButtonProps } from "../../ui/button";
import Glow from "../../ui/glow";
import { Mockup, MockupFrame } from "../../ui/mockup";
import { Section } from "../../ui/section";
import WordFlip from "../../ui/word-flip";

interface HeroButtonProps {
  href: string;
  text: string;
  variant?: ButtonProps["variant"];
  icon?: ReactNode;
  iconRight?: ReactNode;
  target?: string;
  rel?: string;
}

interface HeroProps {
  title?: string;
  description?: ReactNode;
  mockup?: ReactNode | false;
  badge?: ReactNode | false;
  buttons?: HeroButtonProps[] | false;
  className?: string;
}

export default function Hero({
  title = "Take back control of your life.",
  description = (
    <>
      Studies out of MIT have shown that overreliance on AI causes your brain to shrink.
      {" "}The solution: writing your own{" "}
      <WordFlip
        words={[  "emails",
          "texts",
          "reports",
          "papers",
          "essays",
          "articles",
          "stories",
          "presentations",
          "plans",
          "notes"]}
        // optional: tighten layout to avoid width jumping
        className="inline-block w-[7ch] text-left"
      />
    </>
  ),
  mockup = (
    <video
      src="/Preview.mov"
      poster="/dashboard-dark.png"
      className="w-full rounded-xl"
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
    />
  ),
  badge = (
    <Badge variant="outline" className="animate-appear">
      <span className="text-muted-foreground">
        Stop LLMs is coming soon!
      </span>
      <a href="/about" className="flex items-center gap-1">
        Learn more
        <ArrowRightIcon className="size-3" />
      </a>
    </Badge>
  ),
  buttons = [
    {
      href: "/about",
      text: "Discover StopLLMs",
      variant: "default",
    },
    {
      href: "https://github.com/Deonaf24/aiDetox",
      text: "View the GitHub repo",
      variant: "glow",
      icon: <Github className="mr-2 size-4" />,
      target: "_blank",
      rel: "noreferrer",
    },
  ],
  className,
}: HeroProps) {
  return (
    <Section
      className={cn(
        "fade-bottom overflow-hidden pb-0 sm:pb-0 md:pb-0",
        className,
      )}
    >
      <div className="max-w-container mx-auto flex flex-col gap-12 pt-16 sm:gap-24">
        <div className="flex flex-col items-center gap-6 text-center sm:gap-12">
          {badge !== false && badge}
          <h1 className="animate-appear from-foreground to-foreground dark:to-muted-foreground relative z-10 inline-block bg-linear-to-r bg-clip-text text-4xl leading-tight font-semibold text-balance text-transparent drop-shadow-2xl sm:text-6xl sm:leading-tight md:text-8xl md:leading-tight">
            {title}
          </h1>
          <p className="text-md animate-appear text-muted-foreground relative z-10 max-w-[740px] font-medium text-balance opacity-0 delay-100 sm:text-xl">
            {description}
          </p>
          {buttons !== false && buttons.length > 0 && (
            <div className="animate-appear relative z-10 flex justify-center gap-4 opacity-0 delay-300">
              {buttons.map((button, index) => {
                const isInternalLink = button.href.startsWith("/");
                return (
                  <Button
                    key={index}
                    variant={button.variant || "default"}
                    size="lg"
                    asChild
                  >
                    {isInternalLink ? (
                      <Link href={button.href}>
                        {button.icon}
                        {button.text}
                        {button.iconRight}
                      </Link>
                    ) : (
                      <a
                        href={button.href}
                        target={button.target ?? "_blank"}
                        rel={button.rel ?? "noreferrer"}
                      >
                        {button.icon}
                        {button.text}
                        {button.iconRight}
                      </a>
                    )}
                  </Button>
                );
              })}
            </div>
          )}
          {mockup !== false && (
            <div className="relative w-full pt-12">
              <MockupFrame
                className="animate-appear opacity-0 delay-700"
                size="small"
              >
                <Mockup
                  type="responsive"
                  className="bg-background/90 w-full rounded-xl border-0"
                >
                  {mockup}
                </Mockup>
              </MockupFrame>
              <Glow
                variant="top"
                className="animate-appear-zoom opacity-0 delay-1000"
              />
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
