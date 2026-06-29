/**
 * SocialPostGenerator - Marketing Template System
 * 
 * Super Admin/Admin can select courses and generate stunning social media posts
 * for Instagram, WhatsApp, and other platforms.
 */

import { useState, useRef, useCallback } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_COURSES } from "@/lib/graphql/queries";
import { toPng, toJpeg } from "html-to-image";
import { motion, AnimatePresence } from "framer-motion";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";

// ─── Types ───

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

// ─── Template Visual Renderer ───

function FlameTemplate({ course, config }: { course: Course; config: TemplateConfig }) {
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Fiery gradient background */}
      <div className="absolute inset-0" style={{
        background: "linear-gradient(135deg, #1a0a00 0%, #2d0f00 30%, #4a1c00 60%, #1a0a00 100%)"
      }} />
      
      {/* Flame accents */}
      <div className="absolute top-0 left-0 right-0 h-2" style={{
        background: "linear-gradient(90deg, #ff4500, #ff6b35, #ffd700, #ff6b35, #ff4500)"
      }} />
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20" style={{
        background: "radial-gradient(circle, #ff4500 0%, transparent 70%)"
      }} />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-15" style={{
        background: "radial-gradient(circle, #ffd700 0%, transparent 70%)"
      }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-6 md:p-8 justify-between">
        <div>
          {/* Brand + Category */}
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

          {/* Headline */}
          <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2">
            {config.headline || course.title}
          </h2>

          {/* Subheadline */}
          {config.subheadline && (
            <p className="text-sm text-orange-200/80 mb-3">{config.subheadline}</p>
          )}

          {/* Description */}
          <p className="text-xs text-white/60 line-clamp-2 mb-4">
            {course.descriptionSnippet || course.description?.substring(0, 120) || "Master in-demand skills with hands-on projects"}
          </p>
        </div>

        {/* CTA + Price */}
        <div className="space-y-3">
          {config.showPrice && (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-transparent bg-clip-text" style={{
                backgroundImage: "linear-gradient(135deg, #ffd700, #ff6b35)"
              }}>
                {course.discountPrice || course.price?.toLocaleString()} RWF
              </span>
              {course.discountPrice && (
                <span className="text-sm text-white/40 line-through">{course.price?.toLocaleString()} RWF</span>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold text-white" style={{
              background: "linear-gradient(135deg, #ff4500, #ff6b35)",
              boxShadow: "0 4px 20px rgba(255, 69, 0, 0.4)"
            }}>
              {config.ctaText || "🔥 Enroll Now"}
            </span>
            {config.showRating && (
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-xs text-white/70">4.9</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-[10px] text-white/30 pt-2 border-t border-white/10">
            <span>Bootskills Academy</span>
            <span>Learn. Build. Grow.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfessionalTemplate({ course, config }: { course: Course; config: TemplateConfig }) {
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ fontFamily: "'Outfit', sans-serif", background: "linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)" }}>
      {/* Blue accent bar */}
      <div className="absolute top-0 left-0 w-1.5 h-full" style={{ background: "linear-gradient(180deg, #1e3a5f, #2d6da8)" }} />
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg, #1e3a5f, #2d6da8, #60a5fa)" }} />

      <div className="relative z-10 flex flex-col h-full p-6 md:p-8">
        <div className="flex-1">
          {/* Course level badge */}
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-[#1e3a5f] text-white text-[10px] px-3 py-1">
              <Target className="w-3 h-3 mr-1 inline" />
              {course.level || "All Levels"}
            </Badge>
            <span className="text-[11px] font-medium text-[#1e3a5f]/60">{config.brandName}</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-[#1e3a5f] leading-tight mb-3">
            {config.headline || course.title}
          </h2>

          {config.subheadline && (
            <p className="text-sm text-[#475569] mb-3 font-medium">{config.subheadline}</p>
          )}

          <p className="text-xs text-[#64748b] leading-relaxed line-clamp-3 mb-4">
            {course.descriptionSnippet || "Professional training with real-world projects and mentorship."}
          </p>

          {/* Features list */}
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

        {/* CTA */}
        <div className="space-y-3">
          {config.showPrice && (
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-[#1e3a5f]">
                {course.discountPrice || course.price?.toLocaleString()} RWF
              </span>
              {course.discountPrice && (
                <span className="text-sm text-[#94a3b8] line-through">{course.price?.toLocaleString()} RWF</span>
              )}
            </div>
          )}

          <button className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:shadow-lg" style={{
            background: "linear-gradient(135deg, #1e3a5f, #2d6da8)"
          }}>
            {config.ctaText || "Start Learning →"}
          </button>

          <div className="flex items-center justify-between text-[10px] text-[#94a3b8]">
            <span>Bootskills Academy</span>
            <span>bootskills.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModernTemplate({ course, config }: { course: Course; config: TemplateConfig }) {
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ fontFamily: "'Outfit', sans-serif", background: "linear-gradient(135deg, #0f0a1a 0%, #1a1035 50%, #0f0a1a 100%)" }}>
      {/* Purple glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full opacity-30" style={{
        background: "radial-gradient(circle, rgba(124, 58, 237, 0.4) 0%, transparent 70%)"
      }} />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: "linear-gradient(rgba(167, 139, 250, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(167, 139, 250, 0.1) 1px, transparent 1px)",
        backgroundSize: "30px 30px"
      }} />

      <div className="relative z-10 flex flex-col h-full p-6 md:p-8 justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)" }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-semibold text-purple-300">{config.brandName}</span>
          </div>

          <h2 className="text-xl md:text-2xl font-extrabold text-white leading-tight mb-2">
            {config.headline || course.title}
          </h2>

          <p className="text-xs text-purple-200/60 line-clamp-2 mb-4">
            {course.descriptionSnippet || "Next-gen learning experience with AI-powered tools"}
          </p>

          {/* Course stats */}
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
              <span className="text-sm font-bold text-white">
                {course.discountPrice || course.price?.toLocaleString()} RWF
              </span>
              {course.discountPrice && (
                <span className="text-xs text-purple-400/60 line-through">{course.price?.toLocaleString()} RWF</span>
              )}
            </div>
          )}
        </div>

        {/* CTA */}
        <button className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={{
          background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
          boxShadow: "0 4px 20px rgba(124, 58, 237, 0.4)"
        }}>
          {config.ctaText || "🚀 Get Started"}
        </button>

        <div className="text-center text-[10px] text-purple-400/40 mt-2">
          Bootskills Academy · bootskills.com
        </div>
      </div>
    </div>
  );
}

