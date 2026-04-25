import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TextEditor } from "@/components/ui/text-editor";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HelpCircle,
  Lock,
  Trash2,
  Info,
  DollarSign,
  BookOpen,
  Layout,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  ExternalLink,
  Paperclip,
  PlayCircle
} from "lucide-react";
import { ManageQuestionsDialog, ResourceBankDialog } from "./index";
import { useAuth } from "@/contexts/AuthContext";
import { FileUpload } from "@/components/FileUpload";

interface EditCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: any | null;
  trainers?: any[];
  onSave?: (course: any) => void;
  isLoading?: boolean;
}

import { useQuery } from "@apollo/client/react";
import { GET_CATEGORIES } from "@/lib/graphql/queries";

export function EditCourseDialog({
  open,
  onOpenChange,
  course,
  trainers = [],
  onSave,
  isLoading = false
}: EditCourseDialogProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const { data: categoryData } = useQuery(GET_CATEGORIES);
  const categories = (categoryData as any)?.categories || [];

  const [formData, setFormData] = useState<any>({
    title: "",
    description: "",
    thumbnail: "",
    price: "0",
    discountPrice: "0",
    isFree: false,
    level: "Beginner",
    category: "Development",
    instructorId: "",
    status: "draft",
    allowedDeliveryModes: ["online"],
    enrollmentMode: "direct",
    submissionRequired: true,
    signerName: "",
    signerSignature: "",
    applicationQuestions: [],
    modules: []
  });

  const [hasInitialized, setHasInitialized] = useState(false);
  const [questionLesson, setQuestionLesson] = useState<{ id: string, title: string } | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({ 0: true });
  const [showResourceBank, setShowResourceBank] = useState(false);
  const [resourceBankTarget, setResourceBankTarget] = useState<{ mIdx: number, lIdx: number } | null>(null);

  // Reset initialization when dialog closes or the course ID changes
  useEffect(() => {
    if (!open) {
      setHasInitialized(false);
    }
  }, [open, course?.id]);

  // 1. Core initialization and background sync
  useEffect(() => {
    if (course && open) {
      setFormData(prev => {
        // If this is the FIRST time we're loading THIS course in THIS session
        if (!hasInitialized || prev.id !== course.id) {
          setHasInitialized(true);
          return {
            id: course.id,
            title: course.title || "",
            description: course.description || "",
            thumbnail: course.thumbnail || "",
            price: course.price?.toString() || "0",
            discountPrice: course.discountPrice?.toString() || "0",
            isFree: course.price === 0,
            level: course.level || "Beginner",
            category: course.category || "Development",
            instructorId: course.instructor?.id || course.instructor || "",
            status: course.status || "draft",
            allowedDeliveryModes: course.allowedDeliveryModes || ["online"],
            enrollmentMode: course.enrollmentMode || "direct",
            submissionRequired: course.submissionRequired !== false,
            signerName: course.signerName || "",
            signerSignature: course.signerSignature || "",
            applicationQuestions: course.applicationQuestions?.map((q: any) => ({
              label: q.label || "",
              type: q.type || "text",
              required: !!q.required,
              options: q.options || []
            })) || [],
            modules: course.modules?.map((m: any) => ({
              ...m,
              title: m.title || "",
              description: m.description || "",
              lessons: m.lessons?.map((l: any) => ({
                ...l,
                title: l.title || "",
                duration: l.duration || 0,
                content: l.content || "",
                videoUrl: l.videoUrl || "",
                fileUrl: l.fileUrl || "",
                type: l.type || "video",
                requiredAssignment: !!l.requiredAssignment,
                isAssignment: !!l.isAssignment || l.type === 'assignment',
                assignmentDescription: l.assignmentDescription || "",
                assignmentDeliverables: l.assignmentDeliverables || []
              })) || []
            })) || []
          };
        }

        // Subsequent background updates (e.g. curriculum arriving)
        const hasMoreModules = (course.modules?.length > prev.modules.length);
        const hasLessonsNow = (prev.modules.length > 0 && prev.modules.every((m: any) => !m.lessons?.length) && course.modules?.[0]?.lessons?.length > 0);
        const shouldUpdatePricing = (prev.price === "0" && course.price > 0);
        const shouldUpdateDetails = (prev.thumbnail === "" && course.thumbnail);

        if (hasMoreModules || hasLessonsNow || shouldUpdatePricing || shouldUpdateDetails) {
          return {
            ...prev,
            price: shouldUpdatePricing ? course.price.toString() : prev.price,
            isFree: shouldUpdatePricing ? (course.price === 0) : prev.isFree,
            thumbnail: shouldUpdateDetails ? course.thumbnail : prev.thumbnail,
            level: (prev.level === "Beginner" && course.level && course.level !== "Beginner") ? course.level : prev.level,
            category: (prev.category === "Development" && course.category && course.category !== "Development") ? course.category : prev.category,
            modules: (hasMoreModules || hasLessonsNow) ? course.modules.map((m: any) => ({
              ...m,
              title: m.title || "",
              description: m.description || "",
              lessons: m.lessons?.map((l: any) => ({
                ...l,
                title: l.title || "",
                duration: l.duration || 0,
                content: l.content || "",
                videoUrl: l.videoUrl || "",
                fileUrl: l.fileUrl || "",
                type: l.type || "video",
                requiredAssignment: !!l.requiredAssignment,
                isAssignment: !!l.isAssignment || l.type === 'assignment',
                assignmentDescription: l.assignmentDescription || "",
                assignmentDeliverables: l.assignmentDeliverables || []
              })) || []
            })) : prev.modules
          };
        }

        return prev;
      });
    }
  }, [course, open, hasInitialized]);

  const handleSave = () => {
    if (!course) return;

    const updatedCourse = {
      ...course,
      title: formData.title,
      description: formData.description,
      thumbnail: formData.thumbnail,
      price: formData.isFree ? 0 : parseFloat(formData.price) || 0,
      discountPrice: parseFloat(formData.discountPrice) || 0,
      level: formData.level,
      category: formData.category,
      instructorId: formData.instructorId,
      status: formData.status,
      allowedDeliveryModes: formData.allowedDeliveryModes,
      enrollmentMode: formData.enrollmentMode,
      submissionRequired: formData.submissionRequired,
      signerName: formData.signerName,
      signerSignature: formData.signerSignature,
      applicationQuestions: formData.applicationQuestions.map((q: any) => ({
        label: q.label,
        type: q.type,
        required: q.required,
        options: q.options || []
      })),
      modules: formData.modules.map((m: any) => ({
        id: m.id || m._id,
        title: m.title,
        description: m.description || "",
        lessons: m.lessons.map((l: any) => ({
          id: l.id || l._id,
          title: l.title,
          duration: Number(l.duration) || 0,
          videoUrl: l.videoUrl || "",
          fileUrl: l.fileUrl || "",
          type: l.type || "video",
          content: l.content || "",
          isAssignment: l.type === 'assignment',
          requiredAssignment: !!l.requiredAssignment,
          assignmentDescription: l.assignmentDescription || "",
          assignmentDeliverables: l.assignmentDeliverables || [],
          resources: l.resources?.map((r: any) => ({
            id: r.id || r._id,
            title: r.title,
            url: r.url,
            type: r.type,
            source: r.source,
            visibility: r.visibility
          })) || []
        }))
      }))
    };

    onSave?.(updatedCourse);
    onOpenChange(false);
  };

  if (!course) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden border-accent/20">
        <DialogHeader className="px-6 py-4 bg-accent/5 flex-shrink-0 border-b border-accent/10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Layout className="w-5 h-5 text-accent" />
                Edit Course: {formData.title || "Untitled"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Manage your course content, pricing, and curriculum from a single place.
              </DialogDescription>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${formData.status === 'published' ? 'bg-green-500/10 text-green-500' :
              formData.status === 'archived' ? 'bg-red-500/10 text-red-500' :
                'bg-amber-500/10 text-amber-500'
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${formData.status === 'published' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' :
                formData.status === 'archived' ? 'bg-red-500' : 'bg-amber-500'
                }`} />
              {formData.status}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 flex flex-col min-h-0">
          <div className="px-6 bg-muted/20 border-b">
            <TabsList className="bg-transparent h-12 w-full justify-start gap-6 rounded-none p-0">
              <TabsTrigger
                value="basic"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none shadow-none text-xs font-bold gap-2 px-1"
              >
                <Info className="w-4 h-4" /> Basic Details
              </TabsTrigger>
              <TabsTrigger
                value="pricing"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none shadow-none text-xs font-bold gap-2 px-1"
              >
                <DollarSign className="w-4 h-4" /> Pricing & Access
              </TabsTrigger>
              <TabsTrigger
                value="application"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none shadow-none text-xs font-bold gap-2 px-1"
              >
                <HelpCircle className="w-4 h-4" /> Application Questions
              </TabsTrigger>
              <TabsTrigger
                value="curriculum"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none shadow-none text-xs font-bold gap-2 px-1"
              >
                <BookOpen className="w-4 h-4" /> Curriculum
                {isLoading && <Loader2 className="w-3 h-3 animate-spin text-accent" />}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden relative">
            {isLoading && !formData.modules.length && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
                  <Layout className="w-5 h-5 text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm">Syncing Course Data...</p>
                  <p className="text-xs text-muted-foreground mt-1">Downloading the latest modules and lessons</p>
                </div>
              </div>
            )}

            <ScrollArea className="h-full">
              <div className="p-6">
                <TabsContent value="basic" className="m-0 space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Block 1: General Info */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 border-b border-accent/10 pb-2">
                        <Layout className="w-5 h-5 text-accent" />
                        <h3 className="font-bold text-sm uppercase tracking-tight">General Information</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold mb-1.5 block text-muted-foreground flex items-center gap-2">
                            Course Title
                            {!isAdmin && <Lock className="w-2.5 h-2.5" />}
                          </label>
                          <Input
                            placeholder="e.g., Master React with TypeScript"
                            className="h-11 font-medium bg-background border-accent/10 focus:border-accent"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            disabled={!isAdmin}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold mb-1.5 block text-muted-foreground">Difficulty Level</label>
                            <Input
                              placeholder="Beginner"
                              className="bg-background border-accent/10 h-10 font-medium"
                              value={formData.level}
                              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                              disabled={!isAdmin}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold mb-1.5 block text-muted-foreground">Subject Category</label>
                            <Input
                              placeholder="Development"
                              list="course-categories"
                              className="bg-background border-accent/10 h-10 font-medium"
                              value={formData.category}
                              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                              disabled={!isAdmin}
                            />
                            <datalist id="course-categories">
                              {categories.map((cat: string) => (
                                <option key={cat} value={cat} />
                              ))}
                            </datalist>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold mb-3 block text-muted-foreground">Course Status</label>
                          <div className="flex gap-2 p-1 bg-muted/30 rounded-xl border border-border/50">
                            {['draft', 'published', 'archived'].map((status) => (
                              <Button
                                key={status}
                                type="button"
                                variant={formData.status === status ? 'gold' : 'ghost'}
                                size="sm"
                                className="flex-1 h-9 text-[10px] font-black uppercase transition-all rounded-lg"
                                onClick={() => setFormData({ ...formData, status })}
                              >
                                {status === 'published' ? 'Live' : status}
                              </Button>
                            ))}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-2 italic px-1">
                            {formData.status === 'published' ? 'Visible to students on the platform.' : 'Private and cannot be accessed by students.'}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold mb-1.5 block text-muted-foreground">Delivery Modes</label>
                            <div className="flex flex-col gap-2">
                              {['online', 'physical', 'hybrid'].map((mode) => (
                                <label key={mode} className="flex items-center gap-2 text-xs">
                                  <input
                                    type="checkbox"
                                    checked={formData.allowedDeliveryModes?.includes(mode) || false}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      const modes = formData.allowedDeliveryModes || [];
                                      setFormData({
                                        ...formData,
                                        allowedDeliveryModes: checked ? [...modes, mode] : modes.filter((m: string) => m !== mode)
                                      });
                                    }}
                                  />
                                  <span className="capitalize">{mode}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-bold mb-1.5 block text-muted-foreground">Enrollment Mode</label>
                            <select
                              className="w-full h-10 px-3 rounded-lg border border-accent/10 bg-background text-sm font-medium focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                              value={formData.enrollmentMode || "direct"}
                              onChange={(e) => setFormData({ ...formData, enrollmentMode: e.target.value })}
                            >
                              <option value="direct">Direct Enrollment (Pay & Join)</option>
                              <option value="application">Application Required</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Block 2: Settings & Media */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 border-b border-accent/10 pb-2">
                        <CheckCircle2 className="w-5 h-5 text-accent" />
                        <h3 className="font-bold text-sm uppercase tracking-tight">Settings & Requirements</h3>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl shadow-sm">
                          <div className="space-y-1 pr-4">
                            <label className="text-sm font-bold flex items-center gap-2">
                              Strict Progress Control
                              <Badge variant="outline" className="text-[8px] h-4 py-0 bg-amber-500/10 border-amber-500/20 text-amber-600">Pro</Badge>
                            </label>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                              Require assignment submission and <b>trainer approval</b> before students can move to the next unit.
                            </p>
                          </div>
                          <Switch
                            checked={formData.submissionRequired}
                            onCheckedChange={(checked) => setFormData({ ...formData, submissionRequired: checked })}
                            className="data-[state=checked]:bg-amber-500"
                          />
                        </div>

                        {isAdmin && (
                          <div>
                            <label className="text-xs font-bold mb-1.5 block text-muted-foreground">Primary Instructor (Lead Trainer)</label>
                            <select
                              className="w-full h-11 px-3 rounded-xl border border-accent/10 bg-background text-sm font-medium focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                              value={formData.instructorId}
                              onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
                            >
                              <option value="">Choose an instructor...</option>
                              {trainers.map((t: any) => (
                                <option key={t.id} value={t.id}>{t.username} ({t.role})</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div>
                          <label className="text-xs font-bold mb-1.5 block text-muted-foreground">Cover Thumbnail</label>
                          <div className="group relative aspect-[21/9] rounded-2xl overflow-hidden border-2 border-dashed border-accent/10 bg-muted/5 hover:border-accent/30 transition-all flex items-center justify-center">
                            {formData.thumbnail ? (
                              <>
                                <img src={formData.thumbnail} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="h-8 gap-2 rounded-lg"
                                    onClick={() => setFormData({ ...formData, thumbnail: "" })}
                                  >
                                    <Trash2 className="w-4 h-4" /> Replace
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full p-2">
                                <FileUpload
                                  folder="courses"
                                  label="Drag & Drop Cover Image"
                                  onUploadComplete={(url) => setFormData({ ...formData, thumbnail: url })}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="p-4 bg-accent/5 rounded-2xl border border-accent/10 space-y-4">
                          <div className="flex items-center gap-2 border-b border-accent/10 pb-2">
                            <Plus className="w-4 h-4 text-accent" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-accent">Certificate Setup</h4>
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Signer Name</label>
                            <Input
                              placeholder="e.g. CEO or Program Manager"
                              className="h-9 text-xs bg-background border-accent/10"
                              value={formData.signerName}
                              onChange={(e) => setFormData({ ...formData, signerName: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Official Signature</label>
                            {formData.signerSignature ? (
                              <div className="relative h-10 rounded-lg overflow-hidden border border-border/20 bg-white p-1 flex items-center justify-between">
                                <img src={formData.signerSignature} className="h-full object-contain" />
                                <Button variant="ghost" size="icon" onClick={() => setFormData({ ...formData, signerSignature: "" })} className="h-6 w-6 text-destructive">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="h-10">
                                <FileUpload 
                                  folder="signatures" 
                                  label="Upload PNG Signature"
                                  onUploadComplete={(url) => setFormData({ ...formData, signerSignature: url })}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold flex items-center gap-2">
                      Course Description
                    </label>
                    <div className="rounded-xl border border-accent/10 overflow-hidden shadow-sm shadow-accent/5">
                      <TextEditor
                        value={formData.description}
                        onChange={(content) => setFormData({ ...formData, description: content })}
                        placeholder="Write a compelling course overview..."
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="pricing" className="m-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="max-w-2xl space-y-6">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="relative group">
                        <label className="text-sm font-bold flex items-center gap-2 mb-3">
                          <DollarSign className="w-4 h-4 text-accent" />
                          Base Price ($)
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            className="h-12 pl-10 bg-background font-bold text-lg border-accent/10"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            disabled={formData.isFree || !isAdmin}
                          />
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                        </div>
                      </div>

                      <div className="relative group">
                        <label className="text-sm font-bold flex items-center gap-2 mb-3">
                          <Badge variant="outline" className="text-accent bg-accent/5 border-accent/20">Holiday Special</Badge>
                          Discounted Price ($)
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            className="h-12 pl-10 bg-background font-bold text-lg border-accent/10 text-accent"
                            value={formData.discountPrice}
                            onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                            disabled={!isAdmin}
                          />
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-accent/50 font-bold">$</span>
                        </div>
                      </div>
                    </div>

                    <div className={`p-6 rounded-2xl border-2 border-dashed transition-all ${formData.isFree ? 'border-green-500/50 bg-green-500/5' : 'border-accent/10 bg-muted/5'
                      }`}>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="font-bold text-lg flex items-center gap-2">
                            {formData.isFree ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-blue-500" />}
                            Make Course Free
                          </h4>
                          <p className="text-sm text-muted-foreground max-w-sm">
                            Allow all enrolled students and visitors to access the full course content without payment.
                          </p>
                        </div>
                        <Switch
                          checked={formData.isFree}
                          onCheckedChange={(checked) => setFormData({ ...formData, isFree: checked })}
                          disabled={!isAdmin}
                          className="scale-125"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="application" className="m-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-accent" />
                        Application Questions
                      </h3>
                      <p className="text-xs text-muted-foreground">Define the information you need from students who apply for this course.</p>
                    </div>
                    <Button
                      variant="gold"
                      size="sm"
                      className="h-9 gap-2 font-bold text-xs rounded-xl"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          applicationQuestions: [
                            ...formData.applicationQuestions,
                            { label: "", type: "text", required: true, options: [] }
                          ]
                        });
                      }}
                    >
                      <Plus className="w-4 h-4" /> Add Question
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {formData.applicationQuestions?.map((question: any, qIdx: number) => (
                      <div key={qIdx} className="p-4 bg-muted/20 rounded-2xl border border-accent/10 space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase">Question Label</label>
                                <Input
                                  placeholder="e.g. Why do you want to join this course?"
                                  className="h-9 text-sm bg-background border-accent/10"
                                  value={question.label}
                                  onChange={(e) => {
                                    const newQuestions = [...formData.applicationQuestions];
                                    newQuestions[qIdx] = { ...question, label: e.target.value };
                                    setFormData({ ...formData, applicationQuestions: newQuestions });
                                  }}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase">Input Type</label>
                                <select
                                  className="w-full h-9 px-3 rounded-lg border border-accent/10 bg-background text-sm font-medium focus:ring-2 focus:ring-accent/20 outline-none"
                                  value={question.type}
                                  onChange={(e) => {
                                    const newQuestions = [...formData.applicationQuestions];
                                    newQuestions[qIdx] = { ...question, type: e.target.value };
                                    setFormData({ ...formData, applicationQuestions: newQuestions });
                                  }}
                                >
                                  <option value="text">Short Answer</option>
                                  <option value="textarea">Long Answer</option>
                                  <option value="link">URL / Link</option>
                                  <option value="select">Multiple Choice</option>
                                </select>
                              </div>
                            </div>

                            {question.type === 'select' && (
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase block">Options (comma separated)</label>
                                <Input
                                  placeholder="Option 1, Option 2, Option 3"
                                  className="h-9 text-sm bg-background border-accent/10"
                                  value={question.options?.join(', ')}
                                  onChange={(e) => {
                                    const options = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                    const newQuestions = [...formData.applicationQuestions];
                                    newQuestions[qIdx] = { ...question, options };
                                    setFormData({ ...formData, applicationQuestions: newQuestions });
                                  }}
                                />
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <Switch
                                checked={question.required}
                                onCheckedChange={(checked) => {
                                  const newQuestions = [...formData.applicationQuestions];
                                  newQuestions[qIdx] = { ...question, required: checked };
                                  setFormData({ ...formData, applicationQuestions: newQuestions });
                                }}
                                className="scale-75"
                              />
                              <label className="text-xs font-medium text-muted-foreground">Required Question</label>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive/50 hover:text-destructive hover:bg-destructive/5"
                            onClick={() => {
                              const newQuestions = formData.applicationQuestions.filter((_: any, i: number) => i !== qIdx);
                              setFormData({ ...formData, applicationQuestions: newQuestions });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {(!formData.applicationQuestions || formData.applicationQuestions.length === 0) && (
                      <div className="text-center py-12 bg-muted/10 rounded-3xl border border-dashed border-accent/10">
                        <div className="w-12 h-12 rounded-2xl bg-accent/5 flex items-center justify-center mx-auto mb-4">
                          <HelpCircle className="w-6 h-6 text-accent/40" />
                        </div>
                        <h4 className="font-bold text-sm">No questions added</h4>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">
                          Click "Add Question" to start building your application form.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="curriculum" className="m-0 space-y-6 animate-in fade-in slide-in-from-right-2 duration-400">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold font-heading text-card-foreground flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-accent" />
                        Curriculum Builder
                      </h3>
                      <p className="text-xs text-muted-foreground">Organize your course into modules and lessons</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-2 font-bold text-xs rounded-xl"
                        onClick={() => {
                          setQuestionLesson({ id: "", title: "Course Wide" });
                        }}
                      >
                        <HelpCircle className="w-4 h-4 text-accent" />
                        Manage Course Quiz
                      </Button>
                      <Button
                        variant="gold"
                        size="sm"
                        className="h-9 gap-2 font-bold text-xs rounded-xl shadow-lg shadow-gold/10"
                        onClick={() => {
                          const newModules = [...formData.modules, { title: "New Module", description: "", lessons: [] }];
                          setFormData({ ...formData, modules: newModules });
                          setExpandedModules({ ...expandedModules, [newModules.length - 1]: true });
                        }}
                      >
                        <Plus className="w-4 h-4" />
                        Add Module
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {formData.modules?.map((module: any, mIdx: number) => (
                      <div key={mIdx} className="group relative bg-background border border-accent/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-accent/20 group-hover:bg-accent transition-colors" />

                        <div className="p-4 sm:p-6 space-y-4">
                          <div className="flex items-start gap-4 cursor-pointer" onClick={() => setExpandedModules(prev => ({ ...prev, [mIdx]: !prev[mIdx] }))}>
                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                              <span className="font-heading text-lg font-bold text-accent">M{mIdx + 1}</span>
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex gap-2">
                                <Input
                                  className="font-bold text-lg bg-transparent border-0 border-b border-transparent focus:border-accent focus:ring-0 rounded-none px-0 h-auto pb-1"
                                  placeholder="Module Title"
                                  value={module.title}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    const newModules = [...formData.modules];
                                    newModules[mIdx] = { ...module, title: e.target.value };
                                    setFormData({ ...formData, modules: newModules });
                                  }}
                                />
                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive/40 hover:text-destructive hover:bg-destructive/5"
                                    onClick={() => {
                                      const newModules = formData.modules.filter((_: any, i: number) => i !== mIdx);
                                      setFormData({ ...formData, modules: newModules });
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                  <div className="w-8 h-8 flex items-center justify-center text-muted-foreground">
                                    {expandedModules[mIdx] ? <Info className="w-4 h-4 rotate-180 transition-transform" /> : <Info className="w-4 h-4 transition-transform" />}
                                  </div>
                                </div>
                              </div>
                              <Input
                                className="text-xs h-7 bg-muted/30 border-none italic"
                                placeholder="Module description..."
                                value={module.description || ""}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  const newModules = [...formData.modules];
                                  newModules[mIdx] = { ...module, description: e.target.value };
                                  setFormData({ ...formData, modules: newModules });
                                }}
                              />
                            </div>
                          </div>

                          {expandedModules[mIdx] && (
                            <div className="space-y-4 pt-4 border-t border-accent/5 animate-in slide-in-from-top-2 duration-300">
                              <div className="grid grid-cols-1 gap-4">
                                {module.lessons?.map((lesson: any, lIdx: number) => (
                                  <div key={lIdx} className="relative p-4 bg-muted/20 rounded-xl border border-transparent hover:border-accent/10 transition-colors space-y-4">
                                    <div className="flex items-center gap-3">
                                      <div className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[9px] font-heading font-black">L{lIdx + 1}</div>
                                      <Input
                                        placeholder="Lesson Title"
                                        className="h-8 text-sm flex-1 font-bold bg-transparent border-transparent focus:border-accent/30"
                                        value={lesson.title}
                                        onChange={(e) => {
                                          const newModules = [...formData.modules];
                                          const newLessons = [...module.lessons];
                                          newLessons[lIdx] = { ...lesson, title: e.target.value };
                                          newModules[mIdx] = { ...module, lessons: newLessons };
                                          setFormData({ ...formData, modules: newModules });
                                        }}
                                      />
                                      <select
                                        className="h-8 px-2 rounded-lg border-accent/10 bg-background text-[9px] font-black uppercase tracking-widest text-muted-foreground outline-none"
                                        value={lesson.type || "video"}
                                        onChange={(e) => {
                                          const newModules = [...formData.modules];
                                          const newLessons = [...module.lessons];
                                          newLessons[lIdx] = { ...lesson, type: e.target.value };
                                          newModules[mIdx] = { ...module, lessons: newLessons };
                                          setFormData({ ...formData, modules: newModules });
                                        }}
                                      >
                                        {['video', 'pdf', 'ppt', 'book', 'article', 'quiz', 'assignment'].map(t => (
                                          <option key={t} value={t}>{t}</option>
                                        ))}
                                      </select>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive"
                                        onClick={() => {
                                          const newModules = [...formData.modules];
                                          const newLessons = module.lessons.filter((_: any, i: number) => i !== lIdx);
                                          newModules[mIdx] = { ...module, lessons: newLessons };
                                          setFormData({ ...formData, modules: newModules });
                                        }}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>

                                    {lesson.type === 'assignment' && (
                                      <div className="space-y-3 p-3 bg-accent/5 rounded-lg border border-accent/10">
                                        <div className="flex items-center justify-between pb-2 border-b border-accent/10">
                                          <div>
                                            <label className="text-[10px] font-bold text-accent uppercase block">Required Submission</label>
                                            <p className="text-[9px] text-muted-foreground">Force submission for this specific unit</p>
                                          </div>
                                          <Switch
                                            checked={lesson.requiredAssignment || false}
                                            onCheckedChange={(checked) => {
                                              const newModules = [...formData.modules];
                                              const newLessons = [...module.lessons];
                                              newLessons[lIdx] = { ...lesson, requiredAssignment: checked };
                                              newModules[mIdx] = { ...module, lessons: newLessons };
                                              setFormData({ ...formData, modules: newModules });
                                            }}
                                            className="scale-75"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[10px] font-bold text-accent uppercase block mb-1">Assignment Description</label>
                                          <Input
                                            className="text-xs bg-background border-accent/20"
                                            placeholder="Submission instructions..."
                                            value={lesson.assignmentDescription || ""}
                                            onChange={(e) => {
                                              const newModules = [...formData.modules];
                                              const newLessons = [...module.lessons];
                                              newLessons[lIdx] = { ...lesson, assignmentDescription: e.target.value, isAssignment: true };
                                              newModules[mIdx] = { ...module, lessons: newLessons };
                                              setFormData({ ...formData, modules: newModules });
                                            }}
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[10px] font-bold text-accent uppercase block mb-1">Expected Deliverables (comma separated)</label>
                                          <Input
                                            className="text-xs bg-background border-accent/20"
                                            placeholder="GitHub URL, Live Link"
                                            value={lesson.assignmentDeliverables?.join(', ') || ""}
                                            onChange={(e) => {
                                              const deliverables = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                              const newModules = [...formData.modules];
                                              const newLessons = [...module.lessons];
                                              newLessons[lIdx] = { ...lesson, assignmentDeliverables: deliverables, isAssignment: true };
                                              newModules[mIdx] = { ...module, lessons: newLessons };
                                              setFormData({ ...formData, modules: newModules });
                                            }}
                                          />
                                        </div>
                                      </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                      <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                          <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                            <PlayCircle className="w-3 h-3" /> Video URL
                                          </label>
                                        </div>
                                        <Input
                                          className="h-8 text-xs bg-background/50"
                                          placeholder="YouTube/Vimeo/Direct Link"
                                          value={lesson.videoUrl || ""}
                                          onChange={(e) => {
                                            const newModules = [...formData.modules];
                                            const newLessons = [...module.lessons];
                                            newLessons[lIdx] = { ...lesson, videoUrl: e.target.value };
                                            newModules[mIdx] = { ...module, lessons: newLessons };
                                            setFormData({ ...formData, modules: newModules });
                                          }}
                                        />
                                      </div>
                                      <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                          <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                            <ExternalLink className="w-3 h-3" /> Resource Link / Google Drive
                                          </label>
                                        </div>
                                        <Input
                                          className="h-8 text-xs bg-background/50"
                                          placeholder="Link to PDF, Doc, or Google Drive folder"
                                          value={lesson.fileUrl || ""}
                                          onChange={(e) => {
                                            const newModules = [...formData.modules];
                                            const newLessons = [...module.lessons];
                                            newLessons[lIdx] = { ...lesson, fileUrl: e.target.value };
                                            newModules[mIdx] = { ...module, lessons: newLessons };
                                            setFormData({ ...formData, modules: newModules });
                                          }}
                                        />
                                      </div>
                                    </div>

                                    <div className="p-3 bg-accent/5 rounded-xl border border-accent/10 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold text-accent italic flex items-center gap-1">
                                          <Paperclip className="w-3 h-3" /> Upload PPT / PDF / Resource
                                        </label>
                                        {lesson.fileUrl && (
                                          <Badge variant="outline" className="text-[9px] bg-background">
                                            {lesson.fileUrl.split('/').pop()?.slice(-20)}...
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="h-24">
                                        <FileUpload
                                          folder="course_resources"
                                          label="Click to upload lesson materials"
                                          onUploadComplete={(url) => {
                                            const newModules = [...formData.modules];
                                            const newLessons = [...module.lessons];
                                            newLessons[lIdx] = { ...lesson, fileUrl: url };
                                            newModules[mIdx] = { ...module, lessons: newLessons };
                                            setFormData({ ...formData, modules: newModules });
                                          }}
                                        />
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                      <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                          <Calendar className="w-3 h-3 text-muted-foreground" />
                                          <input
                                            type="number"
                                            className="w-12 h-6 px-1 rounded border border-accent/10 bg-background text-[10px] font-bold text-center"
                                            value={lesson.duration || 0}
                                            onChange={(e) => {
                                              const newModules = [...formData.modules];
                                              const newLessons = [...module.lessons];
                                              newLessons[lIdx] = { ...lesson, duration: parseInt(e.target.value) || 0 };
                                              newModules[mIdx] = { ...module, lessons: newLessons };
                                              setFormData({ ...formData, modules: newModules });
                                            }}
                                          />
                                          <span className="text-[10px] text-muted-foreground font-bold">MIN</span>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 text-[10px] font-bold text-accent hover:bg-accent/5 px-2"
                                          onClick={() => {
                                            const newModules = [...formData.modules];
                                            const newLessons = [...module.lessons];
                                            newLessons[lIdx] = { ...lesson, _showEditor: !lesson._showEditor };
                                            newModules[mIdx] = { ...module, lessons: newLessons };
                                            setFormData({ ...formData, modules: newModules });
                                          }}
                                        >
                                          {lesson._showEditor ? "Hide Content" : "Edit Details"}
                                        </Button>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-[10px] font-bold gap-1 text-muted-foreground hover:text-accent transition-colors"
                                        onClick={() => {
                                          const lessonId = lesson.id || `${mIdx}-${lIdx}`;
                                          setQuestionLesson({ id: lessonId, title: lesson.title });
                                        }}
                                      >
                                        <HelpCircle className="w-3 h-3" /> Quiz Builder
                                      </Button>
                                    </div>

                                    {lesson._showEditor && (
                                      <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                                        <TextEditor
                                          value={lesson.content || ""}
                                          onChange={(content) => {
                                            const newModules = [...formData.modules];
                                            const newLessons = [...module.lessons];
                                            newLessons[lIdx] = { ...lesson, content };
                                            newModules[mIdx] = { ...module, lessons: newLessons };
                                            setFormData({ ...formData, modules: newModules });
                                          }}
                                          placeholder="Add lesson text or notes..."
                                        />
                                      </div>
                                    )}
                                  </div>
                                ))}

                                <Button
                                  variant="outline"
                                  className="w-full h-11 border-dashed border-accent/20 hover:border-accent/40 hover:bg-accent/5 transition-all text-[10px] font-bold gap-2 rounded-xl group"
                                  onClick={() => {
                                    const newModules = [...formData.modules];
                                    const newLessons = [...(module.lessons || []), { title: "New Lesson", duration: 10, type: "video" }];
                                    newModules[mIdx] = { ...module, lessons: newLessons };
                                    setFormData({ ...formData, modules: newModules });
                                  }}
                                >
                                  <Plus className="w-4 h-4 text-accent transition-transform group-hover:rotate-90" />
                                  Add Lesson to {module.title}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </div>
            </ScrollArea>
          </div>
        </Tabs>

        <div className="flex gap-4 p-6 border-t border-accent/10 bg-background/80 backdrop-blur-md flex-shrink-0">
          <Button variant="outline" className="flex-1 font-bold h-11 rounded-xl shadow-sm" onClick={() => onOpenChange(false)}>
            Discard Changes
          </Button>
          <Button
            variant="outline"
            className="flex-1 font-bold h-11 rounded-xl shadow-sm gap-2"
            onClick={() => window.open(`/courses/${formData.id || course?.id}`, '_blank')}
          >
            <ExternalLink className="w-4 h-4" /> Preview Public Page
          </Button>
          <Button
            variant="gold"
            className="flex-1 font-bold h-11 rounded-xl shadow-lg shadow-gold/20 gap-2"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Publish Course Updates
          </Button>
        </div>
      </DialogContent >
      <ManageQuestionsDialog
        open={!!questionLesson}
        onOpenChange={(open) => !open && setQuestionLesson(null)}
        courseId={course?.id}
        lessonId={questionLesson?.id}
        lessonTitle={questionLesson?.title}
      />
      <ResourceBankDialog
        open={showResourceBank}
        onOpenChange={setShowResourceBank}
        onSelect={(resource) => {
          if (resourceBankTarget) {
            const { mIdx, lIdx } = resourceBankTarget;
            const newModules = [...formData.modules];
            const newLessons = [...newModules[mIdx].lessons];

            // Map bank resource to lesson resource
            if (resource.type === 'video') {
              newLessons[lIdx] = { ...newLessons[lIdx], videoUrl: resource.url };
            } else {
              newLessons[lIdx] = { ...newLessons[lIdx], fileUrl: resource.url };
            }

            newModules[mIdx] = { ...newModules[mIdx], lessons: newLessons };
            setFormData({ ...formData, modules: newModules });
            setShowResourceBank(false);
            setResourceBankTarget(null);
          }
        }}
      />
    </Dialog >
  );
}
