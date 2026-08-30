/**
 * SocialPostGenerator - Marketing Template System
 * 
 * Super Admin/Admin can generate social media posts for:
 * - Courses (existing)
 * - Internships (new)
 * - Greetings / Happy Workers Day (new)
 * With custom image upload support.
 */

import { useState, useRef, useCallback } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_COURSES } from "@/lib/graphql/queries";
import { toPng, toJpeg } from "html-to-image";
import { motion, AnimatePresence } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { env } from "@/lib/env";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Image,
  Flame,
  Sparkles,
  Palette,
  Layout,
  Smartphone,
  Monitor,
  Check,
  Copy,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Eye,
  Hash,
  Type,
  Star,
  Clock,
  Users,
  Award,
  Zap,
  Target,
  DollarSign,
  Layers,
  Camera,
  BookOpen,
  Instagram,
  Briefcase,
  Heart,
  MapPin,
  Upload,
  Gift,
  PartyPopper,
  GraduationCap,
  Search,
  Loader2,
  ImagePlus,
} from "lucide-react";

// ─── Types ───

type PostType = "course" | "internship" | "greeting";
type TemplateStyle = "flame" | "professional" | "modern" | "minimal" | "celebration";
type Platform = "instagram" | "facebook" | "twitter" | "linkedin" | "whatsapp";
type AspectRatio = "1:1" | "4:5" | "9:16" | "16:9";

interface Course {
  id: string;
  title: string;
  descriptionSnippet: string;
  description: string;
  thumbnail: string;
  price: number;
  discountPrice: number;
  level: string;
  category: string;
  status: string;
}

interface InternshipData {
  role: string;
  company: string;
  location: string;
  duration: string;
  stipend: string;
  requirements: string;
  applyLink: string;
  deadline: string;
}

interface GreetingData {
  occasion: string;
  message: string;
  senderName: string;
  recipientName: string;
  occasionDate: string;
}

interface TemplateConfig {
  style: TemplateStyle;
  platform: Platform;
  aspectRatio: AspectRatio;
  headline: string;
  subheadline: string;
  ctaText: string;
  showPrice: boolean;
  showRating: boolean;
  accentColor: string;
  brandName: string;
  customImage: string | null;
  postType: PostType;
  internship?: InternshipData;
  greeting?: GreetingData;
}

// ─── Templates Configuration ───

const TEMPLATE_STYLES: { value: TemplateStyle; label: string; icon: React.ElementType; colors: string[] }[] = [
  { value: "flame", label: "Flame", icon: Flame, colors: ["#ff4500", "#ff6b35", "#ffd700", "#1a1a2e"] },
  { value: "professional", label: "Professional", icon: Layout, colors: ["#1e3a5f", "#2d6da8", "#e8f0fe", "#ffffff"] },
  { value: "modern", label: "Modern", icon: Sparkles, colors: ["#7c3aed", "#a78bfa", "#ede9fe", "#ffffff"] },
  { value: "minimal", label: "Minimal", icon: Palette, colors: ["#f8f9fa", "#e9ecef", "#212529", "#ffffff"] },
  { value: "celebration", label: "Celebration", icon: Star, colors: ["#059669", "#10b981", "#fef3c7", "#ffffff"] },
];

const PLATFORMS: { value: Platform; label: string; icon: React.ElementType; ratios: AspectRatio[]; defaultRatio: AspectRatio }[] = [
  { value: "instagram", label: "Instagram", icon: Instagram, ratios: ["1:1", "4:5", "9:16"], defaultRatio: "1:1" },
  { value: "facebook", label: "Facebook", icon: Facebook, ratios: ["1:1", "16:9"], defaultRatio: "1:1" },
  { value: "twitter", label: "Twitter / X", icon: Twitter, ratios: ["16:9", "1:1"], defaultRatio: "16:9" },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin, ratios: ["1:1", "4:5", "16:9"], defaultRatio: "1:1" },
  { value: "whatsapp", label: "WhatsApp", icon: Smartphone, ratios: ["9:16", "1:1"], defaultRatio: "9:16" },
];

const ASPECT_CLASSES: Record<AspectRatio, string> = {
  "1:1": "aspect-square max-w-[500px]",
  "4:5": "aspect-[4/5] max-w-[450px]",
  "9:16": "aspect-[9/16] max-h-[700px] max-w-[400px]",
  "16:9": "aspect-video max-w-[600px]",
};

const GREETING_OCCASIONS = [
  "Happy Workers Day",
  "Happy New Year",
  "Happy International Women's Day",
  "Happy Youth Day",
  "Happy Africa Day",
  "Happy Independence Day",
  "Merry Christmas",
  "Happy Easter",
  "Ramadan Kareem",
  "Eid Mubarak",
  "Happy Graduation Day",
  "Happy Teachers Day",
];

// ─── Shared Components ───

function BrandFooter({ brandName, tagline, light }: { brandName: string; tagline?: string; light?: boolean }) {
  return (
    <div className={`flex items-center justify-between text-[10px] pt-2 ${light ? "text-neutral-400 border-t border-neutral-200" : "text-white/30 border-t border-white/10"}`}>
      <span>{brandName}</span>
      <span>{tagline || "bootskills.com"}</span>
    </div>
  );
}

function CustomImageDisplay({ src }: { src: string }) {
  return (
    <div className="relative w-full h-32 md:h-40 rounded-xl overflow-hidden mb-3">
      <img src={src} alt="Uploaded" className="w-full h-full object-cover" />
    </div>
  );
}

// ═══════════════════════════════════════════════
//  COURSE TEMPLATES (existing)
// ═══════════════════════════════════════════════

function FlameTemplate({ course, config }: { course: Course; config: TemplateConfig }) {
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #1a0a00 0%, #2d0f00 30%, #4a1c00 60%, #1a0a00 100%)" }} />
      <div className="absolute top-0 left-0 right-0 h-2" style={{ background: "linear-gradient(90deg, #ff4500, #ff6b35, #ffd700, #ff6b35, #ff4500)" }} />
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #ff4500 0%, transparent 70%)" }} />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-15" style={{ background: "radial-gradient(circle, #ffd700 0%, transparent 70%)" }} />

      <div className="relative z-10 flex flex-col h-full p-6 md:p-8 justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline" className="border-orange-500/50 text-orange-400 bg-orange-950/30 text-[10px] px-3 py-1">
              <Zap className="w-3 h-3 mr-1 inline" />
              {config.brandName}
            </Badge>
            {course.category && (
              <Badge variant="secondary" className="bg-white/10 text-white/70 text-[10px]">
                {course.category}
              </Badge>
            )}
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2">
            {config.headline || course.title}
          </h2>
          {config.subheadline && <p className="text-sm text-orange-200/80 mb-3">{config.subheadline}</p>}
          <p className="text-xs text-white/60 line-clamp-2 mb-4">
            {course.descriptionSnippet || course.description?.substring(0, 120) || "Master in-demand skills with hands-on projects"}
          </p>
        </div>

        <div className="space-y-3">
          {config.showPrice && (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #ffd700, #ff6b35)" }}>
                {course.discountPrice || course.price?.toLocaleString()} RWF
              </span>
              {course.discountPrice && <span className="text-sm text-white/40 line-through">{course.price?.toLocaleString()} RWF</span>}
            </div>
          )}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #ff4500, #ff6b35)", boxShadow: "0 4px 20px rgba(255, 69, 0, 0.4)" }}>
              {config.ctaText || "🔥 Enroll Now"}
            </span>
            {config.showRating && (
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-xs text-white/70">4.9</span>
              </div>
            )}
          </div>
          <BrandFooter brandName={config.brandName + " Academy"} tagline="Learn. Build. Grow." />
        </div>
      </div>
    </div>
  );
}

