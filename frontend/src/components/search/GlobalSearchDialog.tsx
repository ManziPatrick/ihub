import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import {
  BookOpen,
  Users,
  Briefcase,
  Loader2,
  ArrowRight,
  SearchX,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  GET_COURSES_SUMMARY,
  GET_TRAINERS_PUBLIC,
  GET_INTERNSHIP_PROGRAMS,
} from "@/lib/graphql/queries";
import { useTranslation } from "react-i18next";

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MIN_CHARS = 2;
const SEARCH_LIMIT = 4;

export function GlobalSearchDialog({ open, onOpenChange }: GlobalSearchDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  const active = debounced.trim().length >= MIN_CHARS;

  useEffect(() => {
    if (!open) {
      setQuery("");
      setDebounced("");
    }
  }, [open]);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(id);
  }, [query]);

  const search = active ? debounced : undefined;

  const { data: coursesData, loading: coursesLoading } = useQuery(GET_COURSES_SUMMARY, {
    variables: { page: 1, limit: SEARCH_LIMIT, search },
    skip: !active,
    fetchPolicy: "no-cache",
  });

  const { data: trainersData, loading: trainersLoading } = useQuery(GET_TRAINERS_PUBLIC, {
    variables: { page: 1, limit: SEARCH_LIMIT, search },
    skip: !active,
    fetchPolicy: "no-cache",
  });

  const { data: programsData, loading: programsLoading } = useQuery(GET_INTERNSHIP_PROGRAMS, {
    variables: { page: 1, limit: SEARCH_LIMIT, search },
    skip: !active,
    fetchPolicy: "no-cache",
  });

  const loading = active && (coursesLoading || trainersLoading || programsLoading);

  const courses = (coursesData as any)?.courses?.items || [];
  const trainers = (trainersData as any)?.trainers?.items || [];
  const programs = (programsData as any)?.internshipPrograms?.items || [];
  const total = courses.length + trainers.length + programs.length;

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const goAll = (tab?: string) => {
    const params = new URLSearchParams();
    params.set("q", debounced);
    if (tab) params.set("tab", tab);
    go(`/explore?${params.toString()}`);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} shouldFilter={false}>
      <CommandInput
        placeholder={t("nav.searchCourses")}
        value={query}
        onValueChange={setQuery}
        autoFocus
      />
      <CommandList>
        {!active && (
          <div className="py-8 text-center text-sm text-muted-foreground px-4">
            <Users className="w-6 h-6 mx-auto mb-2 text-muted-foreground/40" />
            {t("nav.searchHint")}
          </div>
        )}

        {active && loading && (
          <div className="py-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> {t("common.searching")}
          </div>
        )}

        {active && !loading && total === 0 && (
          <CommandEmpty>
            <SearchX className="w-6 h-6 mx-auto mb-2 text-muted-foreground/40" />
            {t("nav.noResults")}
          </CommandEmpty>
        )}

        {active && !loading && courses.length > 0 && (
          <CommandGroup heading={`${t("nav.courses")} (${courses.length})`}>
            {courses.map((c: any) => (
              <CommandItem
                key={c.id}
                value={`course-${c.title}`}
                onSelect={() => go(`/courses/${c.id}`)}
                className="gap-3"
              >
                <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-muted">
                  {c.thumbnail ? (
                    <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{c.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.category}
                    {c.instructor?.username ? ` · ${c.instructor.username}` : ""}
                  </p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {active && !loading && trainers.length > 0 && (
          <CommandGroup heading={`${t("nav.trainers")} (${trainers.length})`}>
            {trainers.map((tr: any) => (
              <CommandItem
                key={tr.id}
                value={`trainer-${tr.fullName || tr.username}`}
                onSelect={() => go(`/trainer/${tr.id}`)}
                className="gap-3"
              >
                <Avatar className="w-9 h-9 rounded-full shrink-0 ring-1 ring-border/40">
                  <AvatarImage src={tr.avatar} className="w-full h-full object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-accent to-accent/80 text-white text-xs font-bold">
                    {(tr.fullName || tr.username || "T").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{tr.fullName || tr.username}</p>
                  <p className="truncate text-xs text-muted-foreground">{tr.title || tr.bio || tr.location}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {active && !loading && programs.length > 0 && (
          <CommandGroup heading={`${t("nav.programs")} (${programs.length})`}>
            {programs.map((p: any) => (
              <CommandItem
                key={p.id}
                value={`program-${p.title}`}
                onSelect={() => go(`/opportunity/${p.id}`)}
                className="gap-3"
              >
                <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-muted">
                  {p.image ? (
                    <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Briefcase className="w-4 h-4 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{p.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.duration || p.description}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {active && !loading && total > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                value="view-all"
                onSelect={() => goAll()}
                className="gap-2 text-accent font-medium"
              >
                <ArrowRight className="w-4 h-4" />
                {t("nav.viewAllResults")}
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
