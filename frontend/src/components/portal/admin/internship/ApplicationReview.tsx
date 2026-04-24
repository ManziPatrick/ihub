import { useState } from 'react';
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_INTERNSHIP_APPLICATIONS, GET_ADMIN_DASHBOARD_DATA } from '@/lib/graphql/queries';
import { REVIEW_INTERNSHIP_APPLICATION } from '@/lib/graphql/mutations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Check, 
  X, 
  Clock, 
  Mail, 
  Phone, 
  Github, 
  Linkedin, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Briefcase,
  GraduationCap,
  MapPin,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from "framer-motion";

export default function ApplicationReview() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const pageSize = 10;
  
  const { data, loading, error, refetch } = useQuery(GET_INTERNSHIP_APPLICATIONS, {
    variables: { status: filter, page: currentPage, limit: pageSize },
    pollInterval: 30000 // auto-refresh every 30 seconds
  });
  
  const [reviewApplication] = useMutation(REVIEW_INTERNSHIP_APPLICATION, {
    refetchQueries: [{ query: GET_INTERNSHIP_APPLICATIONS }, { query: GET_ADMIN_DASHBOARD_DATA }]
  });
  
  const handleStatusUpdate = async (e: React.MouseEvent, id: string, status: string) => {
    e.stopPropagation();
    try {
      await reviewApplication({
        variables: { id, status }
      });
      toast.success(`Application updated to ${status}`);
      refetch();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-500/10 text-green-600 border-green-500/20 font-black uppercase tracking-wider text-[10px]">Approved</Badge>;
      case 'rejected': return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 font-black uppercase tracking-wider text-[10px]">Rejected</Badge>;
      case 'waitlisted': return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-black uppercase tracking-wider text-[10px]">Waitlisted</Badge>;
      default: return <Badge variant="secondary" className="font-black uppercase tracking-wider text-[10px]">Pending</Badge>;
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (error) return <div className="text-destructive p-4">Error loading applications</div>;

  const applications = (data as any)?.internshipApplications?.items || [];
  const pagination = (data as any)?.internshipApplications?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-foreground">Application Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Review and respond to internship candidates</p>
        </div>
        <div className="flex gap-1 bg-muted/50 p-1 rounded-xl border border-border/50">
          {['pending', 'approved', 'waitlisted', 'rejected'].map((s) => (
            <Button
              key={s}
              size="sm"
              variant={filter === s ? 'gold' : 'ghost'}
              onClick={() => { setFilter(s); setExpandedId(null); }}
              className="capitalize text-[11px] font-black tracking-wider h-8 rounded-lg"
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {applications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 bg-muted/20 rounded-3xl border border-dashed border-border/50">
            <Clock className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-bold italic">No {filter} applications found.</p>
          </div>
        )}
        
        {applications.map((app: any) => (
          <Card 
            key={app.id} 
            className={`border-border/50 overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer ${expandedId === app.id ? 'ring-1 ring-accent/30 bg-accent/5' : 'bg-card hover:bg-muted/10'}`}
            onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
          >
            <CardContent className="p-0">
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-14 h-14 border-2 border-border/50">
                      <AvatarImage src={app.user?.avatar} />
                      <AvatarFallback className="bg-accent/10 text-accent font-black">
                        {app.user?.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-background rounded-full flex items-center justify-center border border-border/50 shadow-sm">
                      <Briefcase className="w-2.5 h-2.5 text-accent" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-black text-lg text-foreground">{app.user?.fullName || app.user?.username}</h3>
                      {getStatusBadge(app.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 text-accent/60" />
                        {app.user?.studentProfile?.school || 'University Student'}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5 text-accent/60" />
                        Applied {(() => {
                          try {
                            const date = new Date(!isNaN(Number(app.createdAt)) ? Number(app.createdAt) : app.createdAt);
                            return isNaN(date.getTime()) ? 'Recently' : date.toLocaleDateString();
                          } catch (e) {
                            return 'Recently';
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex gap-2">
                    {app.status !== 'approved' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-9 rounded-xl text-green-600 border-green-500/20 hover:bg-green-500/10 font-black text-[11px] uppercase tracking-wider gap-1.5"
                        onClick={(e) => handleStatusUpdate(e, app.id, 'approved')}
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve
                      </Button>
                    )}
                    {app.status !== 'rejected' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-9 rounded-xl text-red-600 border-red-500/20 hover:bg-red-500/10 font-black text-[11px] uppercase tracking-wider gap-1.5"
                        onClick={(e) => handleStatusUpdate(e, app.id, 'rejected')}
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </Button>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="h-9 w-9 rounded-xl p-0">
                    {expandedId === app.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {expandedId === app.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-border/50"
                  >
                    <div className="p-6 space-y-8 bg-muted/20">
                      {/* Detailed Info Grid */}
                      <div className="grid md:grid-cols-2 gap-8">
                        {/* Left Column: Contact & Profile */}
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-4">Contact Information</h4>
                            <div className="space-y-3">
                              <div className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center border border-border/50">
                                  <Mail className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="text-[10px] text-muted-foreground uppercase font-black">Email</p>
                                  <p className="font-bold">{app.user?.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center border border-border/50">
                                  <Phone className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="text-[10px] text-muted-foreground uppercase font-black">Phone</p>
                                  <p className="font-bold">{app.user?.phone || 'Not provided'}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-4">Professional Links</h4>
                            <div className="flex flex-wrap gap-2">
                              {app.user?.studentProfile?.githubUrl && (
                                <Button variant="outline" size="sm" className="h-9 rounded-xl gap-2 text-xs" asChild>
                                  <a href={app.user.studentProfile.githubUrl} target="_blank" rel="noopener noreferrer">
                                    <Github className="w-3.5 h-3.5" /> GitHub
                                  </a>
                                </Button>
                              )}
                              {app.user?.studentProfile?.linkedinUrl && (
                                <Button variant="outline" size="sm" className="h-9 rounded-xl gap-2 text-xs" asChild>
                                  <a href={app.user.studentProfile.linkedinUrl} target="_blank" rel="noopener noreferrer">
                                    <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                                  </a>
                                </Button>
                              )}
                              {app.portfolioUrl && (
                                <Button variant="outline" size="sm" className="h-9 rounded-xl gap-2 text-xs" asChild>
                                  <a href={app.portfolioUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-3.5 h-3.5" /> Portfolio
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-4">Technical Skills</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {app.skills?.map((skill: string) => (
                                <Badge key={skill} variant="outline" className="bg-background border-border/50 rounded-lg text-[11px] font-bold py-1 px-2.5">
                                  {skill}
                                </Badge>
                              ))}
                              {(!app.skills || app.skills.length === 0) && <span className="text-xs text-muted-foreground italic">No skills listed</span>}
                            </div>
                          </div>
                        </div>

                        {/* Right Column: Application Responses */}
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-4">Application Responses</h4>
                            <div className="space-y-5">
                              {app.applicationAnswers?.map((ans: any, idx: number) => (
                                <div key={idx} className="space-y-1.5">
                                  <p className="text-xs font-black text-foreground/80 leading-tight">{ans.questionLabel}</p>
                                  <div className="p-3 bg-background/50 rounded-2xl border border-border/30 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {ans.answer}
                                  </div>
                                </div>
                              ))}
                              {(!app.applicationAnswers || app.applicationAnswers.length === 0) && (
                                <p className="text-xs text-muted-foreground italic bg-background/30 p-4 rounded-2xl border border-dashed border-border/50 text-center">
                                  No specific application answers provided.
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="p-4 bg-accent/5 rounded-2xl border border-accent/10">
                            <h4 className="text-[9px] font-black uppercase tracking-widest text-accent mb-2">Internal Notes</h4>
                            <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                              Candidate is applying for <span className="text-foreground font-bold">"{app.internshipProgram?.title}"</span>. 
                              Duration: {app.internshipProgram?.duration}. Availability: {app.availability}.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination UI */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-2">
            Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} applications)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={!pagination.hasPreviousPage}
              className="h-9 w-9 p-0 rounded-xl"
            >
              <ChevronDown className="w-4 h-4 rotate-90" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, i, arr) => {
                  const showEllipsis = i > 0 && p - arr[i - 1] > 1;
                  return (
                    <div key={p} className="flex items-center">
                      {showEllipsis && <span className="px-1 text-muted-foreground text-xs">...</span>}
                      <Button
                        variant={currentPage === p ? 'gold' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(p)}
                        className={`h-9 w-9 p-0 rounded-xl ${currentPage === p ? 'pointer-events-none' : ''}`}
                      >
                        {p}
                      </Button>
                    </div>
                  );
                })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
              disabled={!pagination.hasNextPage}
              className="h-9 w-9 p-0 rounded-xl"
            >
              <ChevronDown className="w-4 h-4 -rotate-90" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