function ProfessionalTemplate({ course, config }: { course: Course; config: TemplateConfig }) {
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ fontFamily: "'Outfit', sans-serif", background: "linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)" }}>
      <div className="absolute top-0 left-0 w-1.5 h-full" style={{ background: "linear-gradient(180deg, #1e3a5f, #2d6da8)" }} />
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg, #1e3a5f, #2d6da8, #60a5fa)" }} />
      <div className="relative z-10 flex flex-col h-full p-6 md:p-8">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-[#1e3a5f] text-white text-[10px] px-3 py-1">
              <Target className="w-3 h-3 mr-1 inline" />
              {course.level || "All Levels"}
            </Badge>
            <span className="text-[11px] font-medium text-[#1e3a5f]/60">{config.brandName}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1e3a5f] leading-tight mb-3">{config.headline || course.title}</h2>
          {config.subheadline && <p className="text-sm text-[#475569] mb-3 font-medium">{config.subheadline}</p>}
          <p className="text-xs text-[#64748b] leading-relaxed line-clamp-3 mb-4">
            {course.descriptionSnippet || "Professional training with real-world projects and mentorship."}
          </p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { icon: Users, label: "Expert Mentors" },
              { icon: Layers, label: `${course.level || "All"} Levels` },
              { icon: Clock, label: "Self-Paced" },
              { icon: Award, label: "Certificate" },
            ].map((feat, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px] text-[#475569]">
                <feat.icon className="w-3.5 h-3.5 text-[#2d6da8]" />
                <span>{feat.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {config.showPrice && (
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-[#1e3a5f]">{course.discountPrice || course.price?.toLocaleString()} RWF</span>
              {course.discountPrice && <span className="text-sm text-[#94a3b8] line-through">{course.price?.toLocaleString()} RWF</span>}
            </div>
          )}
          <button className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:shadow-lg" style={{ background: "linear-gradient(135deg, #1e3a5f, #2d6da8)" }}>
            {config.ctaText || "Start Learning →"}
          </button>
          <BrandFooter brandName={config.brandName + " Academy"} tagline="bootskills.com" light />
        </div>
      </div>
    </div>
  );
}

function ModernTemplate({ course, config }: { course: Course; config: TemplateConfig }) {
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ fontFamily: "'Outfit', sans-serif", background: "linear-gradient(135deg, #0f0a1a 0%, #1a1035 50%, #0f0a1a 100%)" }}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full opacity-30" style={{ background: "radial-gradient(circle, rgba(124, 58, 237, 0.4) 0%, transparent 70%)" }} />
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(rgba(167, 139, 250, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(167, 139, 250, 0.1) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
      <div className="relative z-10 flex flex-col h-full p-6 md:p-8 justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)" }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-semibold text-purple-300">{config.brandName}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white leading-tight mb-2">{config.headline || course.title}</h2>
          <p className="text-xs text-purple-200/60 line-clamp-2 mb-4">{course.descriptionSnippet || "Next-gen learning experience with AI-powered tools"}</p>
          <div className="flex gap-4 mb-4">
            {[
              { icon: Clock, label: "8 Weeks" },
              { icon: Users, label: "1.2k+ Students" },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px] text-purple-300/70">
                <stat.icon className="w-3 h-3" />
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
          {config.showPrice && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3" style={{ background: "rgba(124, 58, 237, 0.15)", border: "1px solid rgba(124, 58, 237, 0.3)" }}>
              <DollarSign className="w-3 h-3 text-purple-400" />
              <span className="text-sm font-bold text-white">{course.discountPrice || course.price?.toLocaleString()} RWF</span>
              {course.discountPrice && <span className="text-xs text-purple-400/60 line-through">{course.price?.toLocaleString()} RWF</span>}
            </div>
          )}
        </div>
        <button className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)", boxShadow: "0 4px 20px rgba(124, 58, 237, 0.4)" }}>
          {config.ctaText || "🚀 Get Started"}
        </button>
        <div className="text-center text-[10px] text-purple-400/40 mt-2">{config.brandName} Academy · bootskills.com</div>
      </div>
    </div>
  );
}

