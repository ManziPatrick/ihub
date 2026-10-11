import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PublicHero } from "@/components/layout/PublicHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, Calendar, Copy, Check, Loader2, Share2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEOHead";
import { organizationLd, webPageLd, breadcrumbListLd } from "@/lib/jsonld";
import { getApiBaseUrl } from "@/lib/env";
import { SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_TEL, SUPPORT_WHATSAPP_URL } from "@/lib/publicContact";

const Contact = () => {
  const [params, setParams] = useSearchParams();
  const tab = params.get("book") === "1" ? "book" : "write";
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState({ name: "", email: "", phone: "", subject: "", note: "" });
  const [meet, setMeet] = useState({ name: "", email: "", phone: "", date: "", time: "", topic: "Intro call", notes: "" });

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "https://bootskills.com/contact?book=1";
    return `${window.location.origin}/contact?book=1`;
  }, []);

  const setTab = (next: "write" | "book") => {
    const nextParams = new URLSearchParams(params);
    if (next === "book") nextParams.set("book", "1");
    else nextParams.delete("book");
    setParams(nextParams, { replace: true });
  };

  const post = async (path: string, body: Record<string, string>) => {
    const res = await fetch(`${getApiBaseUrl()}/api/public${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not send.");
    return data;
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await post("/inquiry", {
        name: message.name,
        email: message.email,
        phone: message.phone,
        subject: message.subject,
        message: message.note,
        inquiryType: "general",
      });
      toast.success("Sent. Check your inbox — we reply from info@bootskills.com.");
      setMessage({ name: "", email: "", phone: "", subject: "", note: "" });
    } catch (err: any) {
      toast.error(err.message || "Could not send. Try emailing info@bootskills.com.");
    } finally {
      setSending(false);
    }
  };

  const bookMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await post("/meeting", meet);
      toast.success("Request sent. We'll email you the meeting link.");
    } catch (err: any) {
      toast.error(err.message || "Could not book that slot.");
    } finally {
      setSending(false);
    }
  };

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Booking link copied — send it to anyone.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed. Use the WhatsApp or email share instead.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Contact & book a meeting"
        description="Write Bootskills or book a public intro call. Share the booking link with anyone — we follow up by email."
        canonicalUrl="https://bootskills.com/contact"
        keywords="contact Bootskills, book a meeting Kigali, Bootskills email, intro call"
      >
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              organizationLd,
              webPageLd(
                "Contact & book a meeting",
                "Write Bootskills or book a public intro call. Share the booking link with anyone.",
                "https://bootskills.com/contact"
              ),
              breadcrumbListLd([
                { name: "Home", item: "/" },
                { name: "Contact", item: "/contact" },
              ]),
            ],
          })}
        </script>
      </SEOHead>
      <Header />
      <main className="pt-20">
        <PublicHero
          eyebrow="Say hello"
          title="We’re easy to reach."
          line="Send a note, or pick a time. You can share the booking link with a friend, a school, or a company."
          compact
        />

        <section className="py-10 lg:py-14">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="flex gap-2 p-1 rounded-2xl bg-muted/50 border border-border/40 mb-8 w-fit mx-auto">
              <button
                type="button"
                onClick={() => setTab("write")}
                className={`px-5 py-2 rounded-xl text-sm font-semibold ${tab === "write" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
              >
                Write us
              </button>
              <button
                type="button"
                onClick={() => setTab("book")}
                className={`px-5 py-2 rounded-xl text-sm font-semibold ${tab === "book" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
              >
                Book a meeting
              </button>
            </div>

            {tab === "write" ? (
              <form onSubmit={sendMessage} className="bg-card rounded-2xl border border-border/40 p-6 lg:p-8 space-y-4 shadow-card">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input required placeholder="Your name" value={message.name} onChange={(e) => setMessage({ ...message, name: e.target.value })} />
                  <Input required type="email" placeholder="Email" value={message.email} onChange={(e) => setMessage({ ...message, email: e.target.value })} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input type="tel" placeholder="Phone (optional)" value={message.phone} onChange={(e) => setMessage({ ...message, phone: e.target.value })} />
                  <Input placeholder="What’s this about?" value={message.subject} onChange={(e) => setMessage({ ...message, subject: e.target.value })} />
                </div>
                <Textarea required rows={5} placeholder="Tell us in a few lines." value={message.note} onChange={(e) => setMessage({ ...message, note: e.target.value })} />
                <Button type="submit" variant="gold" className="w-full h-11" disabled={sending}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send to our inbox"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">Goes to info@bootskills.com. We reply to your email.</p>
              </form>
            ) : (
              <form onSubmit={bookMeeting} className="bg-card rounded-2xl border border-border/40 p-6 lg:p-8 space-y-4 shadow-card">
                <p className="text-sm text-muted-foreground">Anyone can book — no login. We email you a meet link.</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input required placeholder="Your name" value={meet.name} onChange={(e) => setMeet({ ...meet, name: e.target.value })} />
                  <Input required type="email" placeholder="Email" value={meet.email} onChange={(e) => setMeet({ ...meet, email: e.target.value })} />
                </div>
                <Input type="tel" placeholder="Phone (optional)" value={meet.phone} onChange={(e) => setMeet({ ...meet, phone: e.target.value })} />
                <Input placeholder="Topic — e.g. training for our team" value={meet.topic} onChange={(e) => setMeet({ ...meet, topic: e.target.value })} />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input required type="date" value={meet.date} onChange={(e) => setMeet({ ...meet, date: e.target.value })} />
                  <Input required type="time" value={meet.time} onChange={(e) => setMeet({ ...meet, time: e.target.value })} />
                </div>
                <Textarea rows={3} placeholder="Anything we should know?" value={meet.notes} onChange={(e) => setMeet({ ...meet, notes: e.target.value })} />
                <Button type="submit" variant="gold" className="w-full h-11" disabled={sending}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Request this time"}
                </Button>
                <div className="flex flex-wrap gap-2 justify-center pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={copyShare}>
                    {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                    Copy booking link
                  </Button>
                  <a href={`${SUPPORT_WHATSAPP_URL}?text=${encodeURIComponent(`Book a Bootskills meeting: ${shareUrl}`)}`} target="_blank" rel="noreferrer">
                    <Button type="button" variant="outline" size="sm"><Share2 className="h-3.5 w-3.5 mr-1" /> WhatsApp</Button>
                  </a>
                  <a href={`mailto:?subject=${encodeURIComponent("Book a Bootskills meeting")}&body=${encodeURIComponent(`Pick a time here (no login):\n${shareUrl}`)}`}>
                    <Button type="button" variant="outline" size="sm"><Mail className="h-3.5 w-3.5 mr-1" /> Email this link</Button>
                  </a>
                </div>
              </form>
            )}

            <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-muted-foreground">
              <a className="inline-flex items-center gap-2 hover:text-foreground" href="mailto:info@bootskills.com"><Mail className="h-4 w-4 text-accent" /> info@bootskills.com</a>
              <a className="inline-flex items-center gap-2 hover:text-foreground" href={`tel:${SUPPORT_PHONE_TEL}`}><Phone className="h-4 w-4 text-accent" /> {SUPPORT_PHONE_DISPLAY}</a>
              <a className="inline-flex items-center gap-2 hover:text-foreground" href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noreferrer">WhatsApp {SUPPORT_PHONE_DISPLAY}</a>
              <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4 text-accent" /> Kigali · online worldwide</span>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
