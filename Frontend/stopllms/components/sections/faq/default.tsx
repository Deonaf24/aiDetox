import { ReactNode } from "react";


import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../ui/accordion";
import { Section } from "../../ui/section";

interface FAQItemProps {
  question: string;
  answer: ReactNode;
  value?: string;
}

interface FAQProps {
  title?: string;
  items?: FAQItemProps[] | false;
  className?: string;
}

export default function FAQ({
  title = "Questions and Answers",
  items = [
    {
      question:
        "Why Should I limit my use of AI?",
      answer: (
        <>
          <p className="text-muted-foreground mb-4 max-w-[640px] text-balance">
            In today&apos;s AI-driven world, we find ourselve&apos; performing decreaingly many intellectual tasks.
            Recent studies have shown that this has led to a measurable shrinking in the brain which can cause heaps of problems.
          </p>
          <p className="text-muted-foreground mb-4 max-w-[640px] text-balance">
              Our mission is to prevent as many people as possible from becoming overreliant on AI.
          </p>
        </>
      ),
    },
    {
      question: "Why use StopLLMs instead of a General Website Blocker",
      answer: (
        <>
          <p className="text-muted-foreground mb-4 max-w-[600px]">
            Stop LLMs is more than just a basic website blocker. Instead of completely blocking
            access to AI websites we encourage mindful use of AI by giving users a chance to second-guess
            whether they really need it for what they&apos;re doing.
          </p>
          <p className="text-muted-foreground mb-4 max-w-[600px]">
            Through the use of our in-house machine learning model, we can determine whether a user&apos; reason
            for using AI is justified or not; granting you access only when you truly need it.
          </p>
        </>
      ),
    },
    {
      question: "Which browsers does StopLLMs support?",
      answer: (
        <>
          <p className="text-muted-foreground mb-4 max-w-[580px]">
            Stop LLMs works on Chrome, Edge, Opera, Brave, and all other Chromium based browsers. 
            Support for Firefox is on the way!
          </p>
        </>
      ),
    },
  ],
  className,
}: FAQProps) {
  return (
    <Section className={className}>
      <div className="max-w-container mx-auto flex flex-col items-center gap-8">
        <h2 className="text-center text-3xl font-semibold sm:text-5xl">
          {title}
        </h2>
        {items !== false && items.length > 0 && (
          <Accordion type="single" collapsible className="w-full max-w-[800px]">
            {items.map((item, index) => (
              <AccordionItem
                key={index}
                value={item.value || `item-${index + 1}`}
              >
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </Section>
  );
}