function MinimalTemplate({ course, config }: { course: Course; config: TemplateConfig }) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="flex flex-col h-full p-8 md:p-10">
        <div className="flex-1">
          {course.category && <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-4">{course.category}</div>}
          <h2 className="text-2xl md:text-3xl font-light text-neutral-900 leading-tight mb-3 tracking-tight">{config.headline || course.title}</h2>
          <div className="w-12 h-0.5 bg-neutral-200 mb-4" />
          <p className="text-xs text-neutral-500 leading-relaxed mb-6">{course.descriptionSnippet || "Clean. Simple. Effective."}</p>
          <div className="space-y-2">
            {[
              { label: "Level", value: course.level || "All Levels" },
              { label: "Duration", value: "Self-paced" },
            ].map((detail, i) => (
              <div key={i} className="flex items-center justify-between text-xs border-b border-neutral-100 pb-1.5">
                <span className="text-neutral-400">{detail.label}</span>
                <span className="text-neutral-700 font-medium">{detail.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3 pt-4 border-t border-neutral-100">
          {config.showPrice && (
            <div className="text-2xl font-light text-neutral-900">
              {course.discountPrice || course.price?.toLocaleString()} RWF
              {course.discountPrice && <span className="text-sm text-neutral-400 line-through ml-2">{course.price?.toLocaleString()} RWF</span>}
            </div>
          )}
          <button className="w-full py-3 rounded-lg text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 transition-colors">
            {config.ctaText || "Enroll Now"}
          </button>
          <div className="text-center text-[9px] text-neutral-300 tracking-wider uppercase">{config.brandName} Academy</div>
        </div>
      </div>
    </div>
  );
}

function CelebrationTemplate({ course, config }: { course: Course; config: TemplateConfig }) {
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ fontFamily: "'Outfit', sans-serif", background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #fef9c3 100%)" }}>
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="absolute w-2 h-2 rounded-full opacity-40" style={{
            backgroundColor: ["#059669", "#10b981", "#f59e0b", "#f97316", "#ef4444"][i % 5],
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: `${4 + Math.random() * 8}px`,
            height: `${4 + Math.random() * 8}px`,
          }} />
        ))}
      </div>
      <div className="relative z-10 flex flex-col h-full p-6 md:p-8 justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold mb-3">
            <Sparkles className="w-3 h-3" />
            Featured Course
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-emerald-900 leading-tight mb-2">{config.headline || course.title}</h2>
          {config.subheadline && <p className="text-sm text-emerald-700/80 font-medium mb-2">{config.subheadline}</p>}
          <p className="text-xs text-emerald-600/60 line-clamp-2 mb-4">{course.descriptionSnippet || "Transform your career with expert-led training"}</p>
          <div className="flex gap-4">
            <div className="text-center"><div className="text-lg font-black text-emerald-600">98%</div><div className="text-[9px] text-emerald-500/70">Success Rate</div></div>
            <div className="text-center"><div className="text-lg font-black text-amber-600">4.9★</div><div className="text-[9px] text-amber-500/70">Rating</div></div>
            <div className="text-center"><div className="text-lg font-black text-emerald-600">500+</div><div className="text-[9px] text-emerald-500/70">Students</div></div>
          </div>
        </div>
        <div className="space-y-3">
          {config.showPrice && (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700">{course.discountPrice || course.price?.toLocaleString()} RWF</span>
              {course.discountPrice && <span className="text-sm text-emerald-400 line-through">{course.price?.toLocaleString()} RWF</span>}
              {course.discountPrice && <Badge className="bg-amber-500 text-white text-[10px] ml-2">-{Math.round((1 - course.discountPrice / course.price) * 100)}%</Badge>}
            </div>
          )}
          <button className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:shadow-lg" style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}>
            {config.ctaText || "🎯 Claim Your Spot"}
          </button>
          <BrandFooter brandName={config.brandName + " Academy"} tagline="Limited seats available" light />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  INTERNSHIP TEMPLATES
// ═══════════════════════════════════════════════

function InternshipBaseContent({ config }: { config: TemplateConfig }) {
  const intern = config.internship!;
  return (
    <>
      {config.customImage && <CustomImageDisplay src={config.customImage} />}
      {/* Role */}
      <h2 className="text-xl md:text-2xl font-black text-white leading-tight mb-1">
        {config.headline || `We're Hiring: ${intern.role}`}
      </h2>
      {/* Company */}
      <div className="flex items-center gap-1.5 text-sm text-orange-300/90 mb-2">
        <Briefcase className="w-3.5 h-3.5" />
        <span>{intern.company || config.brandName}</span>
      </div>
      {config.subheadline && <p className="text-xs text-orange-200/70 mb-3">{config.subheadline}</p>}
      {/* Details */}
      <div className="flex flex-wrap gap-2 mb-3">
        {intern.location && (
          <Badge variant="outline" className="border-orange-500/30 text-orange-300 text-[9px]">
            <MapPin className="w-2.5 h-2.5 mr-1" />{intern.location}
          </Badge>
        )}
        {intern.duration && (
          <Badge variant="outline" className="border-orange-500/30 text-orange-300 text-[9px]">
            <Clock className="w-2.5 h-2.5 mr-1" />{intern.duration}
          </Badge>
        )}
        {intern.stipend && (
          <Badge variant="outline" className="border-orange-500/30 text-orange-300 text-[9px]">
            <DollarSign className="w-2.5 h-2.5 mr-1" />{intern.stipend}
          </Badge>
        )}
      </div>
      {/* Requirements */}
      {intern.requirements && (
        <p className="text-[10px] text-white/60 line-clamp-2 mb-3">{intern.requirements}</p>
      )}
      {/* Apply CTA */}
      <div className="mt-auto">
        <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #ff4500, #ff6b35)", boxShadow: "0 4px 20px rgba(255, 69, 0, 0.4)" }}>
          {config.ctaText || "📋 Apply Now"}
        </span>
      </div>
    </>
  );
}

function InternshipFlameTemplate({ config }: { config: TemplateConfig }) {
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #1a0a00 0%, #2d0f00 30%, #4a1c00 60%, #1a0a00 100%)" }} />
      <div className="absolute top-0 left-0 right-0 h-2" style={{ background: "linear-gradient(90deg, #ff4500, #ff6b35, #ffd700, #ff6b35, #ff4500)" }} />
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #ff4500 0%, transparent 70%)" }} />
      <div className="relative z-10 flex flex-col h-full p-6 md:p-8 justify-between">
        <div>
          <Badge variant="outline" className="border-orange-500/50 text-orange-400 bg-orange-950/30 text-[10px] px-3 py-1 mb-4 inline-flex">
            <Briefcase className="w-3 h-3 mr-1" />{config.brandName} · Internship
          </Badge>
          <InternshipBaseContent config={config} />
        </div>
        <BrandFooter brandName={config.brandName + " Academy"} tagline="Apply at bootskills.com" />
      </div>
    </div>
  );
}

function InternshipProfessionalTemplate({ config }: { config: TemplateConfig }) {
  const intern = config.internship!;
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ fontFamily: "'Outfit', sans-serif", background: "linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)" }}>
      <div className="absolute top-0 left-0 w-1.5 h-full" style={{ background: "linear-gradient(180deg, #1e3a5f, #2d6da8)" }} />
      <div className="relative z-10 flex flex-col h-full p-6 md:p-8">
        <div className="flex-1">
          {config.customImage && <CustomImageDisplay src={config.customImage} />}
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-[#1e3a5f] text-white text-[10px] px-3 py-1">
              <Briefcase className="w-3 h-3 mr-1" />Internship
            </Badge>
            <span className="text-[11px] font-medium text-[#1e3a5f]/60">{config.brandName}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-[#1e3a5f] leading-tight mb-1">
            {config.headline || `We're Hiring: ${intern.role}`}
          </h2>
          <div className="flex items-center gap-1.5 text-sm text-[#2d6da8] mb-2">
            <Briefcase className="w-3.5 h-3.5" />
            <span>{intern.company || config.brandName}</span>
          </div>
          {config.subheadline && <p className="text-xs text-[#475569] mb-3 font-medium">{config.subheadline}</p>}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {intern.location && (
              <div className="flex items-center gap-1.5 text-[11px] text-[#475569]">
                <MapPin className="w-3.5 h-3.5 text-[#2d6da8]" />
                <span>{intern.location}</span>
              </div>
            )}
            {intern.duration && (
              <div className="flex items-center gap-1.5 text-[11px] text-[#475569]">
                <Clock className="w-3.5 h-3.5 text-[#2d6da8]" />
                <span>{intern.duration}</span>
              </div>
            )}
            {intern.stipend && (
              <div className="flex items-center gap-1.5 text-[11px] text-[#475569]">
                <DollarSign className="w-3.5 h-3.5 text-[#2d6da8]" />
                <span>{intern.stipend}</span>
              </div>
            )}
          </div>
          {intern.requirements && <p className="text-[10px] text-[#64748b] line-clamp-2 mb-3">📋 {intern.requirements}</p>}
        </div>
        <button className="w-full py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #1e3a5f, #2d6da8)" }}>
          {config.ctaText || "📋 Apply Now →"}
        </button>
        <BrandFooter brandName={config.brandName + " Academy"} tagline="bootskills.com/careers" light />
      </div>
    </div>
  );
}

function InternshipModernTemplate({ config }: { config: TemplateConfig }) {
  const intern = config.internship!;
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ fontFamily: "'Outfit', sans-serif", background: "linear-gradient(135deg, #0f0a1a 0%, #1a1035 50%, #0f0a1a 100%)" }}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full opacity-30" style={{ background: "radial-gradient(circle, rgba(124, 58, 237, 0.4) 0%, transparent 70%)" }} />
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(rgba(167, 139, 250, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(167, 139, 250, 0.1) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
      <div className="relative z-10 flex flex-col h-full p-6 md:p-8 justify-between">
        <div>
          {config.customImage && <CustomImageDisplay src={config.customImage} />}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)" }}>
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-semibold text-purple-300">{config.brandName}</span>
          </div>
          <h2 className="text-lg md:text-xl font-extrabold text-white leading-tight mb-1">
            {config.headline || `Join ${intern.company || config.brandName} as ${intern.role}`}
          </h2>
          <p className="text-[11px] text-purple-200/60 mb-3">
            {intern.location && <><MapPin className="w-3 h-3 inline mr-1" />{intern.location} · </>}
            {intern.duration && <>{intern.duration}</>}
          </p>
          {intern.stipend && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3" style={{ background: "rgba(124, 58, 237, 0.15)", border: "1px solid rgba(124, 58, 237, 0.3)" }}>
              <DollarSign className="w-3 h-3 text-purple-400" />
              <span className="text-sm font-bold text-white">{intern.stipend}</span>
            </div>
          )}
          {intern.requirements && <p className="text-[10px] text-purple-200/50 line-clamp-2 mb-3">{intern.requirements}</p>}
        </div>
        <button className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-300 hover:scale-[1.02]" style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)", boxShadow: "0 4px 20px rgba(124, 58, 237, 0.4)" }}>
          {config.ctaText || "🚀 Apply Now"}
        </button>
        <div className="text-center text-[10px] text-purple-400/40 mt-2">{config.brandName} · bootskills.com/careers</div>
      </div>
    </div>
  );
}

