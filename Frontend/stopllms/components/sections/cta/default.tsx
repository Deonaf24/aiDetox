"use client";

import { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Button } from "../../ui/button";
import Glow from "../../ui/glow";
import { Section } from "../../ui/section";
import { Input } from "../../ui/input";

interface CTAProps {
  title?: string;
  className?: string;
}

export default function CTA({
  title = "Sign up for our mailing list.",
  className,
}: CTAProps) {
  return (
    <Section className={cn("group relative overflow-hidden", className)}>
      <div className="max-w-container relative z-10 mx-auto flex flex-col items-center gap-6 text-center sm:gap-8">
        <h2 className="max-w-[640px] text-3xl leading-tight font-semibold sm:text-5xl sm:leading-tight">
          {title}
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const email = formData.get("email");
            console.log("Submitted email:", email);
            // TODO: hook up to newsletter API
          }}
          className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:items-center"
        >
          <Input
            type="email"
            name="email"
            placeholder="Enter your email"
            required
            className="flex-1"
          />
          <Button type="submit" size="lg">
            Sign Up
          </Button>
        </form>
      </div>

      <div className="absolute top-0 left-0 h-full w-full translate-y-[1rem] opacity-80 transition-all duration-500 ease-in-out group-hover:translate-y-[-2rem] group-hover:opacity-100">
        <Glow variant="bottom" />
      </div>
    </Section>
  );
}
