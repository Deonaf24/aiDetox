"use client";

import { ChangeEvent, FormEvent, useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "../../ui/button";
import Glow from "../../ui/glow";
import { Section } from "../../ui/section";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";

const SIMULATED_REQUEST_DELAY = 1200;

type SubmissionStatus = "idle" | "success" | "error";

function simulateSubscriptionRequest() {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, SIMULATED_REQUEST_DELAY);
  });
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

interface CTAProps {
  title?: string;
  className?: string;
}

export default function CTA({
  title = "Sign up for our mailing list.",
  className,
}: CTAProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setStatus("error");
      setFeedback("Please enter your email address.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setStatus("error");
      setFeedback("Please provide a valid email address.");
      return;
    }

    setStatus("idle");
    setFeedback(null);
    setIsSubmitting(true);

    try {
      await simulateSubscriptionRequest();
      setEmail("");
      setStatus("success");
      setFeedback("Thanks for signing up! We'll be in touch soon.");
    } catch (error) {
      console.error("Newsletter subscription failed", error);
      setStatus("error");
      setFeedback("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);

    if (status !== "idle") {
      setStatus("idle");
      setFeedback(null);
    }
  };

  return (
    <Section className={cn("group relative overflow-hidden", className)}>
      <div className="max-w-container relative z-10 mx-auto flex flex-col items-center gap-6 text-center sm:gap-8">
        <h2 className="max-w-[640px] text-3xl leading-tight font-semibold sm:text-5xl sm:leading-tight">
          {title}
        </h2>
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:items-center"
        >
          <Input
            type="email"
            name="email"
            placeholder="Enter your email"
            required
            className="flex-1"
            value={email}
            onChange={handleEmailChange}
          />
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Sign Up"}
          </Button>
        </form>
        <div
          aria-live="polite"
          className="min-h-[1.5rem] w-full max-w-md"
        >
          {status === "success" && feedback ? (
            <div className="flex justify-center">
              <Badge className="px-3 py-1.5 text-sm">
                {feedback}
              </Badge>
            </div>
          ) : null}

          {status === "error" && feedback ? (
            <div className="flex justify-center">
              <Badge variant="destructive" className="px-3 py-1.5 text-sm">
                {feedback}
              </Badge>
            </div>
          ) : null}
        </div>
      </div>

      <div className="absolute top-0 left-0 h-full w-full translate-y-[1rem] opacity-80 transition-all duration-500 ease-in-out group-hover:translate-y-[-2rem] group-hover:opacity-100">
        <Glow variant="bottom" />
      </div>
    </Section>
  );
}
