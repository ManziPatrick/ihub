import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_EVENTS } from "@/lib/graphql/queries";
import { DELETE_EVENT } from "@/lib/graphql/mutations";
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery";
import { CreateEventDialog } from "@/components/portal/dialogs/CreateEventDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  Loader2,
  Plus,
  Search,
  Pencil,
  Trash2,
  Calendar,
  Globe,
  MapPin,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  published: "bg-green-500/10 text-green-500",
  draft: "bg-yellow-500/10 text-yellow-500",
  cancelled: "bg-red-500/10 text-red-500",
  completed: "bg-blue-500/10 text-blue-500",
};

const LIMIT = 10;

export default function AdminEvents() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editEvent, setEditEvent] = useState<any | null>(null);

  const { data, loading } = usePaginatedQuery(GET_EVENTS, {
    variables: {
      page,
      limit: LIMIT,
      search: search || undefined,
    },
  });

  const [deleteEvent] = useMutation(DELETE_EVENT, {
    refetchQueries: ['GetEvents'],
  });

  const events = (data as any)?.events?.items || [];
  const pagination = (data as any)?.events?.pagination;

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      await deleteEvent({ variables: { id } });
      toast.success("Event deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete event");
    }
  };

  const handleEdit = (event: any) => {
    setEditEvent(event);
    setShowDialog(true);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Events</h1>
          <p className="text-sm text-muted-foreground">Manage bootcamps, workshops, and events</p>
        </div>
        <Button onClick={() => { setEditEvent(null); setShowDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Create Event
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search events..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p>No events found</p>
            <Button variant="outline" className="mt-4" onClick={() => { setEditEvent(null); setShowDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Create your first event
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event: any) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="line-clamp-1">{event.title}</span>
                      {event.featured && (
                        <Badge variant="secondary" className="text-[10px] bg-accent/10 text-accent border-0">
                          Featured
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{event.type}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`text-[11px] border-0 ${STATUS_COLORS[event.status] || "bg-gray-500/10 text-gray-500"}`}
                    >
                      {event.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(event.startDate)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {event.isOnline ? (
                        <Globe className="w-3 h-3" />
                      ) : (
                        <MapPin className="w-3 h-3" />
                      )}
                      {event.location || (event.isOnline ? "Online" : "-")}
                    </span>
                  </TableCell>
                  <TableCell>
                    {event.price === 0 ? "Free" : `${event.price.toLocaleString()}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8"
                        onClick={() => navigate(`/events/${event.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8"
                        onClick={() => handleEdit(event)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        onClick={() => handleDelete(event.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <PaginationBar
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          hasNextPage={pagination.hasNextPage}
          hasPreviousPage={pagination.hasPreviousPage}
          onPageChange={setPage}
          isLoading={loading}
          pageSize={LIMIT}
          onPageSizeChange={() => {}}
        />
      )}

      {/* Create/Edit Dialog */}
      <CreateEventDialog
        open={showDialog}
        onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) setEditEvent(null);
        }}
        editEvent={editEvent}
      />
    </div>
  );
}
