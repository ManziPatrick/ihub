import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_COURSES, GET_CODE_EXERCISE_ANSWERS } from "@/lib/graphql/queries";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PortalLayout } from "@/components/portal/PortalLayout";
import {
  Code,
  Search,
  User,
  ChevronDown,
  ChevronRight,
  Clock,
  BookOpen,
  FileCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface CodeAnswerRecord {
  userId: string;
  username: string;
  email: string;
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  exerciseId: string;
  exerciseTitle: string;
  code: string;
  submittedAt: string;
}

export default function AdminCodeExerciseAnswers() {
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: coursesData } = useQuery(GET_COURSES, {
    variables: { limit: 200 },
  });

  const { data: answersData, loading } = useQuery<{
    getCodeExerciseAnswers: CodeAnswerRecord[];
  }>(GET_CODE_EXERCISE_ANSWERS, {
    variables: { courseId: selectedCourseId },
    skip: !selectedCourseId,
    fetchPolicy: "network-only",
  });

  const courses = (coursesData as any)?.courses?.items || [];
  const allRecords = answersData?.getCodeExerciseAnswers || [];

  // Group records by student then by exercise
  const groupedByStudent = useMemo(() => {
    const map = new Map<
      string,
      {
        userId: string;
        username: string;
        email: string;
        records: CodeAnswerRecord[];
        lessonTitles: Set<string>;
        exerciseTitles: Set<string>;
      }
    >();

    for (const record of allRecords) {
      const key = record.userId;
      if (!map.has(key)) {
        map.set(key, {
          userId: record.userId,
          username: record.username,
          email: record.email,
          records: [],
          lessonTitles: new Set(),
          exerciseTitles: new Set(),
        });
      }
      const entry = map.get(key)!;
      entry.records.push(record);
      if (record.lessonTitle) entry.lessonTitles.add(record.lessonTitle);
      entry.exerciseTitles.add(record.exerciseTitle);
    }

    // Filter by search term
    const filtered = Array.from(map.values()).filter((entry) => {
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        entry.username.toLowerCase().includes(q) ||
        entry.email.toLowerCase().includes(q) ||
        Array.from(entry.exerciseTitles).some((t) =>
          t.toLowerCase().includes(q)
        ) ||
        Array.from(entry.lessonTitles).some((t) =>
          t.toLowerCase().includes(q)
        )
      );
    });

    return filtered;
  }, [allRecords, searchTerm]);

  const selectedCourse = courses.find(
    (c: any) => c.id === selectedCourseId
  );

  return (
    <PortalLayout>
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Code className="w-6 h-6 text-primary" />
            Code Exercise Answers
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Inspect saved code answers submitted by students
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-[10px]">
            {allRecords.length} total answers
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {groupedByStudent.length} students
          </Badge>
        </div>
      </motion.div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1.5 block">
                Select Course
              </label>
              <Select
                value={selectedCourseId}
                onValueChange={setSelectedCourseId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a course..." />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course: any) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1.5 block">
                Search Students
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or exercise..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {!selectedCourseId && (
        <div className="text-center py-16 text-muted-foreground">
          <Code className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">Select a course to view student answers</p>
          <p className="text-xs mt-1">
            Choose a course from the dropdown above
          </p>
        </div>
      )}

      {loading && (
        <div className="text-center py-16 text-muted-foreground">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-medium">Loading answers...</p>
        </div>
      )}

      {selectedCourseId && !loading && groupedByStudent.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <FileCode className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">No code exercise answers found</p>
          <p className="text-xs mt-1">
            Students haven't submitted any code answers for this course yet
          </p>
        </div>
      )}

      {/* Student List */}
      {groupedByStudent.length > 0 && (
        <div className="space-y-4">
          {groupedByStudent.map((student) => (
            <Collapsible key={student.userId}>
              <Card className="border-border/50 overflow-hidden">
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between p-4 hover:bg-muted/5 transition-colors text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">
                          {student.username}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {student.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge
                        variant="outline"
                        className="text-[9px] font-bold"
                      >
                        {student.records.length} answer
                        {student.records.length !== 1 ? "s" : ""}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[9px] font-bold"
                      >
                        {student.exerciseTitles.size} exercise
                        {student.exerciseTitles.size !== 1 ? "s" : ""}
                      </Badge>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t border-border/30 divide-y divide-border/20">
                    {student.records.map((record, idx) => (
                      <div key={idx} className="p-4 space-y-3">
                        {/* Exercise Metadata */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                variant="outline"
                                className="text-[9px] font-bold text-purple-400 bg-purple-400/10 border-purple-400/30"
                              >
                                <FileCode className="w-3 h-3 mr-1" />
                                {record.exerciseTitle}
                              </Badge>
                              {record.lessonTitle && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] font-bold text-blue-400 bg-blue-400/10 border-blue-400/30"
                                >
                                  <BookOpen className="w-3 h-3 mr-1" />
                                  {record.lessonTitle}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {record.submittedAt && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                              <Clock className="w-3 h-3" />
                              {new Date(record.submittedAt).toLocaleString()}
                            </div>
                          )}
                        </div>

                        {/* Code Display */}
                        <div className="relative rounded-xl overflow-hidden border border-border/50 bg-[#0d0f1a]">
                          <div className="flex items-center justify-between px-4 py-2 bg-[#12132a] border-b border-white/5">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500/80" />
                              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                              <div className="w-3 h-3 rounded-full bg-green-500/80" />
                              <span className="ml-3 text-[10px] font-bold uppercase tracking-widest text-green-400">
                                Student Code
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px]"
                              onClick={() => {
                                navigator.clipboard.writeText(record.code);
                              }}
                            >
                              Copy
                            </Button>
                          </div>
                          <div className="p-4 overflow-auto max-h-64">
                            <pre className="text-sm font-mono text-green-400 whitespace-pre-wrap break-all">
                              {record.code || "(no code submitted)"}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
    </PortalLayout>
  );
}