function InternshipMinimalTemplate({ config }: { config: TemplateConfig }) {
  const intern = config.internship!;
  return (
    <div className="relative w-full h-full overflow-hidden bg-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="flex flex-col h-full p-8 md:p-10">
        <div className="flex-1">
          {config.customImage && <CustomImageDisplay src={config.customImage} />}
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-3">Opportunity</div>
          <h2 className="text-xl md:text-2xl font-light text-neutral-900 leading-tight mb-2 tracking-tight">
            {config.headline || intern.role}
          </h2>
          <div className="w-10 h-0.5 bg-neutral-200 mb-3" />
          {intern.company && <p className="text-xs text-neutral-500 mb-3">{intern.company}</p>}
          <div className="space-y-2 mb-4">
            {[
              { label: "Location", value: intern.location || "Rwanda" },
              { label: "Duration", value: intern.duration || "3 Months" },
              { label: "Stipend", value: intern.stipend || "Competitive" },
            ].map((detail, i) => (
              <div key={i} className="flex items-center justify-between text-xs border-b border-neutral-100 pb-1.5">
                <span className="text-neutral-400">{detail.label}</span>
                <span className="text-neutral-700 font-medium">{detail.value}</span>
              </div>
            ))}           </div>
          {intern.requirements && <p className="text-[10px] text-neutral-400 leading-relaxed mb-3">{intern.requirements}</p>}
        </div>
        <button className="w-full py-3 rounded-lg text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 transition-colors">
          {config.ctaText || "Submit Application"}
        </button>
        <div className="text-center text-[9px] text-neutral-300 tracking-wider uppercase mt-2">{config.brandName}</div>
      </div>
    </div>
  );
}

function InternshipCelebrationTemplate({ config }: { config: TemplateConfig }) {
  const intern = config.internship!;
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ fontFamily: "'Outfit', sans-serif", background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #fef9c3 100%)" }}>
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="absolute w-2 h-2 rounded-full opacity-40" style={{
            backgroundColor: ["#059669", "#10b981", "#f59e0b", "#f97316", "#ef4444"][i % 5],
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: `${4 + Math.random() * 8}px`,
            height: `${4 + Math.random() * 8}px`,
          }} />
        ))}
      </div>
      <div className="relative z-10 flex flex-col h-full p-6 md:p-8 justify-between">
        <div>
          {config.customImage && <CustomImageDisplay src={config.customImage} />}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold mb-3">
            <GraduationCap className="w-3 h-3" />
            Program
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-emerald-900 leading-tight mb-1">
            {config.headline || `Join Our Team: ${intern.role}`}
          </h2>
          {intern.company && <p className="text-xs text-emerald-600 font-medium mb-2">{intern.company}</p>}
          <div className="flex flex-wrap gap-2 mb-3">
            {intern.location && <span className="text-[10px] text-emerald-500/70"><MapPin className="w-3 h-3 inline mr-1" />{intern.location}</span>}
            {intern.duration && <span className="text-[10px] text-emerald-500/70"><Clock className="w-3 h-3 inline mr-1" />{intern.duration}</span>}
            {intern.stipend && <span className="text-[10px] text-emerald-500/70"><DollarSign className="w-3 h-3 inline mr-1" />{intern.stipend}</span>}
          </div>
          {intern.requirements && <p className="text-[10px] text-emerald-600/60 line-clamp-2 mb-3">{intern.requirements}</p>}
        </div>
        <div className="space-y-2">
          {config.subheadline && <p className="text-[10px] text-emerald-600/60">{config.subheadline}</p>}
          <button className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:shadow-lg" style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}>
            {config.ctaText || "🎯 Apply Today"}
          </button>
          <BrandFooter brandName={config.brandName} tagline="Start your career journey" light />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  GREETING / OCCASION TEMPLATES
// ═══════════════════════════════════════════════

function GreetingFlameTemplate({ config }: { config: TemplateConfig }) {
  const greet = config.greeting!;
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #1a0a00 0%, #2d0f00 30%, #4a1c00 60%, #1a0a00 100%)" }} />
      <div className="absolute top-0 left-0 right-0 h-2" style={{ background: "linear-gradient(90deg, #ff4500, #ff6b35, #ffd700, #ff6b35, #ff4500)" }} />
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #ff4500 0%, transparent 70%)" }} />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-15" style={{ background: "radial-gradient(circle, #ffd700 0%, transparent 70%)" }} />
      <div className="relative z-10 flex flex-col h-full p-6 md:p-8 justify-between items-center text-center">
        <div className="w-full">
          <Badge variant="outline" className="border-orange-500/50 text-orange-400 bg-orange-950/30 text-[10px] px-3 py-1 mb-4 inline-flex">
            <Heart className="w-3 h-3 mr-1" />{config.brandName}
          </Badge>
          {config.customImage && (
            <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-orange-500/30 mb-4">
              <img src={config.customImage} alt="Custom brand image" className="w-full h-full object-cover" />
            </div>
          )}
          <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2">
            {config.headline || greet.occasion}
          </h2>
          <p className="text-base text-orange-200/90 mb-2 italic">"{greet.message}"</p>
          {greet.recipientName && <p className="text-sm text-orange-300/70 mb-1">To: {greet.recipientName}</p>}
          {greet.senderName && <p className="text-xs text-white/40">— {greet.senderName}</p>}
        </div>
        <div className="text-5xl mb-2">🎉</div>
        <BrandFooter brandName={config.brandName + " Academy"} tagline="bootskills.com" />
      </div>
    </div>
  );
}

function GreetingProfessionalTemplate({ config }: { config: TemplateConfig }) {
  const greet = config.greeting!;
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ fontFamily: "'Outfit', sans-serif", background: "linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)" }}>
      <div className="absolute top-0 left-0 w-1.5 h-full" style={{ background: "linear-gradient(180deg, #1e3a5f, #2d6da8)" }} />
      <div className="relative z-10 flex flex-col h-full p-6 md:p-8 items-center text-center justify-between">
        <div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge className="bg-[#1e3a5f] text-white text-[10px] px-3 py-1">
              <Heart className="w-3 h-3 mr-1" />Greetings
            </Badge>
          </div>
          {config.customImage && (
            <div className="w-28 h-28 mx-auto rounded-full overflow-hidden border-4 border-[#1e3a5f]/20 mb-4 shadow-lg">
              <img src={config.customImage} alt="Custom brand image" className="w-full h-full object-cover" />
            </div>
          )}
          <h2 className="text-2xl md:text-3xl font-bold text-[#1e3a5f] leading-tight mb-3">
            {config.headline || greet.occasion}
          </h2>
          <div className="max-w-[80%] mx-auto">
            <p className="text-sm text-[#475569] italic mb-3">"{greet.message}"</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-[#64748b]">
            {greet.recipientName && <span>To: {greet.recipientName}</span>}
            {greet.recipientName && greet.senderName && <span>·</span>}
            {greet.senderName && <span>From: {greet.senderName}</span>}
          </div>
        </div>
        <div className="text-4xl mb-2">🎊</div>
        <BrandFooter brandName={config.brandName + " Academy"} tagline="bootskills.com" light />
      </div>
    </div>
  );
}

