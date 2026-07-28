import React, { useState } from 'react';
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_INTERNSHIP_PROGRAMS, GET_ADMIN_DASHBOARD_DATA } from '@/lib/graphql/queries';
import { UPDATE_INTERNSHIP_PROGRAM_NEW, DELETE_INTERNSHIP_PROGRAM_NEW } from '@/lib/graphql/mutations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Edit2, Trash2, Save, X, Tag, Users, Calendar,
  ChevronRight, Clock, CheckCircle, AlertCircle, Lock, Percent
} from 'lucide-react';
import { toast } from 'sonner';

// Robust date formatter that handles both ISO strings and timestamps
const formatDate = (raw: any) => {
  if (!raw) return 'TBD';
  // MongoDB timestamps are sometimes returned as numeric strings or numbers
  const ts = Number(raw);
  const date = isNaN(ts) ? new Date(raw) : new Date(ts);
  if (isNaN(date.getTime())) return 'TBD';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const STATUS_CONFIG: Record<string, { label: string; color: string; next: string; icon: React.ReactNode }> = {
  upcoming: {
    label: 'Upcoming',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    next: 'active',
    icon: <Clock className="w-3 h-3" />,
  },
  active: {
    label: 'Open',
    color: 'bg-green-500/10 text-green-600 border-green-500/20',
    next: 'closed',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  closed: {
    label: 'Closed',
    color: 'bg-muted text-muted-foreground border-border/50',
    next: 'upcoming',
    icon: <Lock className="w-3 h-3" />,
  },
  inactive: {
    label: 'Inactive',
    color: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    next: 'active',
    icon: <AlertCircle className="w-3 h-3" />,
  },
};

interface EditState {
  price: string;
  discount: string;
  maxSpots: string;
}

export default function ProgramList() {
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ price: '', discount: '', maxSpots: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12; // Grid layout usually looks better with 3 or 4 columns, so 12 is a good multiple

  const { data, loading, error, refetch } = useQuery(GET_INTERNSHIP_PROGRAMS, {
    variables: { page: currentPage, limit: pageSize }
  });

  const [updateProgram, { loading: isSaving }] = useMutation(UPDATE_INTERNSHIP_PROGRAM_NEW, {
    refetchQueries: [{ query: GET_INTERNSHIP_PROGRAMS }, { query: GET_ADMIN_DASHBOARD_DATA }],
    onCompleted: () => {
      toast.success('Program updated');
      setEditingId(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const [deleteProgram] = useMutation(DELETE_INTERNSHIP_PROGRAM_NEW, {
    refetchQueries: [{ query: GET_INTERNSHIP_PROGRAMS }, { query: GET_ADMIN_DASHBOARD_DATA }],
    onCompleted: () => { toast.success('Program deleted'); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (error) return <div className="text-destructive p-4">Error loading programs: {error.message}</div>;

  const programs = (data as any)?.internshipPrograms?.items || [];
  const pagination = (data as any)?.internshipPrograms?.pagination;

  const handleStatusCycle = (program: any) => {
    const config = STATUS_CONFIG[program.status] || STATUS_CONFIG.active;
    updateProgram({ variables: { id: program.id, status: config.next } });
  };

  const startEdit = (program: any) => {
    setEditingId(program.id);
    setEditState({
      price: String(program.price ?? 0),
      discount: String(program.discount ?? 0),
      maxSpots: String(program.maxSpots ?? 0),
    });
  };

  const handleSaveEdit = (programId: string) => {
    updateProgram({
      variables: {
        id: programId,
        price: parseFloat(editState.price) || 0,
        discount: parseFloat(editState.discount) || 0,
        maxSpots: parseInt(editState.maxSpots) || 0,
      },
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      deleteProgram({ variables: { id } });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-foreground">Programs</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{programs.length} program{programs.length !== 1 ? 's' : ''} total</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/portal/admin/internships/create')} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="w-4 h-4" />
            New Program
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {programs.map((program: any) => {
          const statusCfg = STATUS_CONFIG[program.status] || STATUS_CONFIG.active;
          const isEditing = editingId === program.id;
          const discountedPrice = program.price > 0 && program.discount > 0
            ? program.price * (1 - program.discount / 100)
            : null;

          return (
            <div
              key={program.id}
              className="group relative flex flex-col rounded-3xl border border-border/50 bg-card overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
            >
              {/* Thumbnail / Hero */}
              <div className="relative aspect-video bg-gradient-to-br from-accent/10 to-accent/5 overflow-hidden">
                {program.image ? (
                  <img
                    src={program.image}
                    alt={program.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl font-black text-accent/20 uppercase tracking-widest">
                      {program.title?.charAt(0)}
                    </span>
                  </div>
                )}

                {/* Status badge — click to cycle */}
                <button
                  onClick={() => handleStatusCycle(program)}
                  title="Click to change status"
                  className={`absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider cursor-pointer hover:scale-105 transition-transform ${statusCfg.color}`}
                >
                  {statusCfg.icon}
                  {statusCfg.label}
                  <ChevronRight className="w-3 h-3 opacity-60" />
                </button>

                {/* Spots badge */}
                {program.maxSpots > 0 && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-background/90 border border-border/50 text-[10px] font-black text-foreground">
                    <Users className="w-3 h-3 text-accent" />
                    {program.maxSpots} spots
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="flex flex-col flex-1 p-5 space-y-4">
                <div>
                  <h3 className="font-black text-base leading-tight text-foreground line-clamp-2">{program.title}</h3>
                  <p className="text-[11px] text-muted-foreground font-medium mt-1">{program.duration}</p>
                </div>

                {/* Dates */}
                <div className="space-y-1.5 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span>Starts: <strong className="text-foreground">{formatDate(program.startDate)}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span>Apply by: <strong className="text-foreground">{formatDate(program.applicationDeadline)}</strong></span>
                  </div>
                </div>

                {/* Program Stats Summary */}
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 p-3 bg-muted/30 rounded-2xl border border-border/30">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Applications</span>
                    <span className="text-sm font-black text-foreground">{program.stats?.totalApplications || 0}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Enrolled</span>
                    <span className="text-sm font-black text-foreground">{program.stats?.enrolledStudents || 0}</span>
                  </div>
                  <div className="flex flex-col col-span-2">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Total Revenue</span>
                    <span className="text-sm font-black text-accent">{program.stats?.totalRevenue?.toLocaleString() || 0} RWF</span>
                  </div>
                </div>

                {/* Price / Discount display or edit */}
                {isEditing ? (
                  <div className="space-y-3 bg-muted/20 rounded-2xl p-4 border border-border/40">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Edit Pricing & Spots</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" /> Price (RWF)
                        </label>
                        <Input
                          type="number"
                          value={editState.price}
                          onChange={(e) => setEditState(s => ({ ...s, price: e.target.value }))}
                          className="h-9 text-sm bg-background border-border/40 rounded-xl"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <Percent className="w-2.5 h-2.5" /> Discount %
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={editState.discount}
                          onChange={(e) => setEditState(s => ({ ...s, discount: e.target.value }))}
                          className="h-9 text-sm bg-background border-border/40 rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Users className="w-2.5 h-2.5" /> Max Spots (0 = unlimited)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={editState.maxSpots}
                        onChange={(e) => setEditState(s => ({ ...s, maxSpots: e.target.value }))}
                        className="h-9 text-sm bg-background border-border/40 rounded-xl"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="flex-1 h-9 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5"
                        onClick={() => handleSaveEdit(program.id)}
                        disabled={isSaving}
                      >
                        <Save className="w-3.5 h-3.5" />
                        {isSaving ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 rounded-xl px-3"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      {program.price > 0 ? (
                        <div className="space-y-0.5">
                          {discountedPrice ? (
                            <div className="flex items-baseline gap-2">
                              <span className="text-lg font-black text-foreground">
                                {Math.round(discountedPrice).toLocaleString()} RWF
                              </span>
                              <span className="text-xs text-muted-foreground line-through">
                                {program.price.toLocaleString()}
                              </span>
                              <Badge className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20 font-black px-2">
                                -{program.discount}%
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-lg font-black text-foreground">
                              {program.price.toLocaleString()} <span className="text-[11px] text-muted-foreground font-medium">RWF</span>
                            </span>
                          )}
                        </div>
                      ) : (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20 font-black">Free</Badge>
                      )}
                    </div>
                    <button
                      onClick={() => startEdit(program)}
                      className="p-2 rounded-xl text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors"
                      title="Edit price, discount & spots"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Actions */}
                {!isEditing && (
                  <div className="flex gap-2 pt-1 border-t border-border/30">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9 rounded-xl text-[11px] font-bold gap-1.5"
                      onClick={() => handleStatusCycle(program)}
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                      → {STATUS_CONFIG[STATUS_CONFIG[program.status]?.next || 'active']?.label || 'Next Status'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 px-3 rounded-xl text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(program.id, program.title)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination UI */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-2">
            Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} programs)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={!pagination.hasPreviousPage}
              className="h-9 w-9 p-0 rounded-xl"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, i, arr) => {
                  const showEllipsis = i > 0 && p - arr[i - 1] > 1;
                  return (
                    <div key={p} className="flex items-center">
                      {showEllipsis && <span className="px-1 text-muted-foreground">...</span>}
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
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {programs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border/50 rounded-3xl">
          <AlertCircle className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-lg font-bold text-muted-foreground">No programs yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Create your first program to get started.</p>            <Button className="mt-6 gap-2 bg-accent text-accent-foreground" onClick={() => navigate('/portal/admin/internships/create')}>
            <Plus className="w-4 h-4" />
            Create Program
          </Button>
        </div>
      )}
    </div>
  );
}