function MinimalTemplate({ course, config }: { course: Course; config: TemplateConfig }) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="flex flex-col h-full p-8 md:p-10">
        <div className="flex-1">
          {/* Clean category tag */}
          {course.category && (
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-4">
              {course.category}
            </div>
          )}

          <h2 className="text-2xl md:text-3xl font-light text-neutral-900 leading-tight mb-3 tracking-tight">
            {config.headline || course.title}
          </h2>

          <div className="w-12 h-0.5 bg-neutral-200 mb-4" />

          <p className="text-xs text-neutral-500 leading-relaxed mb-6">
            {course.descriptionSnippet || "Clean. Simple. Effective."}
          </p>

          {/* Minimal details */}
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

        {/* CTA */}
        <div className="space-y-3 pt-4 border-t border-neutral-100">
          {config.showPrice && (
            <div className="text-2xl font-light text-neutral-900">
              {course.discountPrice || course.price?.toLocaleString()} RWF
              {course.discountPrice && (
                <span className="text-sm text-neutral-400 line-through ml-2">{course.price?.toLocaleString()} RWF</span>
              )}
            </div>
          )}

          <button className="w-full py-3 rounded-lg text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 transition-colors">
            {config.ctaText || "Enroll Now"}
          </button>

          <div className="text-center text-[9px] text-neutral-300 tracking-wider uppercase">
            Bootskills Academy
          </div>
        </div>
      </div>
    </div>
  );
}

function CelebrationTemplate({ course, config }: { course: Course; config: TemplateConfig }) {
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ fontFamily: "'Outfit', sans-serif", background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #fef9c3 100%)" }}>
      {/* Celebration confetti dots */}
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
          {/* Success badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold mb-3">
            <Sparkles className="w-3 h-3" />
            Featured Course
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-emerald-900 leading-tight mb-2">
            {config.headline || course.title}
          </h2>

          {config.subheadline && (
            <p className="text-sm text-emerald-700/80 font-medium mb-2">{config.subheadline}</p>
          )}

          <p className="text-xs text-emerald-600/60 line-clamp-2 mb-4">
            {course.descriptionSnippet || "Transform your career with expert-led training"}
          </p>

          {/* Stats */}
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-lg font-black text-emerald-600">98%</div>
              <div className="text-[9px] text-emerald-500/70">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-black text-amber-600">4.9★</div>
              <div className="text-[9px] text-amber-500/70">Rating</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-black text-emerald-600">500+</div>
              <div className="text-[9px] text-emerald-500/70">Students</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-3">
          {config.showPrice && (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700">
                {course.discountPrice || course.price?.toLocaleString()} RWF
              </span>
              {course.discountPrice && (
                <span className="text-sm text-emerald-400 line-through">{course.price?.toLocaleString()} RWF</span>
              )}
              {course.discountPrice && (
                <Badge className="bg-amber-500 text-white text-[10px] ml-2">
                  -{Math.round((1 - course.discountPrice / course.price) * 100)}%
                </Badge>
              )}
            </div>
          )}

          <button className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:shadow-lg" style={{
            background: "linear-gradient(135deg, #059669, #10b981)",
          }}>
            {config.ctaText || "🎯 Claim Your Spot"}
          </button>

          <div className="flex items-center justify-between text-[10px] text-emerald-500/50">
            <span>Bootskills Academy</span>
            <span>Limited seats available</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page Component ───

