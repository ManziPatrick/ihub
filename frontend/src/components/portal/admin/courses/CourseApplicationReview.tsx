import { useState } from 'react';
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_COURSE_APPLICATIONS, GET_ADMIN_DASHBOARD_DATA } from '@/lib/graphql/queries';
import { UPDATE_COURSE_APPLICATION_STATUS } from '@/lib/graphql/mutations';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Check, 
  X, 
  Clock, 
  Mail, 
  BookOpen,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  MapPin,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from "framer-motion";
import { UserDetailsSheet } from '@/components/portal/dialogs/UserDetailsSheet';
import { PaginationBar } from "@/components/ui/pagination-bar";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { cn } from "@/lib/utils";
import { usePageFetching } from "@/lib/hooks/usePageFetching";

export default function CourseApplicationReview() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const pageSize = 10;
  
  const { data, loading, error, refetch } = useQuery(GET_COURSE_APPLICATIONS, {
    variables: { status: filter, page: currentPage, limit: pageSize },
  });
  
  const [updateStatus] = useMutation(UPDATE_COURSE_APPLICATION_STATUS, {
    refetchQueries: [{ query: GET_COURSE_APPLICATIONS }, { query: GET_ADMIN_DASHBOARD_DATA }]
  });
  
  const handleStatusUpdate = async (e: React.MouseEvent, id: string, status: string) => {
    e.stopPropagation();
    try {
      await updateStatus({
        variables: { applicationId: id, status }
      });
      toast.success(`Application updated to ${status}`);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-500/10 text-green-600 border-green-500/20 font-black uppercase tracking-wider text-[10px]">Approved</Badge>;
      case 'rejected': return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 font-black uppercase tracking-wider text-[10px]">Rejected</Badge>;
      default: return <Badge variant="secondary" className="font-black uppercase tracking-wider text-[10px]">Pending</Badge>;
    }
  };

  const getPaymentBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-black px-1.5"><DollarSign className="w-3 h-3 mr-0.5" />Paid</Badge>;
      case 'unpaid':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-black px-1.5"><DollarSign className="w-3 h-3 mr-0.5" />Unpaid</Badge>;
      case 'free':
        return <Badge variant="outline" className="bg-sky-500/10 text-sky-600 border-sky-500/20 text-[10px] font-black px-1.5">Free</Badge>;
      default:
        return null;
    }
  };

  const { fetchingPage, startPageFetch } = usePageFetching(loading, data);
  if (loading) return (
    <ListSkeleton count={6} />
  );
  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
        <X className="w-7 h-7 text-destructive" />
      </div>
      <div>
        <p className="font-bold text-foreground">Failed to load applications</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">{error.message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  const applications = (data as any)?.courseApplications?.items || [];
  const pagination = (data as any)?.courseApplications?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-foreground">Course Applications</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Review and approve students for application-based courses</p>
        </div>
        <div className="flex gap-1 bg-muted/50 p-1 rounded-xl border border-border/50">
          {['pending', 'approved', 'rejected'].map((s) => (
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

      <div className={cn("grid gap-4 transition-opacity duration-300", fetchingPage && "opacity-40")}>
        {applications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 bg-muted/20 rounded-3xl border border-dashed border-border/50">
            <Clock className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-bold italic">No {filter} course applications found.</p>
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
                  <div 
                    className="flex items-center gap-4 cursor-pointer group/user hover:opacity-80 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedUser(app.user);
                    }}
                  >
                    <Avatar className="w-12 h-12 border-2 border-border/50 group-hover/user:border-accent/50 transition-colors">
                      <AvatarImage src={app.user?.avatar} />
                      <AvatarFallback className="bg-accent/10 text-accent font-black">
                        {app.user?.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-black text-lg text-foreground group-hover/user:text-accent transition-colors">
                          {app.user?.fullName || app.user?.username || 'Unknown User'}
                        </h3>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {getStatusBadge(app.status)}
                          {getPaymentBadge(app.paymentStatus)}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <BookOpen className="w-3.5 h-3.5 text-accent/60" />
                          {app.course?.title || 'Deleted Course'}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5 text-accent/60" />
                          {(() => {
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
                    {app.status === 'pending' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-9 rounded-xl text-green-600 border-green-500/20 hover:bg-green-500/10 font-black text-[11px] uppercase tracking-wider gap-1.5"
                          onClick={(e) => handleStatusUpdate(e, app.id, 'approved')}
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-9 rounded-xl text-red-600 border-red-500/20 hover:bg-red-500/10 font-black text-[11px] uppercase tracking-wider gap-1.5"
                          onClick={(e) => handleStatusUpdate(e, app.id, 'rejected')}
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </Button>
                      </>
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
                    <div className="p-6 space-y-6 bg-muted/20">
                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-accent">Student Details</h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <span className="font-bold">{app.user?.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="font-bold">{app.user?.fullName || 'No full name'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-accent">Application Answers</h4>
                          <div className="space-y-4">
                            {app.applicationAnswers?.map((ans: any, idx: number) => (
                              <div key={idx} className="space-y-1">
                                <p className="text-xs font-black text-foreground/80">{ans.questionLabel}</p>
                                <div className="p-3 bg-background/50 rounded-xl border border-border/30 text-xs text-muted-foreground whitespace-pre-wrap">
                                  {ans.answer}
                                </div>
                              </div>
                            ))}
                            {(!app.applicationAnswers || app.applicationAnswers.length === 0) && (
                              <p className="text-xs text-muted-foreground italic">No answers provided.</p>
                            )}
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

      <PaginationBar
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalCount={pagination.totalCount}
        hasPreviousPage={pagination.hasPreviousPage}
        hasNextPage={pagination.hasNextPage}
        onPageChange={(p) => { startPageFetch(); setCurrentPage(p); }}
        isLoading={loading || fetchingPage}
      />
      {/* Profile Detail Sheet */}
      <UserDetailsSheet
        open={!!selectedUser}
        onOpenChange={(open) => !open && setSelectedUser(null)}
        user={selectedUser}
      />
    </div>
  );
}