function GreetingModernTemplate({ config }: { config: TemplateConfig }) {
  const greet = config.greeting!;
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ fontFamily: "'Outfit', sans-serif", background: "linear-gradient(135deg, #0f0a1a 0%, #1a1035 50%, #0f0a1a 100%)" }}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full opacity-30" style={{ background: "radial-gradient(circle, rgba(124, 58, 237, 0.4) 0%, transparent 70%)" }} />
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(rgba(167, 139, 250, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(167, 139, 250, 0.1) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
      <div className="relative z-10 flex flex-col h-full p-6 md:p-8 items-center text-center justify-between">
        <div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)" }}>
              <Heart className="w-4 h-4 text-white" />
            </div>
          </div>
          {config.customImage && (
            <div className="w-32 h-32 mx-auto rounded-2xl overflow-hidden border-2 border-purple-500/30 mb-4 shadow-2xl">
              <img src={config.customImage} alt="Custom brand image" className="w-full h-full object-cover" />
            </div>
          )}
          <h2 className="text-xl md:text-2xl font-extrabold text-white leading-tight mb-3">
            {config.headline || greet.occasion}
          </h2>
          <div className="max-w-[85%] mx-auto bg-purple-900/30 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-sm text-purple-200/90 italic">"{greet.message}"</p>
          </div>
          {greet.senderName && <p className="text-xs text-purple-300/50 mt-2">— {greet.senderName}</p>}
        </div>
        <div className="text-4xl">✨</div>
        <div className="text-[10px] text-purple-400/40">{config.brandName} · bootskills.com</div>
      </div>
    </div>
  );
}

function GreetingMinimalTemplate({ config }: { config: TemplateConfig }) {
  const greet = config.greeting!;
  return (
    <div className="relative w-full h-full overflow-hidden bg-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="flex flex-col h-full p-8 md:p-10 items-center text-center justify-between">
        <div className="w-full">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-4">{config.brandName}</div>
          {config.customImage && (
            <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-neutral-200 mb-4">
              <img src={config.customImage} alt="Custom brand image" className="w-full h-full object-cover" />
            </div>
          )}
          <h2 className="text-2xl md:text-3xl font-light text-neutral-900 leading-tight mb-4 tracking-tight">
            {config.headline || greet.occasion}
          </h2>
          <div className="w-16 h-0.5 bg-neutral-200 mx-auto mb-4" />
          <div className="max-w-[80%] mx-auto">
            <p className="text-sm text-neutral-500 italic leading-relaxed">{greet.message}</p>
          </div>
          {greet.senderName && <p className="text-xs text-neutral-400 mt-3">— {greet.senderName}</p>}
        </div>
        <div className="text-3xl mb-2">🌸</div>
        <div className="text-[9px] text-neutral-300 tracking-wider uppercase">{config.brandName} Academy</div>
      </div>
    </div>
  );
}

function GreetingCelebrationTemplate({ config }: { config: TemplateConfig }) {
  const greet = config.greeting!;
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ fontFamily: "'Outfit', sans-serif", background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #fef9c3 100%)" }}>
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(25)].map((_, i) => (
          <div key={i} className="absolute w-2 h-2 rounded-full opacity-50" style={{
            backgroundColor: ["#059669", "#10b981", "#f59e0b", "#f97316", "#ef4444", "#8b5cf6"][i % 6],
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: `${5 + Math.random() * 10}px`,
            height: `${5 + Math.random() * 10}px`,
          }} />
        ))}
      </div>
      <div className="relative z-10 flex flex-col h-full p-6 md:p-8 items-center text-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold mb-4 shadow-sm">
            <PartyPopper className="w-3 h-3" />
            {greet.occasion}
          </div>
          {config.customImage && (
            <div className="w-36 h-36 mx-auto rounded-full overflow-hidden border-4 border-amber-200/60 mb-4 shadow-xl">
              <img src={config.customImage} alt="Custom brand image" className="w-full h-full object-cover" />
            </div>
          )}
          <h2 className="text-2xl md:text-3xl font-extrabold text-emerald-900 leading-tight mb-3">
            {config.headline || greet.occasion}
          </h2>
          <div className="max-w-[85%] mx-auto bg-white/50 rounded-2xl p-4 backdrop-blur-sm shadow-sm">
            <p className="text-sm text-emerald-800 font-medium italic">"{greet.message}"</p>
          </div>
          {greet.senderName && <p className="text-xs text-emerald-500/70 mt-3">With love, {greet.senderName}</p>}
          {greet.recipientName && <p className="text-[10px] text-emerald-400/50">Dedicated to {greet.recipientName}</p>}
        </div>
        <div className="text-5xl mb-1">🎉🎊</div>
        <BrandFooter brandName={config.brandName} tagline="bootskills.com" light />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════

