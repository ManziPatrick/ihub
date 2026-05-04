import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery } from "@apollo/client/react";
import { GET_ME } from "@/lib/graphql/queries";
import { UPDATE_STUDENT_PROFILE, CREATE_STUDENT_PROFILE, UPDATE_USER } from "@/lib/graphql/mutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { GraduationCap, School, CheckCircle2, Calendar, BookOpen, MapPin, ArrowLeft, User, Link as LinkIcon, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const YEAR_OPTIONS: Record<string, string[]> = {
    nursery: ["N1", "N2", "N3"],
    primary: ["P1", "P2", "P3", "P4", "P5", "P6"],
    secondary: ["S1", "S2", "S3", "S4", "S5", "S6"],
    university: ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5+", "Masters", "PHD", "Other"],
    cambridge: ["Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "O Level", "AS Level", "A Level", "Foundation", "Other"],
    high_school: ["S1", "S2", "S3", "S4", "S5", "S6", "Other"],
    undergraduate: ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5+", "Other"],
    graduate: ["Masters", "PHD", "Other"],
    postgraduate: ["Post-Doc", "Research", "Other"],
    other: ["N/A", "Other"]
};

interface ProfileFormProps {
    initialData?: any;
    onComplete: (data: any) => void;
    externalToken?: string;
    onChange?: (data: any) => void;
}

