import { Card, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function formatDate(d = new Date()) {
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export default function Privacy() {
  const lastUpdatedISO = new Date().toISOString().slice(0, 10);

  return (
    <Card className="mx-auto max-w-3xl">
      {/* Top anchor for "Back to top" link */}
      <div id="top" />

      <CardTitle>Privacy Policy</CardTitle>
      <CardDescription>How StopLLMs handles your information.</CardDescription>

      <CardContent
        className={[
          "prose prose-sm dark:prose-invert max-w-none",
          "prose-a:no-underline hover:prose-a:underline prose-a:underline-offset-4",
          "prose-ul:my-2 prose-li:my-0.5 prose-code:font-medium"
        ].join(" ")}
      >
        <nav
          aria-label="Table of contents"
          className="not-prose sticky top-4 z-10 mb-6 rounded-lg border bg-background/60 p-3 backdrop-blur sm:p-4 lg:float-right lg:ml-6 lg:w-72"
        >
          <ul className="grid gap-2">
            <li><a href="#what-we-collect">1. Information We Collect</a></li>
            <li><a href="#how-we-use">2. How We Use Your Information</a></li>
            <li><a href="#retention">3. Data Retention</a></li>
            <li><a href="#choices">4. Your Choices</a></li>
            <li><a href="#security">5. Security</a></li>
            <li><a href="#children">6. Children’s Privacy</a></li>
            <li><a href="#changes">7. Changes</a></li>
            <li><a href="#contact">8. Contact Us</a></li>
          </ul>
        </nav>

        <p>
          Thank you for using StopLLMs. This policy explains what information we collect, how we use it, and the options you have. By using the Extension, you agree to this policy.
        </p>

        <section id="what-we-collect" className="scroll-mt-24">
          <h2>1. Information We Collect</h2>
          <ul>
            <li><strong>Login information:</strong> Helps keep you signed in and connects your activity to your account.</li>
            <li><strong>Usage activity:</strong> Records which sites you interact with, when, and what action you chose (continue or block). This can be kept only on your device or also synced to your account.</li>
            <li><strong>Reasons you provide:</strong> Notes you write before choosing to continue. These can stay on your device or be synced so you can review them later.</li>
            <li><strong>Device details:</strong> A simple identifier and browser version, used to tell devices apart and fix issues.</li>
          </ul>
          <p>
            We <strong>do not</strong> collect the content of websites you visit, your browsing history outside of AI-related sites, or sensitive personal data.
          </p>
        </section>

        <section id="how-we-use" className="scroll-mt-24">
          <h2>2. How We Use Your Information</h2>
          <ul>
            <li>Run the Extension’s main features like limits, reminders, and activity logs.</li>
            <li>Understand which features are most helpful so we can improve the product.</li>
            <li>Keep your account safe and make sure only you can see your data.</li>
            <li>Reply when you reach out to us for support.</li>
          </ul>
          <p>We never sell or share your information with advertisers or unrelated third parties.</p>
        </section>

        <section id="retention" className="scroll-mt-24">
          <h2>3. Data Retention</h2>
          <ul>
            <li><strong>On your device:</strong> Your data stays until you uninstall the Extension or clear it in settings.</li>
            <li><strong>In the cloud:</strong> If you sync data, it stays until you delete it or your account is inactive for a long period.</li>
          </ul>
        </section>

        <section id="choices" className="scroll-mt-24">
          <h2>4. Your Choices</h2>
          <ul>
            <li>See or delete your logs at any time in the Extension.</li>
            <li>Export your logs to a file (feature coming soon).</li>
            <li>Ask us to delete synced data linked to your account.</li>
            <li>Remove all data by uninstalling the Extension.</li>
          </ul>
        </section>

        <section id="security" className="scroll-mt-24">
          <h2>5. Security</h2>
          <p>
            We use standard security measures like encryption to protect your information in storage and while it’s being sent. No system is completely secure, so please use the Extension at your own discretion.
          </p>
        </section>

        <section id="children" className="scroll-mt-24">
          <h2>6. Children’s Privacy</h2>
          <p>
            The Extension is not for children under 13, and we don’t knowingly collect their information. If a child’s data is shared with us, we will delete it.
          </p>
        </section>

        <section id="changes" className="scroll-mt-24">
          <h2>7. Changes</h2>
          <p>
            We may update this policy sometimes. If there are important changes, we’ll let you know through the Extension or on our website. Using the Extension after updates means you accept the new policy.
          </p>
        </section>

        <section id="contact" className="scroll-mt-24">
          <h2>8. Contact Us</h2>
          <p>
            Website: <a href="https://stopllms.com/Privacy" target="_blank" rel="noopener noreferrer">https://stopllms.com/Privacy</a>
          </p>
          <p>
            By using StopLLMs, you confirm that you’ve read and understood this Privacy Policy.
          </p>
        </section>
      </CardContent>

      <time dateTime={lastUpdatedISO} className="text-xs text-muted-foreground block mt-4">
        Last updated: {formatDate()}
      </time>
      <Button asChild variant="outline" size="sm" className="mt-2">
        <a href="#top">Back to top</a>
      </Button>
    </Card>
  );
}