export default function SocialPostGenerator() {
  const [postType, setPostType] = useState<PostType>("course");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [templateStyle, setTemplateStyle] = useState<TemplateStyle>("flame");
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [showPrice, setShowPrice] = useState(true);
  const [showRating, setShowRating] = useState(true);
  const [brandName, setBrandName] = useState("Bootskills");
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [customImage, setCustomImage] = useState<string | null>(null);

  // Image search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ url: string; alt: string; thumbnail: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Internship fields
  const [internshipRole, setInternshipRole] = useState("");
  const [internshipCompany, setInternshipCompany] = useState("");
  const [internshipLocation, setInternshipLocation] = useState("");
  const [internshipDuration, setInternshipDuration] = useState("");
  const [internshipStipend, setInternshipStipend] = useState("");
  const [internshipRequirements, setInternshipRequirements] = useState("");
  const [internshipApplyLink, setInternshipApplyLink] = useState("");
  const [internshipDeadline, setInternshipDeadline] = useState("");

  // Greeting fields
  const [greetingOccasion, setGreetingOccasion] = useState("Happy Workers Day");
  const [greetingMessage, setGreetingMessage] = useState("");
  const [greetingSenderName, setGreetingSenderName] = useState("");
  const [greetingRecipientName, setGreetingRecipientName] = useState("");
  const [greetingDate, setGreetingDate] = useState("");

  const templateRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: coursesData, loading: coursesLoading } = useQuery<{ courses: { items: Course[] } }>(GET_COURSES, {
    variables: { page: 1, limit: 100 },
  });

  const courses: Course[] = coursesData?.courses?.items || [];
  const selectedCourse = courses.find((c: Course) => c.id === selectedCourseId);

  // Build internship data
  const internshipData: InternshipData = {
    role: internshipRole,
    company: internshipCompany || brandName,
    location: internshipLocation,
    duration: internshipDuration,
    stipend: internshipStipend,
    requirements: internshipRequirements,
    applyLink: internshipApplyLink,
    deadline: internshipDeadline,
  };

  // Build greeting data
  const greetingData: GreetingData = {
    occasion: greetingOccasion,
    message: greetingMessage || `Wishing you a wonderful ${greetingOccasion}!`,
    senderName: greetingSenderName || brandName + " Academy",
    recipientName: greetingRecipientName,
    occasionDate: greetingDate,
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setCustomImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setCustomImage(null);
    setSearchResults([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Image search using Pexels API (CORS-friendly, primary) + Freepik (fallback)
  const searchImages = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      // Primary: Pexels API (supports CORS from browser)
      const pexelRes = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=12`,
        {
          headers: {
            "Authorization": env.PEXELS_API_KEY,
          },
        }
      );
      if (pexelRes.ok) {
        const pexelData = await pexelRes.json();
        const pexelResults = (pexelData.photos || []).map((photo: any) => ({
          url: photo.src?.large || photo.src?.original,
          alt: photo.alt || "Stock image",
          thumbnail: photo.src?.tiny || photo.src?.small || "",
        })).filter((r: any) => r.url);
        if (pexelResults.length > 0) {
          setSearchResults(pexelResults);
          setIsSearching(false);
          return;
        }
      }
    } catch (pexelErr) {
      console.error("Pexels search failed:", pexelErr);
    }

    // Fallback: try Freepik/Magnific API (may not support CORS)
    try {
      const freepikRes = await fetch(
        `https://api.freepik.com/v1/resources?term=${encodeURIComponent(searchQuery)}&limit=12`,
        {
          headers: {
            "x-magnific-api-key": env.FREEPIK_API_KEY,
            "Accept": "application/json",
          },
        }
      );
      if (freepikRes.ok) {
        const freepikData = await freepikRes.json();
        const freepikResults = (freepikData.data || []).map((item: any) => ({
          url: item.image?.url || item.preview?.url || "",
          alt: item.title || "Stock image",
          thumbnail: item.image?.thumbnail?.url || item.thumbnail?.url || item.image?.url || "",
        })).filter((r: any) => r.url);
        if (freepikResults.length > 0) {
          setSearchResults(freepikResults);
        }
      }
    } catch (freepikErr) {
      console.error("Freepik search also failed:", freepikErr);
    }
    setIsSearching(false);
  }, [searchQuery]);

  const selectSearchResult = (img: { url: string; alt: string }) => {
    // Fetch and convert to data URL for use in html-to-image export
    fetch(img.url)
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onload = (ev) => setCustomImage(ev.target?.result as string);
        reader.readAsDataURL(blob);
      })
      .catch(() => {
        // Direct URL fallback (works for CORS-enabled images)
        setCustomImage(img.url);
      });
    setShowSearch(false);
    setSearchResults([]);
  };

  // Reset aspect ratio when platform changes
  const handlePlatformChange = (val: Platform) => {
    setPlatform(val);
    const plat = PLATFORMS.find(p => p.value === val);
    if (plat) setAspectRatio(plat.defaultRatio);
  };

  // Get template config
  const config: TemplateConfig = {
    style: templateStyle,
    platform,
    aspectRatio,
    headline,
    subheadline,
    ctaText,
    showPrice,
    showRating,
    accentColor: TEMPLATE_STYLES.find(s => s.value === templateStyle)?.colors[0] || "#ff4500",
    brandName,
    customImage,
    postType,
    internship: postType === "internship" ? internshipData : undefined,
    greeting: postType === "greeting" ? greetingData : undefined,
  };

  // Render selected template based on post type and style
  const renderTemplate = useCallback(() => {
    if (postType === "course" && !selectedCourse) return null;
    
    switch (postType) {
      case "course": {
        const props = { course: selectedCourse!, config };
        switch (templateStyle) {
          case "flame": return <FlameTemplate {...props} />;
          case "professional": return <ProfessionalTemplate {...props} />;
          case "modern": return <ModernTemplate {...props} />;
          case "minimal": return <MinimalTemplate {...props} />;
          case "celebration": return <CelebrationTemplate {...props} />;
          default: return <FlameTemplate {...props} />;
        }
      }
      case "internship": {
        switch (templateStyle) {
          case "flame": return <InternshipFlameTemplate config={config} />;
          case "professional": return <InternshipProfessionalTemplate config={config} />;
          case "modern": return <InternshipModernTemplate config={config} />;
          case "minimal": return <InternshipMinimalTemplate config={config} />;
          case "celebration": return <InternshipCelebrationTemplate config={config} />;
          default: return <InternshipFlameTemplate config={config} />;
        }
      }
      case "greeting": {
        switch (templateStyle) {
          case "flame": return <GreetingFlameTemplate config={config} />;
          case "professional": return <GreetingProfessionalTemplate config={config} />;
          case "modern": return <GreetingModernTemplate config={config} />;
          case "minimal": return <GreetingMinimalTemplate config={config} />;
          case "celebration": return <GreetingCelebrationTemplate config={config} />;
          default: return <GreetingFlameTemplate config={config} />;
        }
      }
      default: return null;
    }
  }, [postType, selectedCourse, templateStyle, config]);

  const getExportFilename = useCallback(() => {
    const base = postType === "course" 
      ? (selectedCourse?.title || "post").replace(/\s+/g, "-").toLowerCase()
      : postType === "internship"
        ? `internship-${(internshipRole || "opportunity").replace(/\s+/g, "-").toLowerCase()}`
        : `greeting-${(greetingOccasion || "occasion").replace(/\s+/g, "-").toLowerCase()}`;
    return `${base}-${templateStyle}-${aspectRatio.replace(":", "x")}`;
  }, [postType, selectedCourse, internshipRole, greetingOccasion, templateStyle, aspectRatio]);

  // Export as PNG
  const exportAsPng = useCallback(async () => {
    if (!templateRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(templateRef.current, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `${getExportFilename()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    }
    setIsExporting(false);
  }, [getExportFilename, templateRef]);

  // Export as JPEG
  const exportAsJpeg = useCallback(async () => {
    if (!templateRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toJpeg(templateRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `${getExportFilename()}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    }
    setIsExporting(false);
  }, [getExportFilename, templateRef]);

  // Copy template caption
  const generateCaption = () => {
    if (postType === "course") {
      const course = selectedCourse;
      if (!course) return "";
      const hashtags = [
        "#Bootskills", "#OnlineLearning", "#SkillsDevelopment",
        course.category ? `#${course.category.replace(/\s+/g, "")}` : "",
        "#TechTraining", "#AfricanTech", "#KigaliTech", "#NeverStopLearning"
      ].filter(Boolean).join(" ");
      return `🚀 **${config.headline || course.title}**\n\n${config.subheadline || `Master ${course.title} with hands-on projects and expert mentorship. ${course.level || "All levels"} welcome!`}\n\n✅ Expert-led training\n✅ Real-world projects\n✅ Career mentorship\n✅ Certificate of completion\n\n${config.showPrice ? `💰 Only ${course.discountPrice || course.price?.toLocaleString()} RWF` : ""}\n\n${config.ctaText || "Enroll now"} at bootskills.com\n\n${hashtags}`;
    }

    if (postType === "internship") {
      const hashtags = ["#Bootskills", "#Internship", "#Hiring", "#JobsInRwanda", "#KigaliJobs", "#TechCareers", "#AfricanTech", `${brandName.replace(/\s+/g, "")}`].filter(Boolean).join(" ");
      return `📋 **INTERNSHIP OPPORTUNITY**\n\n${config.headline || `We're Hiring: ${internshipRole}`}\n\n🏢 ${internshipCompany || brandName}\n📍 ${internshipLocation || "Rwanda"}\n⏱ ${internshipDuration || "Flexible"}\n💰 ${internshipStipend || "Competitive stipend"}\n\n📝 Requirements:\n${internshipRequirements || "Open to motivated candidates"}\n\n${internshipApplyLink ? `🔗 Apply here: ${internshipApplyLink}` : `🌐 Apply at bootskills.com/careers`}\n${internshipDeadline ? `\n⏰ Deadline: ${internshipDeadline}` : ""}\n\n${config.ctaText || "Apply now"} at Bootskills Academy!\n\n${hashtags}`;
    }

    if (postType === "greeting") {
      const hashtags = [`#${greetingOccasion.replace(/\s+/g, "")}`, "#Bootskills", "#Greetings", "#Rwanda", "#Kigali"].filter(Boolean).join(" ");
      return `🎉 **${greetingOccasion}**\n\n"${greetingMessage}"\n\n${greetingRecipientName ? `To: ${greetingRecipientName}\n` : ""}${greetingSenderName ? `— ${greetingSenderName}\n\n` : "\n"}Wishing you joy, success, and happiness!\n\n${brandName} Academy · bootskills.com\n\n${hashtags}`;
    }

    return "";
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(generateCaption());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Reset form
  const handleReset = () => {
    setHeadline("");
    setSubheadline("");
    setCtaText("");
    setShowPrice(true);
    setShowRating(true);
    setCustomImage(null);
    setSearchResults([]);
    setShowSearch(false);
    setInternshipRole("");
    setInternshipCompany("");
    setInternshipLocation("");
    setInternshipDuration("");
    setInternshipStipend("");
    setInternshipRequirements("");
    setInternshipApplyLink("");
    setInternshipDeadline("");
    setGreetingOccasion("Happy Workers Day");
    setGreetingMessage("");
    setGreetingSenderName("");
    setGreetingRecipientName("");
    setGreetingDate("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const hasContent = postType === "course" ? !!selectedCourse : true;

  return (
    <PortalLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Camera className="w-6 h-6 text-primary" />
            Social Post Generator
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create stunning posts for courses, internships, and special occasions
          </p>
        </div>
        <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
          <Sparkles className="w-3 h-3 mr-1" />
          Marketing Tool
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Controls */}
        <div className="lg:col-span-1 space-y-4">
          {/* Post Type */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layout className="w-4 h-4" />
                Post Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "course" as PostType, label: "Course", icon: BookOpen },
                  { value: "internship" as PostType, label: "Program", icon: Briefcase },
                  { value: "greeting" as PostType, label: "Greeting", icon: Heart },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setPostType(value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-medium transition-all ${
                      postType === value
                        ? "ring-2 ring-primary bg-primary/5 shadow-sm text-primary"
                        : "hover:bg-muted border border-border/50 text-muted-foreground"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                    {postType === value && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Course Selection (only for course type) */}
          {postType === "course" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Select Course
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a course..." />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[200px]">
                      {coursesLoading ? (
                        <div className="p-4 text-sm text-muted-foreground">Loading courses...</div>
                      ) : courses.length === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground">No courses found</div>
                      ) : (
                        courses.map((course: Course) => (
                          <SelectItem key={course.id} value={course.id}>
                            <div className="flex items-center gap-2">
                              <span className="truncate max-w-[200px]">{course.title}</span>
                              <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                                {course.level || "All"}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </ScrollArea>
                  </SelectContent>
                </Select>

                {selectedCourse && (
                  <div className="mt-3 p-3 rounded-lg bg-muted/50 space-y-1">
                    <p className="text-xs font-medium">{selectedCourse.title}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{selectedCourse.descriptionSnippet}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{selectedCourse.category}</span>
                      <span>·</span>
                      <span>{selectedCourse.level}</span>
                      {selectedCourse.discountPrice && (
                        <><span>·</span><span className="text-primary font-medium">{selectedCourse.discountPrice?.toLocaleString()} RWF</span></>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Internship Fields */}
          {postType === "internship" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Opportunity Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Role / Position</Label>
                  <Input value={internshipRole} onChange={(e) => setInternshipRole(e.target.value)} placeholder="e.g. Software Developer Intern" className="mt-1 h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Company Name</Label>
                  <Input value={internshipCompany} onChange={(e) => setInternshipCompany(e.target.value)} placeholder="Bootskills" className="mt-1 h-9 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Location</Label>
                    <Input value={internshipLocation} onChange={(e) => setInternshipLocation(e.target.value)} placeholder="Kigali, Rwanda" className="mt-1 h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Duration</Label>
                    <Input value={internshipDuration} onChange={(e) => setInternshipDuration(e.target.value)} placeholder="e.g. 3 Months" className="mt-1 h-9 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Stipend</Label>
                    <Input value={internshipStipend} onChange={(e) => setInternshipStipend(e.target.value)} placeholder="e.g. Competitive" className="mt-1 h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Deadline</Label>
                    <Input value={internshipDeadline} onChange={(e) => setInternshipDeadline(e.target.value)} placeholder="e.g. July 30, 2026" className="mt-1 h-9 text-sm" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Requirements</Label>
                  <Textarea value={internshipRequirements} onChange={(e) => setInternshipRequirements(e.target.value)} placeholder="Key requirements for candidates..." className="mt-1 text-sm min-h-[60px]" />
                </div>
                <div>
                  <Label className="text-xs">Apply Link</Label>
                  <Input value={internshipApplyLink} onChange={(e) => setInternshipApplyLink(e.target.value)} placeholder="https://bootskills.com/careers" className="mt-1 h-9 text-sm" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Greeting Fields */}
          {postType === "greeting" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  Greeting Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Occasion</Label>
                  <Select value={greetingOccasion} onValueChange={setGreetingOccasion}>
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-[200px]">
                        {GREETING_OCCASIONS.map((occ) => (
                          <SelectItem key={occ} value={occ}>{occ}</SelectItem>
                        ))}
                        <SelectItem value="custom">Custom...</SelectItem>
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                  {greetingOccasion === "custom" && (
                    <Input value={greetingOccasion} onChange={(e) => setGreetingOccasion(e.target.value)} placeholder="Type your occasion..." className="mt-2 h-9 text-sm" />
                  )}
                </div>
                <div>
                  <Label className="text-xs">Personal Message</Label>
                  <Textarea value={greetingMessage} onChange={(e) => setGreetingMessage(e.target.value)} placeholder="Write your heartfelt message..." className="mt-1 text-sm min-h-[70px]" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">From (Sender)</Label>
                    <Input value={greetingSenderName} onChange={(e) => setGreetingSenderName(e.target.value)} placeholder={brandName + " Academy"} className="mt-1 h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">To (Recipient)</Label>
                    <Input value={greetingRecipientName} onChange={(e) => setGreetingRecipientName(e.target.value)} placeholder="Optional" className="mt-1 h-9 text-sm" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Date (optional)</Label>
                  <Input value={greetingDate} onChange={(e) => setGreetingDate(e.target.value)} placeholder="e.g. May 1, 2026" className="mt-1 h-9 text-sm" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Image Upload & Search */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Image
                </CardTitle>
              </div>
              {!customImage && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px]"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    Upload
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px]"
                    onClick={() => setShowSearch(!showSearch)}
                  >
                    <Search className="w-3 h-3 mr-1" />
                    Search
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {customImage ? (
                  <div className="relative rounded-lg overflow-hidden border border-border/50">
                    <img src={customImage} alt="Preview" className="w-full h-32 object-cover" />
                    <Button variant="destructive" size="sm" onClick={clearImage} className="absolute top-1 right-1 h-6 text-[10px]">
                      Remove
                    </Button>
                  </div>
                ) : showSearch ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search images... e.g. office, team, coding"
                        className="h-9 text-sm flex-1"
                        onKeyDown={(e) => e.key === "Enter" && searchImages()}
                      />
                      <Button size="sm" className="h-9" onClick={searchImages} disabled={isSearching || !searchQuery.trim()}>
                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      </Button>
                    </div>

                    {isSearching && (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    )}

                    {searchResults.length > 0 && !isSearching && (
                      <>
                        <div className="grid grid-cols-3 gap-2">
                          {searchResults.map((img, idx) => (
                            <button
                              key={idx}
                              onClick={() => selectSearchResult(img)}
                              className="relative group rounded-lg overflow-hidden border border-border/50 aspect-square hover:ring-2 hover:ring-primary transition-all"
                            >
                              <img
                                src={img.thumbnail || img.url}
                                alt={img.alt}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <ImagePlus className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </button>
                          ))}
                        </div>
                        <p className="text-[9px] text-muted-foreground text-center">
                          Images via Freepik · Click to select
                        </p>
                      </>
                    )}

                    {!isSearching && searchResults.length === 0 && searchQuery && (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No images found. Try a different search term.
                      </p>
                    )}

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-border/50 hover:border-primary/50 cursor-pointer transition-colors bg-muted/20"
                    >
                      <Upload className="w-4 h-4 text-muted-foreground/50" />
                      <span className="text-[10px] text-muted-foreground">Or upload your own image</span>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-2 p-6 rounded-lg border-2 border-dashed border-border/50 hover:border-primary/50 cursor-pointer transition-colors bg-muted/20"
                  >
                    <Upload className="w-8 h-8 text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground text-center">
                      Upload your own image<br />
                      <span className="text-[10px]">or click Search to find images online</span>
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          {/* Template Style */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Template Style
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATE_STYLES.map((style) => {
                  const Icon = style.icon;
                  const isActive = templateStyle === style.value;
                  return (
                    <button
                      key={style.value}
                      onClick={() => setTemplateStyle(style.value)}
                      className={`relative flex items-center gap-2 p-3 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? "ring-2 ring-primary bg-primary/5 shadow-sm"
                          : "hover:bg-muted border border-border/50"
                      }`}
                    >
                      <div className="flex gap-1">
                        {style.colors.slice(0, 3).map((color, i) => (
                          <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                      <Icon className={`w-3.5 h-3.5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                      <span>{style.label}</span>
                      {isActive && <Check className="w-3 h-3 text-primary absolute top-1 right-1" />}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Platform & Format */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                Platform & Format
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Platform</Label>
                <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                  {PLATFORMS.map((p) => {
                    const Icon = p.icon;
                    const isActive = platform === p.value;
                    return (
                      <button
                        key={p.value}
                        onClick={() => handlePlatformChange(p.value)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-medium transition-all ${
                          isActive
                            ? "ring-2 ring-primary bg-primary/5 text-primary"
                            : "hover:bg-muted text-muted-foreground border border-border/50"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label className="text-xs">Aspect Ratio</Label>
                <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                  {PLATFORMS.find(p => p.value === platform)?.ratios.map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`flex items-center justify-center gap-1.5 p-2 rounded-lg text-[10px] font-medium transition-all ${
                        aspectRatio === ratio
                          ? "ring-2 ring-primary bg-primary/5"
                          : "hover:bg-muted border border-border/50"
                      }`}
                    >
                      <Image className="w-3 h-3" />
                      <span>{ratio}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Customization */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Type className="w-4 h-4" />
                Customize Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Headline (optional)</Label>
                <Input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder={postType === "course" ? "Custom headline or course title" : postType === "internship" ? "e.g. Join Our Team!" : "e.g. Happy Workers Day!"}
                  className="mt-1 h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Subheadline (optional)</Label>
                <Input
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                  placeholder={postType === "course" ? "Short supporting text" : postType === "internship" ? "Tagline for the opportunity" : "Short greeting tagline"}
                  className="mt-1 h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Call to Action</Label>
                <Input
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder={postType === "course" ? "e.g. Enroll Now" : postType === "internship" ? "e.g. Apply Now" : "e.g. Share the joy"}
                  className="mt-1 h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Brand Name</Label>
                <Input
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="mt-1 h-9 text-sm"
                />
              </div>
              {postType === "course" && (
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} className="rounded" />
                    <span className="text-xs">Show Price</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={showRating} onChange={(e) => setShowRating(e.target.checked)} className="rounded" />
                    <span className="text-xs">Show Rating</span>
                  </label>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={handleReset} className="w-full text-xs">
                <RefreshCw className="w-3 h-3 mr-1" />
                Reset All Fields
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: Preview + Actions */}
        <div className="lg:col-span-2 space-y-4">
          {/* Preview */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Preview
                </CardTitle>
                <CardDescription className="text-[10px]">
                  {postType === "course" 
                    ? (selectedCourse ? `${templateStyle} · ${aspectRatio}` : "Select a course to begin")
                    : postType === "internship"
                      ? `Internship · ${templateStyle} · ${aspectRatio}`
                      : `Greeting · ${templateStyle} · ${aspectRatio}`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] text-muted-foreground w-8 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center bg-muted/30 rounded-xl p-4 md:p-8 min-h-[400px] items-center">
                <AnimatePresence mode="wait">
                  {hasContent ? (
                    <motion.div
                      key={`${postType}-${selectedCourse?.id || "generic"}-${templateStyle}-${aspectRatio}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className={`${ASPECT_CLASSES[aspectRatio]} w-full rounded-xl overflow-hidden shadow-2xl`}
                      style={{ transform: `scale(${zoom})` }}
                      ref={templateRef}
                    >
                      {renderTemplate()}
                    </motion.div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Camera className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Select a course, fill internship details, or write a greeting</p>
                      <p className="text-xs mt-1">Choose from 5 template styles and export for any platform</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {hasContent && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download Image
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button onClick={exportAsPng} disabled={isExporting} className="flex-1" size="sm">
                    {isExporting ? "Exporting..." : "PNG (High Quality)"}
                  </Button>
                  <Button onClick={exportAsJpeg} disabled={isExporting} variant="outline" size="sm" className="flex-1">
                    JPEG
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Caption & Hashtags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <pre className="text-[10px] leading-relaxed text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded-lg p-3 max-h-[120px] overflow-y-auto">
                      {generateCaption()}
                    </pre>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-1 right-1 h-7 text-[10px]"
                      onClick={handleCopyCaption}
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tips */}
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold mb-1">Pro Tips</p>
                  <ul className="text-[10px] text-muted-foreground space-y-1">
                    <li>• Use eye-catching headlines — keep them under 8 words for maximum impact</li>
                    <li>• Instagram: 1:1 square works best for feed, 9:16 for Stories</li>
                    <li>• WhatsApp: 9:16 vertical format for status updates</li>
                    <li>• Include a clear Call-to-Action (CTA) — tell viewers what to do next</li>
                    <li>• Upload a logo or image to personalize your post</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </PortalLayout>
  );
}

// ─── Social Platform SVG Icons ───

function Facebook({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function Twitter({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  );
}

function Linkedin({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}