export function ProfileCompletionForm({ initialData, onComplete, externalToken, onChange }: ProfileFormProps) {
    const { user, updateUser } = useAuth();
    const [createProfile] = useMutation(CREATE_STUDENT_PROFILE);
    const [updateProfile] = useMutation(UPDATE_STUDENT_PROFILE);
    const [updateUserMutation] = useMutation(UPDATE_USER);
    const [formData, setFormData] = useState({
        fullName: initialData?.fullName || "",
        school: initialData?.school || "",
        educationLevel: initialData?.educationLevel || "university",
        academicYear: initialData?.academicYear || "",
        fieldOfStudy: initialData?.fieldOfStudy || "",
        city: initialData?.city || "",
        sector: initialData?.sector || "",
        cell: initialData?.cell || "",
        village: initialData?.village || "",
        skills: initialData?.skills || ["Learning"],
        availability: initialData?.availability || "flexible",
        bio: initialData?.bio || "",
        linkedinUrl: initialData?.linkedinUrl || "",
        githubUrl: initialData?.githubUrl || "",
        portfolioUrl: initialData?.portfolioUrl || ""
    });

    useEffect(() => {
        if (onChange) onChange(formData);
    }, [formData, onChange]);

    const [isNotEnrolled, setIsNotEnrolled] = useState(false);
    const [isCustomLevel, setIsCustomLevel] = useState(false);
    const [isCustomYear, setIsCustomYear] = useState(false);
    const [customLevel, setCustomLevel] = useState("");
    const [customYear, setCustomYear] = useState("");
    const [activeStep, setActiveStep] = useState(0);
    const isUniversity = formData.educationLevel === "university";
    const isHigherEd = isUniversity || formData.educationLevel === "secondary" || formData.educationLevel === "cambridge";
    const isSmallStudent = formData.educationLevel === "nursery" || formData.educationLevel === "primary";

    const steps = [
        { id: 'academic', title: 'Academic', icon: GraduationCap },
        { id: 'personal', title: 'Personal', icon: MapPin },
        ...(!isSmallStudent && isUniversity ? [{ id: 'social', title: 'Social', icon: BookOpen }] : [])
    ];




    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const finalData = {
                ...formData,
                educationLevel: isCustomLevel ? customLevel : formData.educationLevel,
                academicYear: isCustomYear ? customYear : formData.academicYear,
                // Clean up fields based on level
                fieldOfStudy: isHigherEd ? formData.fieldOfStudy : "N/A",
                bio: !isSmallStudent ? formData.bio : "",
                linkedinUrl: isUniversity ? formData.linkedinUrl : "",
                githubUrl: isUniversity ? formData.githubUrl : "",
                portfolioUrl: isUniversity ? formData.portfolioUrl : ""
            };

            const callOptions = externalToken ? {
                variables: finalData,
                context: {
                    headers: {
                        authorization: `Bearer ${externalToken}`
                    }
                }
            } : { variables: finalData };

            const { fullName, ...studentData } = finalData;
            
            // 1. Update Student Profile
            if (initialData?.id) {
                await updateProfile(callOptions);
            } else {
                await createProfile(callOptions);
            }

            // 2. Update User Base Data (fullName, bio, isFirst)
            await updateUserMutation({
                variables: {
                    id: user?.id,
                    fullName: fullName,
                    bio: studentData.bio,
                    school: studentData.school,
                    isFirst: false
                }
            });

            updateUser({ 
                fullName: fullName,
                school: studentData.school,
                isFirst: false 
            });
            onComplete(finalData);
        } catch (error: any) {
            console.error("Profile Error:", error);
            toast.error(error.message || "Failed to update profile");
        }
    };

    const validateStep = () => {
        if (activeStep === 0) {
            if (!isNotEnrolled && (!formData.school || !formData.educationLevel || !formData.academicYear)) {
                toast.error("Please fill in all academic details");
                return false;
            }
        }
        if (activeStep === 1) {
            if (!formData.city) {
                toast.error("City / District is required");
                return false;
            }
        }
        return true;
    };

    const nextStep = () => {
        if (validateStep()) {
            setActiveStep(prev => Math.min(prev + 1, steps.length - 1));
        }
    };
    const prevStep = () => setActiveStep(prev => Math.max(prev - 1, 0));

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-8 relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-accent/10 -translate-y-1/2 -z-10" />
                {steps.map((step, idx) => {
                    const Icon = step.icon;
                    const isActive = idx === activeStep;
                    const isCompleted = idx < activeStep;
                    
                    return (
                        <div 
                            key={step.id} 
                            className="flex flex-col items-center gap-2 cursor-pointer"
                            onClick={() => {
                                if (idx < activeStep || validateStep()) {
                                    setActiveStep(idx);
                                }
                            }}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 border-2",
                                isActive ? "bg-accent border-accent text-accent-foreground scale-110 shadow-lg shadow-accent/20" : 
                                isCompleted ? "bg-green-500 border-green-500 text-white" : 
                                "bg-card border-accent/20 text-muted-foreground"
                            )}>
                                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                            </div>
                            <span className={cn("text-[10px] font-black uppercase tracking-widest", isActive ? "text-accent" : "text-muted-foreground")}>
                                {step.title}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="min-h-[300px]">
                {activeStep === 0 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-accent mb-4">Academic Status</h3>
                        
                        <div className="flex items-center space-x-2 bg-accent/5 p-3 rounded-xl border border-accent/10 mb-4">
                            <input 
                                type="checkbox" 
                                id="notEnrolled" 
                                checked={isNotEnrolled}
                                onChange={(e) => {
                                    setIsNotEnrolled(e.target.checked);
                                    if (e.target.checked) {
                                        setFormData(prev => ({
                                            ...prev,
                                            school: "N/A",
                                            educationLevel: "other",
                                            academicYear: "N/A",
                                            fieldOfStudy: "N/A"
                                        }));
                                    }
                                }}
                                className="w-4 h-4 rounded border-accent/20 text-accent focus:ring-accent"
                            />
                            <label htmlFor="notEnrolled" className="text-xs font-bold text-muted-foreground cursor-pointer">
                                I am not currently enrolled in any school
                            </label>
                        </div>

                        {!isNotEnrolled && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <School className={cn("w-3 h-3", formData.school ? "text-green-500" : "text-muted-foreground")} /> School / University
                                    </label>
                                    <Input 
                                        placeholder="e.g. University of Rwanda" 
                                        value={formData.school}
                                        onChange={(e) => setFormData(prev => ({ ...prev, school: e.target.value }))}
                                        required
                                        className="h-12 bg-background border-accent/10 focus:border-accent rounded-xl"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <CheckCircle2 className={cn("w-3 h-3", (formData.educationLevel || customLevel) ? "text-green-500" : "text-muted-foreground")} /> Level
                                        </label>
                                        <Select 
                                            key={`level-${formData.educationLevel}`}
                                            value={isCustomLevel ? "other_custom" : formData.educationLevel} 
                                            onValueChange={(val: any) => {
                                                if (val === "other_custom") {
                                                    setIsCustomLevel(true);
                                                    setFormData(prev => ({ ...prev, educationLevel: "other" }));
                                                } else {
                                                    setIsCustomLevel(false);
                                                    setFormData(prev => ({ 
                                                        ...prev, 
                                                        educationLevel: val,
                                                        academicYear: YEAR_OPTIONS[val]?.[0] || ""
                                                    }));
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="h-12 bg-background border-accent/10 rounded-xl">
                                                <SelectValue placeholder="Select Level" />
                                            </SelectTrigger>
                                            <SelectContent position="popper" className="z-[1001]">
                                                <SelectItem value="nursery">Nursery</SelectItem>
                                                <SelectItem value="primary">Primary School</SelectItem>
                                                <SelectItem value="secondary">Secondary School</SelectItem>
                                                <SelectItem value="cambridge">Cambridge</SelectItem>
                                                <SelectItem value="university">University</SelectItem>
                                                <SelectItem value="other_custom">Other (Custom)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <Calendar className={cn("w-3 h-3", (formData.academicYear || customYear) ? "text-green-500" : "text-muted-foreground")} /> Year
                                        </label>
                                        <Select 
                                            key={`year-${formData.educationLevel}-${formData.academicYear}`}
                                            value={isCustomYear ? "other_custom" : formData.academicYear} 
                                            onValueChange={(val) => {
                                                if (val === "Other" || val === "other_custom") {
                                                    setIsCustomYear(true);
                                                    setFormData(prev => ({ ...prev, academicYear: "Other" }));
                                                } else {
                                                    setIsCustomYear(false);
                                                    setFormData(prev => ({ ...prev, academicYear: val }));
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="h-12 bg-background border-accent/10 rounded-xl">
                                                <SelectValue placeholder="Select Year" />
                                            </SelectTrigger>
                                            <SelectContent position="popper" className="z-[1001]">
                                                {(YEAR_OPTIONS[formData.educationLevel] || ["N/A"]).map(opt => (
                                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                ))}
                                                <SelectItem value="other_custom">Other (Custom)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {isHigherEd && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <BookOpen className={cn("w-3 h-3", formData.fieldOfStudy ? "text-green-500" : "text-muted-foreground")} /> Field of Study
                                        </label>
                                        <Input 
                                            placeholder="e.g. Computer Science" 
                                            value={formData.fieldOfStudy}
                                            onChange={(e) => setFormData(prev => ({ ...prev, fieldOfStudy: e.target.value }))}
                                            required={formData.educationLevel === 'university' || formData.educationLevel === 'secondary'}
                                            className="h-12 bg-background border-accent/10 focus:border-accent rounded-xl"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeStep === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-accent mb-4">Personal Details</h3>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Name</label>
                            <Input 
                                placeholder="Your full name" 
                                value={formData.fullName}
                                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                className="h-11 bg-background border-accent/10 rounded-xl text-xs"
                            />
                        </div>

                        {!isSmallStudent && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">About You (Bio)</label>
                                <textarea 
                                    className="w-full h-24 bg-background border border-accent/10 rounded-xl p-3 text-sm focus:border-accent outline-none transition-colors custom-scrollbar"
                                    placeholder="Tell us a bit about yourself..."
                                    value={formData.bio}
                                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <MapPin className={cn("w-3 h-3", formData.city ? "text-green-500" : "text-muted-foreground")} /> City *
                                </label>
                                <Input 
                                    placeholder="e.g. Kigali" 
                                    value={formData.city}
                                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                    required
                                    className="h-11 bg-background border-accent/10 rounded-xl text-xs"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sector</label>
                                <Input 
                                    placeholder="e.g. Nyarugenge" 
                                    value={formData.sector}
                                    onChange={(e) => setFormData(prev => ({ ...prev, sector: e.target.value }))}
                                    className="h-11 bg-background border-accent/10 rounded-xl text-xs"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cell</label>
                                <Input 
                                    placeholder="e.g. Kimisagara" 
                                    value={formData.cell}
                                    onChange={(e) => setFormData(prev => ({ ...prev, cell: e.target.value }))}
                                    className="h-11 bg-background border-accent/10 rounded-xl text-xs"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Village</label>
                                <Input 
                                    placeholder="e.g. Karama" 
                                    value={formData.village}
                                    onChange={(e) => setFormData(prev => ({ ...prev, village: e.target.value }))}
                                    className="h-11 bg-background border-accent/10 rounded-xl text-xs"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Skills (Comma separated)</label>
                            <Input 
                                placeholder="React, Node.js, Design" 
                                value={formData.skills.join(", ")}
                                onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value.split(",").map(s => s.trim()) }))}
                                className="h-11 bg-background border-accent/10 rounded-xl text-xs"
                            />
                        </div>
                    </div>
                )}

                {activeStep === 2 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-accent mb-4">Professional Presence</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">LinkedIn URL</label>
                                <Input 
                                    placeholder="linkedin.com/in/username" 
                                    value={formData.linkedinUrl}
                                    onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                                    className="h-12 bg-background border-accent/10 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">GitHub URL</label>
                                <Input 
                                    placeholder="github.com/username" 
                                    value={formData.githubUrl}
                                    onChange={(e) => setFormData(prev => ({ ...prev, githubUrl: e.target.value }))}
                                    className="h-12 bg-background border-accent/10 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Portfolio URL</label>
                                <Input 
                                    placeholder="portfolio.com" 
                                    value={formData.portfolioUrl}
                                    onChange={(e) => setFormData(prev => ({ ...prev, portfolioUrl: e.target.value }))}
                                    className="h-12 bg-background border-accent/10 rounded-xl"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-4 pt-4">
                {activeStep > 0 && (
                    <Button 
                        type="button" 
                        variant="outline"
                        onClick={prevStep}
                        className="flex-1 h-12 rounded-xl border-accent/20 font-bold uppercase tracking-widest"
                    >
                        Back
                    </Button>
                )}
                
                {activeStep < steps.length - 1 ? (
                    <Button 
                        type="button" 
                        onClick={nextStep}
                        className="flex-[2] h-12 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-bold uppercase tracking-widest"
                    >
                        Next Step
                    </Button>
                ) : (
                    <Button 
                        type="submit" 
                        className="flex-[2] h-12 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-black uppercase tracking-widest shadow-lg shadow-accent/20"
                    >
                        Get Started
                    </Button>
                )}
            </div>
        </form>
    );
}

// --- Preview Component ---
function ProfilePreview({ data, isNotEnrolled }: { data: any, isNotEnrolled: boolean }) {
    return (
        <div className="hidden lg:block w-[380px] h-fit sticky top-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-accent/20 to-purple-500/20 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                
                <div className="relative bg-card border border-accent/20 rounded-[2rem] overflow-hidden shadow-2xl">
                    <div className="h-24 bg-gradient-to-br from-accent/80 to-accent relative">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                        <div className="absolute -bottom-10 left-8">
                            <div className="w-20 h-20 rounded-2xl bg-background border-4 border-card flex items-center justify-center shadow-xl">
                                <User className="w-10 h-10 text-accent" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-14 p-8 space-y-6">
                        <div>
                            <h4 className="text-xl font-black tracking-tight">Student Profile</h4>
                            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Live Preview</p>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-accent/5 border border-accent/10 space-y-3">
                                <div className="flex items-center gap-2 text-accent">
                                    <GraduationCap className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Education</span>
                                </div>
                                {isNotEnrolled ? (
                                    <p className="text-sm font-bold text-muted-foreground italic">Not currently enrolled</p>
                                ) : (
                                    <div className="space-y-1">
                                        <p className="text-sm font-black">{data.school || "Your School Name"}</p>
                                        <p className="text-xs text-muted-foreground font-medium">
                                            {data.educationLevel ? data.educationLevel.charAt(0).toUpperCase() + data.educationLevel.slice(1) : "Level"} 
                                            {data.academicYear ? ` • ${data.academicYear}` : ""}
                                        </p>
                                        {data.fieldOfStudy && (
                                            <p className="text-xs text-accent font-bold mt-1">{data.fieldOfStudy}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <MapPin className="w-3 h-3" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Location</span>
                                    </div>
                                    <p className="text-xs font-bold truncate">{data.city || "Kigali"}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <Sparkles className="w-3 h-3" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Top Skill</span>
                                    </div>
                                    <p className="text-xs font-bold truncate">{data.skills?.[0] || "Learning"}</p>
                                </div>
                            </div>

                            {data.bio && (
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">About</span>
                                    <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3 italic">
                                        "{data.bio}"
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                {data.linkedinUrl && <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center"><LinkIcon className="w-4 h-4 text-accent" /></div>}
                                {data.githubUrl && <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"><LinkIcon className="w-4 h-4 text-muted-foreground" /></div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface WizardProps {
    initialData?: any;
    onComplete: (data: any) => void;
    externalToken?: string;
    onBack?: () => void;
    onDismiss?: () => void;
}

export function ProfileCompletionWizard({ initialData, onComplete, externalToken, onBack, onDismiss }: WizardProps) {
    const [liveData, setLiveData] = useState(initialData || {});
    
    return (
        <div className="relative w-full max-w-6xl flex flex-col lg:flex-row items-start justify-center gap-12 p-4">
            {/* Form Container */}
            <div className="w-full max-w-[550px] bg-card border border-accent/20 rounded-[2.5rem] shadow-2xl shadow-accent/10 overflow-hidden animate-in zoom-in-95 duration-500">
                <div className="p-8 md:p-10 space-y-8">
                    <div className="absolute top-0 right-0 p-12 -mr-16 -mt-16 bg-accent/10 rounded-full blur-3xl w-64 h-64 -z-10" />
                    
                    <div className="space-y-3">
                        <div className="flex items-center gap-4">
                            {onBack && (
                                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center cursor-pointer hover:bg-accent/20 transition-colors" onClick={onBack}>
                                    <ArrowLeft className="w-5 h-5 text-accent" />
                                </div>
                            )}
                            <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center shadow-inner">
                                <GraduationCap className="w-8 h-8 text-accent" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-black font-heading tracking-tight">Complete Your Profile</h2>
                        <p className="text-muted-foreground font-medium text-sm leading-relaxed max-w-xs">
                            Finalize your academic details to unlock the full potential of your dashboard.
                        </p>
                    </div>



                    <ProfileCompletionForm 
                        initialData={initialData} 
                        onComplete={onComplete}
                        externalToken={externalToken}
                        onChange={setLiveData}
                    />
                </div>
            </div>

            {/* Preview Panel */}
            <ProfilePreview data={liveData} isNotEnrolled={liveData.school === "N/A"} />
        </div>
    );
}

export function ProfileCompletionGuard({ children }: { children: React.ReactNode }) {
    const { user, updateUser } = useAuth();
    const { data, loading, refetch } = useQuery(GET_ME, {
        skip: !user || user.role !== 'student' || user.isFirst === false,
        fetchPolicy: 'network-only' // Ensure we get fresh isFirst status if we DO query
    }) as any;

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [profileData, setProfileData] = useState<any>(null);
    const [hasSubmitted, setHasSubmitted] = useState(false);

    useEffect(() => {
        // PRIORITY CHECK: If AuthContext already knows onboarding is done, don't show anything
        if (user?.role === 'student' && user?.isFirst === false) {
            console.log("[ProfileGuard] Local session confirms onboarding done. Hiding.");
            setIsDialogOpen(false);
            return;
        }

        if (!loading && data?.me && !hasSubmitted) {
            const profile = data.me.studentProfile;
            const isFirst = data.me.isFirst;
            
            console.log("[ProfileGuard] Query response:", { isFirst, isComplete: profile?.isComplete });

            // Only show if isFirst is explicitly true in BOTH places (or if query says true)
            if (isFirst === true && (!profile || !profile.isComplete)) {
                console.log("[ProfileGuard] Triggering wizard");
                setIsDialogOpen(true);
                // Merge base user data (bio, fullName) into the initial data for the form
                setProfileData({ 
                    ...profile, 
                    bio: profile?.bio || data.me.bio || "",
                    fullName: data.me.fullName || ""
                });
            } else {
                console.log("[ProfileGuard] Skipping wizard - isFirst is not true or profile is complete");
                setIsDialogOpen(false);
            }
        }
    }, [data, loading, hasSubmitted]);

    const handleComplete = () => {
        toast.success("Profile completed successfully!");
        setHasSubmitted(true);
        setIsDialogOpen(false);
        updateUser({ isFirst: false });
        refetch();
    };
    const [dismissOnboarding] = useMutation(UPDATE_USER);

    const handleDismiss = async () => {
        try {
            await dismissOnboarding({
                variables: {
                    id: data.me.id,
                    isFirst: false
                }
            });
            updateUser({ isFirst: false });
            setIsDialogOpen(false);
            refetch();
        } catch (error) {
            console.error("Failed to dismiss onboarding:", error);
            setIsDialogOpen(false); // Close anyway
        }
    };
    if (loading) return null;

    if (isDialogOpen) {
        return (
            <div className="fixed inset-0 z-[999] bg-background flex items-center justify-center p-4 overflow-y-auto custom-scrollbar">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--accent-glow),transparent_50%)] opacity-20 pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,var(--accent-glow),transparent_50%)] opacity-10 pointer-events-none" />
                
                <ProfileCompletionWizard 
                    initialData={profileData} 
                    onComplete={handleComplete} 
                />
            </div>
        );
    }

    return <>{children}</>;
}