export default function SocialPostGenerator() {
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

  const templateRef = useRef<HTMLDivElement>(null);

  const { data: coursesData, loading: coursesLoading } = useQuery(GET_COURSES, {
    variables: { page: 1, limit: 100 },
  });

  const courses: Course[] = coursesData?.courses?.items || [];
  const selectedCourse = courses.find((c: Course) => c.id === selectedCourseId);

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
  };

  // Render selected template
  const renderTemplate = useCallback(() => {
    if (!selectedCourse) return null;
    
    const props = { course: selectedCourse, config };
    
    switch (templateStyle) {
      case "flame": return <FlameTemplate {...props} />;
      case "professional": return <ProfessionalTemplate {...props} />;
      case "modern": return <ModernTemplate {...props} />;
      case "minimal": return <MinimalTemplate {...props} />;
      case "celebration": return <CelebrationTemplate {...props} />;
      default: return <FlameTemplate {...props} />;
    }
  }, [selectedCourse, templateStyle, config]);

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
      link.download = `${(selectedCourse?.title || "post").replace(/\s+/g, "-").toLowerCase()}-${templateStyle}-${aspectRatio.replace(":", "x")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    }
    setIsExporting(false);
  }, [selectedCourse, templateStyle, aspectRatio]);

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
      link.download = `${(selectedCourse?.title || "post").replace(/\s+/g, "-").toLowerCase()}-${templateStyle}-${aspectRatio.replace(":", "x")}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    }
    setIsExporting(false);
  }, [selectedCourse, templateStyle, aspectRatio]);

  // Copy template caption
  const generateCaption = () => {
    const course = selectedCourse;
    if (!course) return "";
    
    const hashtags = [
      "#Bootskills", "#OnlineLearning", "#SkillsDevelopment",
      course.category ? `#${course.category.replace(/\s+/g, "")}` : "",
      "#TechTraining", "#AfricanTech", "#KigaliTech", "#NeverStopLearning"
    ].filter(Boolean).join(" ");
    
    return `🚀 **${config.headline || course.title}**\n\n${config.subheadline || `Master ${course.title} with hands-on projects and expert mentorship. ${course.level || "All levels"} welcome!`}\n\n✅ Expert-led training\n✅ Real-world projects\n✅ Career mentorship\n✅ Certificate of completion\n\n${config.showPrice ? `💰 Only ${course.discountPrice || course.price?.toLocaleString()} RWF` : ""}\n\n${config.ctaText || "Enroll now"} at bootskills.com\n\n${hashtags}`;
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
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Camera className="w-6 h-6 text-primary" />
            Social Post Generator
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create stunning marketing posts for Instagram, WhatsApp, and social media
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
          {/* Course Selection */}
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
                      <>
                        <span>·</span>
                        <span className="text-primary font-medium">{selectedCourse.discountPrice?.toLocaleString()} RWF</span>
                      </>
                    )}
                  </div>
                </div>
              )}
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
                  placeholder="Custom headline or course title"
                  className="mt-1 h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Subheadline (optional)</Label>
                <Input
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                  placeholder="Short supporting text"
                  className="mt-1 h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Call to Action</Label>
                <Input
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="e.g. Enroll Now, Get Started"
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
              <Button variant="ghost" size="sm" onClick={handleReset} className="w-full text-xs">
                <RefreshCw className="w-3 h-3 mr-1" />
                Reset Content
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
                  {selectedCourse ? `${templateStyle} · ${aspectRatio}` : "Select a course to begin"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] text-muted-foreground w-8 text-center">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => setZoom(z => Math.min(2, z + 0.1))}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center bg-muted/30 rounded-xl p-4 md:p-8 min-h-[400px] items-center">
                <AnimatePresence mode="wait">
                  {selectedCourse ? (
                    <motion.div
                      key={`${selectedCourse.id}-${templateStyle}-${aspectRatio}`}
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
                      <Image className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Select a course and customize your post</p>
                      <p className="text-xs mt-1">Choose from 5 template styles and export for any platform</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {selectedCourse && (
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
                    <li>• Post during peak hours: 7-9 AM or 6-8 PM for best engagement</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Need to import Facebook, Twitter, Linkedin icons from lucide
// Facebook, Twitter, Linkedin are not in lucide-react directly
// Using custom SVGs via inline components

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

