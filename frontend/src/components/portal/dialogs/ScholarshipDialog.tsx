import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  GraduationCap, BookOpen, Loader2, Search, User, Award, CheckCheck,
  Users, X, Check, AlertTriangle, ChevronDown, ChevronRight, ListChecks, MapPin
} from "lucide-react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  GET_ALL_STUDENTS, GET_COURSES_SUMMARY, GET_INTERNSHIP_PROGRAMS,
  GET_ALL_SCHOLARSHIPS, GET_SCHOLARSHIP_STATS
} from "@/lib/graphql/queries";
import { GRANT_BATCH_SCHOLARSHIPS } from "@/lib/graphql/mutations";

interface ScholarshipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "students" | "items" | "review";

export function ScholarshipDialog({ open, onOpenChange }: ScholarshipDialogProps) {
  const [step, setStep] = useState<Step>("students");
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [scholarshipType, setScholarshipType] = useState<"course" | "internship">("course");
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState("");
  const [searchStudents, setSearchStudents] = useState("");
  const [searchItems, setSearchItems] = useState("");
  const [grantedLatitude, setGrantedLatitude] = useState<number | null>(null);
  const [grantedLongitude, setGrantedLongitude] = useState<number | null>(null);
  const [grantedCity, setGrantedCity] = useState<string | null>(null);
  const [grantedCountry, setGrantedCountry] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Detect admin's browser location on mount
  useEffect(() => {
    if (open && typeof navigator !== 'undefined' && navigator.geolocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          setGrantedLatitude(pos.coords.latitude);
          setGrantedLongitude(pos.coords.longitude);
          setLocationLoading(false);
          // Reverse geocode using free API
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&addressdetails=1`, {
              signal: AbortSignal.timeout(5000),
            });
            const geo = await res.json();
            if (geo.address) {
              setGrantedCity(geo.address.city || geo.address.town || geo.address.village || geo.address.county || '');
              setGrantedCountry(geo.address.country || '');
            }
          } catch (e) {
            // Silent fail
          }
        },
        () => setLocationLoading(false),
        { enableHighAccuracy: false, timeout: 10000 }
      );
    }
  }, [open]);

  const { data: studentsData, loading: studentsLoading } = useQuery(GET_ALL_STUDENTS);
  const { data: coursesData, loading: coursesLoading } = useQuery(GET_COURSES_SUMMARY, {
    variables: { limit: 200 },
    skip: scholarshipType !== "course",
  });
  const { data: programsData, loading: programsLoading } = useQuery(GET_INTERNSHIP_PROGRAMS, {
    variables: { limit: 200 },
    skip: scholarshipType !== "internship",
  });

  const [grantBatch, { loading: granting }] = useMutation(GRANT_BATCH_SCHOLARSHIPS, {
    refetchQueries: [
      { query: GET_ALL_SCHOLARSHIPS },
      { query: GET_SCHOLARSHIP_STATS },
    ],
    onCompleted: (data: any) => {
      const count = data?.grantBatchScholarships || 0;
      toast.success(`${count} scholarship${count !== 1 ? 's' : ''} granted successfully!`);
      handleClose();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to grant scholarships");
    },
  });

  const students = (studentsData as any)?.getAllStudents || [];
  const courses = (coursesData as any)?.courses?.items || [];
  const programs = (programsData as any)?.internshipPrograms?.items || [];
  const items = scholarshipType === "course" ? courses : programs;
  const itemsLoading = scholarshipType === "course" ? coursesLoading : programsLoading;

  const filteredStudents = useMemo(() =>
    students.filter((s: any) =>
      !searchStudents ||
      s.username?.toLowerCase().includes(searchStudents.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchStudents.toLowerCase()) ||
      s.fullName?.toLowerCase().includes(searchStudents.toLowerCase())
    ), [students, searchStudents]
  );

  const filteredItems = useMemo(() =>
    items.filter((item: any) =>
      !searchItems ||
      item.title?.toLowerCase().includes(searchItems.toLowerCase())
    ), [items, searchItems]
  );

  const toggleStudent = (id: string) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllStudents = () => {
    if (selectedStudentIds.size === filteredStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredStudents.map((s: any) => s.id)));
    }
  };

  const toggleItem = (id: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllItems = () => {
    if (selectedItemIds.size === filteredItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(filteredItems.map((i: any) => i.id)));
    }
  };

  const handleNext = () => {
    if (step === "students") {
      if (selectedStudentIds.size === 0) {
        toast.error("Please select at least one student");
        return;
      }
      setStep("items");
    } else if (step === "items") {
      if (selectedItemIds.size === 0) {
        toast.error("Please select at least one item");
        return;
      }
      setStep("review");
    }
  };

  const handleSubmit = async () => {
    if (selectedStudentIds.size === 0 || selectedItemIds.size === 0) return;

    const selectedItems = items.filter((i: any) => selectedItemIds.has(i.id));
    const itemTitles = selectedItems.map((i: any) => i.title || 'Unknown');

    await grantBatch({
      variables: {
        userIds: Array.from(selectedStudentIds),
        type: scholarshipType,
        itemIds: Array.from(selectedItemIds),
        itemTitles,
        reason: reason || undefined,
        grantedLatitude: grantedLatitude ?? undefined,
        grantedLongitude: grantedLongitude ?? undefined,
        grantedCity: grantedCity ?? undefined,
        grantedCountry: grantedCountry ?? undefined,
      },
    });
  };

  const handleClose = () => {
    setStep("students");
    setSelectedStudentIds(new Set());
    setScholarshipType("course");
    setSelectedItemIds(new Set());
    setReason("");
    setSearchStudents("");
    setSearchItems("");
    onOpenChange(false);
  };

  const selectedStudents = students.filter((s: any) => selectedStudentIds.has(s.id));
  const selectedItems = items.filter((i: any) => selectedItemIds.has(i.id));
  const totalCombinations = selectedStudentIds.size * selectedItemIds.size;

  const steps = [
    { key: "students", label: "Students", icon: Users },
    { key: "items", label: "Items", icon: scholarshipType === "course" ? BookOpen : GraduationCap },
    { key: "review", label: "Review", icon: Award },
  ] as const;
  const currentIdx = steps.findIndex(s => s.key === step);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-border/50 bg-card/95 backdrop-blur-xl">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-accent" />
            Grant Scholarships
          </DialogTitle>
          <DialogDescription>
            {step === "students" && "Select students to grant scholarships"}
            {step === "items" && `Select ${scholarshipType === "course" ? "courses" : "internship programs"} to grant`}
            {step === "review" && "Review and confirm scholarship grants"}
          </DialogDescription>

          {/* Progress steps */}
          <div className="flex items-center gap-2 mt-3">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              const isActive = idx === currentIdx;
              const isComplete = idx < currentIdx;
              return (
                <div key={s.key} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? "bg-accent/15 text-accent border border-accent/30"
                      : isComplete
                      ? "bg-green-500/10 text-green-500 border border-green-500/20"
                      : "bg-muted/20 text-muted-foreground border border-transparent"
                  }`}>
                    {isComplete ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Icon className="w-3 h-3" />
                    )}
                    <span>{s.label}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
                  )}
                </div>
              );
            })}
          </div>
        </DialogHeader>

        <div className="flex-1 px-6 py-2 overflow-y-auto min-h-[300px]">
          {/* ── STEP 1: SELECT STUDENTS ── */}
          {step === "students" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students by name or email..."
                    value={searchStudents}
                    onChange={(e) => setSearchStudents(e.target.value)}
                    className="pl-10 bg-muted/20 border-none h-10"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllStudents}
                  className="h-10 text-xs gap-1.5 whitespace-nowrap"
                >
                  <ListChecks className="w-3.5 h-3.5" />
                  {selectedStudentIds.size === filteredStudents.length ? "Deselect All" : "Select All"}
                </Button>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>{filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}</span>
                <span className="font-medium text-accent">{selectedStudentIds.size} selected</span>
              </div>

              <ScrollArea className="h-[300px] pr-2 -mr-2">
                <div className="space-y-1">
                  {studentsLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-accent" />
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground italic text-sm">
                      {searchStudents ? "No students match your search" : "No students available"}
                    </div>
                  ) : (
                    filteredStudents.map((student: any) => {
                      const isSelected = selectedStudentIds.has(student.id);
                      return (
                        <label
                          key={student.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? "border-accent/40 bg-accent/8"
                              : "border-border/20 hover:border-border/40 bg-muted/3 hover:bg-muted/10"
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleStudent(student.id)}
                            className="data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                          />
                          <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {student.fullName || student.username}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {student.email}
                            </p>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-accent shrink-0" />
                          )}
                        </label>
                      );
                    })
                  )}
                </div>
              </ScrollArea>

              {selectedStudentIds.size > 0 && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-accent/5 border border-accent/20 text-xs text-muted-foreground">
                  <CheckCheck className="w-3.5 h-3.5 text-accent" />
                  <span><strong className="text-accent">{selectedStudentIds.size}</strong> student{selectedStudentIds.size !== 1 ? 's' : ''} selected</span>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: SELECT ITEMS ── */}
          {step === "items" && (
            <div className="space-y-4">
              {/* Type toggle */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { setScholarshipType("course"); setSelectedItemIds(new Set()); }}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    scholarshipType === "course"
                      ? "border-accent bg-accent/10"
                      : "border-border/30 hover:border-border/60"
                  }`}
                >
                  <BookOpen className={`w-5 h-5 ${scholarshipType === "course" ? "text-accent" : "text-muted-foreground"}`} />
                  <div className="text-left">
                    <p className="text-sm font-bold">Course</p>
                    <p className="text-[10px] text-muted-foreground">Full free access</p>
                  </div>
                </button>
                <button
                  onClick={() => { setScholarshipType("internship"); setSelectedItemIds(new Set()); }}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    scholarshipType === "internship"
                      ? "border-accent bg-accent/10"
                      : "border-border/30 hover:border-border/60"
                  }`}
                >
                  <GraduationCap className={`w-5 h-5 ${scholarshipType === "internship" ? "text-accent" : "text-muted-foreground"}`} />
                  <div className="text-left">
                    <p className="text-sm font-bold">Internship</p>
                    <p className="text-[10px] text-muted-foreground">Free or partial</p>
                  </div>
                </button>
              </div>

              {/* Search + Select All */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={`Search ${scholarshipType === "course" ? "courses" : "programs"}...`}
                    value={searchItems}
                    onChange={(e) => setSearchItems(e.target.value)}
                    className="pl-10 bg-muted/20 border-none h-10"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllItems}
                  className="h-10 text-xs gap-1.5 whitespace-nowrap"
                >
                  <ListChecks className="w-3.5 h-3.5" />
                  {selectedItemIds.size === filteredItems.length ? "Deselect All" : "Select All"}
                </Button>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>{filteredItems.length} {scholarshipType === "course" ? "courses" : "programs"}</span>
                <span className="font-medium text-accent">{selectedItemIds.size} selected</span>
              </div>

              {/* Items list */}
              <ScrollArea className="h-[250px] pr-2 -mr-2 border border-border/20 rounded-xl p-2">
                <div className="space-y-1">
                  {itemsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-accent" />
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground text-sm italic">
                      No {scholarshipType === "course" ? "courses" : "programs"} available
                    </p>
                  ) : (
                    filteredItems.map((item: any) => {
                      const isSelected = selectedItemIds.has(item.id);
                      const price = scholarshipType === "course"
                        ? (item.discountPrice || item.price)
                        : (item.price || 0);
                      return (
                        <label
                          key={item.id}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? "bg-accent/10 border border-accent/30"
                              : "hover:bg-muted/20 border border-transparent"
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleItem(item.id)}
                            className="data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {price > 0 ? `${price.toLocaleString()} RWF` : "Free"}
                            </p>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-accent shrink-0" />
                          )}
                        </label>
                      );
                    })
                  )}
                </div>
              </ScrollArea>

              {selectedItemIds.size > 0 && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-accent/5 border border-accent/20 text-xs text-muted-foreground">
                  <CheckCheck className="w-3.5 h-3.5 text-accent" />
                  <span><strong className="text-accent">{selectedItemIds.size}</strong> {scholarshipType === "course" ? "course" : "program"}{selectedItemIds.size !== 1 ? 's' : ''} selected</span>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: REVIEW ── */}
          {step === "review" && (
            <div className="space-y-5 py-2">
              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-accent" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Students</span>
                  </div>
                  <p className="text-2xl font-bold">{selectedStudentIds.size}</p>
                  <ScrollArea className="h-[100px] mt-2 pr-1">
                    <div className="space-y-1.5">
                      {selectedStudents.map((s: any) => (
                        <div key={s.id} className="flex items-center gap-2 text-xs">
                          <User className="w-3 h-3 text-accent/60 shrink-0" />
                          <span className="truncate">{s.fullName || s.username}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
                  <div className="flex items-center gap-2 mb-2">
                    {scholarshipType === "course" ? (
                      <BookOpen className="w-4 h-4 text-accent" />
                    ) : (
                      <GraduationCap className="w-4 h-4 text-accent" />
                    )}
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {scholarshipType === "course" ? "Courses" : "Programs"}
                    </span>
                  </div>
                  <p className="text-2xl font-bold">{selectedItemIds.size}</p>
                  <ScrollArea className="h-[100px] mt-2 pr-1">
                    <div className="space-y-1.5">
                      {selectedItems.map((i: any) => (
                        <div key={i.id} className="flex items-center gap-2 text-xs">
                          {scholarshipType === "course" ? (
                            <BookOpen className="w-3 h-3 text-blue-400/60 shrink-0" />
                          ) : (
                            <GraduationCap className="w-3 h-3 text-purple-400/60 shrink-0" />
                          )}
                          <span className="truncate">{i.title}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              {/* Combinations info */}
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">
                      {totalCombinations} scholarship{totalCombinations !== 1 ? 's' : ''} will be created
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Each selected student will receive a scholarship for each selected item. 
                      Existing active scholarships will be skipped.
                    </p>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label>Reason (optional)</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Merit-based academic scholarship, Financial aid..."
                  className="min-h-[60px] resize-none bg-muted/10 border-border/30"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-border/30 bg-muted/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handleClose} disabled={granting}>
              Cancel
            </Button>
            {(grantedLatitude || locationLoading) && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 text-accent" />
                {locationLoading ? (
                  <span>Detecting location...</span>
                ) : (
                  <span>{[grantedCity, grantedCountry].filter(Boolean).join(', ') || `${grantedLatitude?.toFixed(4)}, ${grantedLongitude?.toFixed(4)}`}</span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {step !== "students" && (
              <Button
                variant="outline"
                onClick={() => {
                  if (step === "items") setStep("students");
                  if (step === "review") setStep("items");
                }}
                disabled={granting}
              >
                Back
              </Button>
            )}
            {step === "review" ? (
              <Button
                variant="gold"
                onClick={handleSubmit}
                disabled={totalCombinations === 0 || granting}
                className="min-w-[180px]"
              >
                {granting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Granting...</>
                ) : (
                  <><Award className="w-4 h-4 mr-2" /> Grant {totalCombinations} Scholarship{totalCombinations !== 1 ? 's' : ''}</>
                )}
              </Button>
            ) : (
              <Button
                variant="gold"
                onClick={handleNext}
                className="min-w-[120px]"
              >
                Continue
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
