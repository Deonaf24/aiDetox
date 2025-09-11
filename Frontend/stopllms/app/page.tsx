import Hero from "@/components/sections/hero/default";
import FAQ from "@/components/sections/faq/default";
import Footer from "@/components/sections/footer/default";
import CTA from "@/components/sections/cta/default";

import Image from "next/image";

export default function Home() {
  return (
    <>
      <Hero />
      <FAQ />
      <CTA />
      <Footer />
    </>
  );
}
