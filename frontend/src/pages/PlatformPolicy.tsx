import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PublicHero } from "@/components/layout/PublicHero";
import { SEOHead } from "@/components/SEOHead";
import { organizationLd, webPageLd, breadcrumbListLd } from "@/lib/jsonld";

const updated = "11 October 2026";

const sections = [
  {
    id: "who",
    title: "Who we are",
    body: (
      <>
        <p>
          Bootskills is an online learning and work platform based in Kigali, Rwanda. We run courses,
          internships, client projects, and business services for people in Rwanda, across Africa, and worldwide.
        </p>
        <p>
          Questions: <a href="mailto:info@bootskills.com">info@bootskills.com</a>, WhatsApp{" "}
          <a href="https://wa.me/250784086021">+250 784 086 021</a>, or{" "}
          <Link to="/contact">contact us</Link>.
        </p>
      </>
    ),
  },
  {
    id: "using",
    title: "Using the platform",
    body: (
      <>
        <p>
          You may browse public pages without an account. Creating an account means you agree to this policy.
          Keep your login private. You are responsible for what happens on your account.
        </p>
        <p>
          Roles include student, trainer, admin, and others we assign. Each role only sees what it needs.
          We may suspend an account that harms learners, staff, or the platform.
        </p>
      </>
    ),
  },
  {
    id: "learning",
    title: "Courses, internships, and projects",
    body: (
      <>
        <p>
          Published course titles, descriptions, and syllabi are public so people (and search tools) can
          choose a course. Lesson videos, quizzes, and graded work stay behind enrollment.
        </p>
        <p>
          Paid courses stay paid until you complete checkout. Free courses still need an account to enroll.
          Certificates are issued when the course rules are met. Internships and client projects have their
          own applications, contracts, and deadlines — follow those on the program page.
        </p>
      </>
    ),
  },
  {
    id: "money",
    title: "Payments, refunds, and payouts",
    body: (
      <>
        <p>
          Prices are shown on the course or program. We collect payment through the methods offered at
          checkout (including mobile money and card where available).
        </p>
        <p>
          Refund requests go through the in-app refund flow. Approval is not automatic. A processing fee
          may apply where the payment provider or our refund rules require it.
        </p>
        <p>
          Trainers and staff who receive commissions must keep a valid phone number on their account so
          we can send payouts. Without a number, courses can stay live, but we cannot pay commissions.
        </p>
      </>
    ),
  },
  {
    id: "data",
    title: "Information we keep",
    body: (
      <>
        <p>We keep what we need to run Bootskills:</p>
        <ul>
          <li>Name, email, phone, password (stored hashed), role, and profile details you give us</li>
          <li>Course progress, submissions, grades, certificates, and messages on the platform</li>
          <li>Payments, invoices, and refund records</li>
          <li>Contact and meeting requests sent from the public forms (name, email, phone, message, requested time)</li>
          <li>Technical logs (device, browser, IP) to keep the service secure</li>
        </ul>
        <p>
          We use this to teach, support you, send emails you asked for, improve the product, and meet
          legal or payment-provider rules. We do not sell your personal information.
        </p>
      </>
    ),
  },
  {
    id: "location",
    title: "Location",
    body: (
      <>
        <p>
          If you are signed in, the platform may store an approximate location so operations staff can
          support safety, attendance, and platform integrity. We first try the location your browser
          allows. If that is blocked, we may use an estimate from your IP address.
        </p>
        <p>
          You can refuse browser location. Turning it off does not always hide a coarse IP-based estimate.
          If you need location storage turned off on your account, email us and we will handle it as a
          support request.
        </p>
      </>
    ),
  },
  {
    id: "email-meetings",
    title: "Email and public meetings",
    body: (
      <>
        <p>
          Messages and meeting requests on <Link to="/contact">/contact</Link> and{" "}
          <Link to="/book">/book</Link> are emailed to our team and a copy may go to the address you typed.
          Anyone with the booking link can request a time — no login. Do not put secrets in that form.
        </p>
        <p>We reply from our Bootskills mailbox. You can share the booking link by copy, WhatsApp, or email.</p>
      </>
    ),
  },
  {
    id: "ai",
    title: "AI on the platform",
    body: (
      <>
        <p>
          Some features use AI (help, grading support, recommendations). Do not paste secrets, exam answers
          you should not share, or other people’s private data into AI tools. AI output can be wrong —
          you remain responsible for your submissions.
        </p>
      </>
    ),
  },
  {
    id: "content",
    title: "Your content and ours",
    body: (
      <>
        <p>
          Course materials, branding, and software belong to Bootskills or our licensors. You may use them
          to learn on the platform, not to copy, resell, or republish without written permission.
        </p>
        <p>
          Work you submit (assignments, projects, chat) stays yours. You give us a license to store, show,
          and grade it so the course or project can run. Do not upload anything you do not have the right
          to share.
        </p>
      </>
    ),
  },
  {
    id: "conduct",
    title: "Fair use",
    body: (
      <>
        <p>
          Be respectful. No harassment, cheating rings, malware, spam, or attempts to break into accounts
          or systems. We may remove content or close accounts that break this. Report problems to{" "}
          <a href="mailto:info@bootskills.com">info@bootskills.com</a>.
        </p>
      </>
    ),
  },
  {
    id: "age",
    title: "Age",
    body: (
      <>
        <p>
          The platform is built for learners who can agree to this policy. If you are under the age of
          digital consent in your country, a parent or guardian should create or approve the account.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes",
    body: (
      <>
        <p>
          We may update this page when the product changes. The date at the top is the latest version.
          Continued use after an update means you accept the new text. If a change is major, we will try
          to say so by email or an in-app note.
        </p>
      </>
    ),
  },
];

export default function PlatformPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Platform policy"
        description="How Bootskills works: accounts, courses, payments, data, location, email, and fair use. Based in Kigali, serving Africa and worldwide."
        canonicalUrl="https://bootskills.com/policy"
        keywords="Bootskills policy, privacy, terms, Kigali, data protection"
      >
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              organizationLd,
              webPageLd(
                "Platform policy",
                "How Bootskills works: accounts, courses, payments, data, and fair use.",
                "https://bootskills.com/policy"
              ),
              breadcrumbListLd([
                { name: "Home", item: "/" },
                { name: "Policy", item: "/policy" },
              ]),
            ],
          })}
        </script>
      </SEOHead>
      <Header />
      <main className="pt-20">
        <PublicHero
          eyebrow="Policy"
          title="How this system works"
          line={`Plain language. Last updated ${updated}.`}
          compact
          actions={[{ to: "/contact", label: "Ask us", gold: true }]}
        />
        <article className="container mx-auto px-4 py-12 max-w-2xl space-y-10">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="space-y-3">
              <h2 className="font-heading text-xl font-semibold">{s.title}</h2>
              <div className="text-muted-foreground text-[15px] leading-relaxed space-y-3 [&_a]:text-accent [&_a]:underline-offset-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
                {s.body}
              </div>
            </section>
          ))}
        </article>
      </main>
      <Footer />
    </div>
  );
}
