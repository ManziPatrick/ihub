import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { CREATE_EVENT, UPDATE_EVENT } from "@/lib/graphql/mutations";
import { GET_EVENTS } from "@/lib/graphql/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editEvent?: any | null;
}

const EVENT_TYPES = [
  "bootcamp", "workshop", "conference", "seminar", "meetup", "hackathon", "webinar", "other"
];

const STATUS_OPTIONS = ["draft", "published", "cancelled", "completed"];

export function CreateEventDialog({ open, onOpenChange, editEvent }: CreateEventDialogProps) {
  const [form, setForm] = useState({
    title: editEvent?.title || "",
    description: editEvent?.description || "",
    shortDescription: editEvent?.shortDescription || "",
    type: editEvent?.type || "workshop",
    startDate: editEvent?.startDate ? new Date(editEvent.startDate).toISOString().slice(0, 16) : "",
    endDate: editEvent?.endDate ? new Date(editEvent.endDate).toISOString().slice(0, 16) : "",
    timezone: editEvent?.timezone || "Africa/Kigali",
    location: editEvent?.location || "",
    isOnline: editEvent?.isOnline ?? false,
    meetingLink: editEvent?.meetingLink || "",
    image: editEvent?.image || "",
    price: editEvent?.price ?? 0,
    currency: editEvent?.currency || "RWF",
    maxAttendees: editEvent?.maxAttendees ?? 0,
    organizerName: editEvent?.organizerName || "",
    organizerBio: editEvent?.organizerBio || "",
    organizerPhoto: editEvent?.organizerPhoto || "",
    tags: editEvent?.tags || [],
    status: editEvent?.status || "draft",
    featured: editEvent?.featured ?? false,
  });
  const [tagInput, setTagInput] = useState("");

  const [createEvent, { loading: creating }] = useMutation(CREATE_EVENT, {
    refetchQueries: ['GetEvents'],
  });

  const [updateEvent, { loading: updating }] = useMutation(UPDATE_EVENT, {
    refetchQueries: ['GetEvents'],
  });

  const isEditing = !!editEvent;
  const isLoading = creating || updating;

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !form.tags.includes(trimmed)) {
      setForm({ ...form, tags: [...form.tags, trimmed] });
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setForm({ ...form, tags: form.tags.filter((t: string) => t !== tag) });
  };

  const handleSubmit = async () => {
    if (!form.title || !form.startDate || !form.endDate) return;

    const variables = {
      ...form,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      price: form.price || 0,
      maxAttendees: form.maxAttendees || 0,
    };

    try {
      if (isEditing) {
        await updateEvent({ variables: { id: editEvent.id, ...variables } });
      } else {
        await createEvent({ variables });
      }
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to save event:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Event" : "Create Event"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the event details below." : "Fill in the details to create a new event."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label>Title *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event title" />
          </div>

          {/* Type & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type *</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date *</Label>
              <Input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <Label>End Date *</Label>
              <Input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>

          {/* Short Description */}
          <div>
            <Label>Short Description</Label>
            <Textarea value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} placeholder="Brief summary (max 300 chars)" maxLength={300} />
          </div>

          {/* Full Description */}
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Full event description (HTML supported)" className="min-h-[120px]" />
          </div>

          {/* Location & Online */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Kigali, Rwanda" />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isOnline} onChange={(e) => setForm({ ...form, isOnline: e.target.checked })} className="rounded" />
                <span className="text-sm font-medium">Online Event</span>
              </label>
            </div>
          </div>

          {/* Meeting Link */}
          {form.isOnline && (
            <div>
              <Label>Meeting Link</Label>
              <Input value={form.meetingLink} onChange={(e) => setForm({ ...form, meetingLink: e.target.value })} placeholder="https://meet.google.com/..." />
            </div>
          )}

          {/* Price & Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Price</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} placeholder="0 = Free" />
            </div>
            <div>
              <Label>Currency</Label>
              <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} placeholder="RWF" />
            </div>
          </div>

          {/* Max Attendees */}
          <div>
            <Label>Max Attendees (0 = unlimited)</Label>
            <Input type="number" value={form.maxAttendees} onChange={(e) => setForm({ ...form, maxAttendees: parseInt(e.target.value) || 0 })} />
          </div>

          {/* Image */}
          <div>
            <Label>Image URL</Label>
            <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." />
          </div>

          {/* Timezone */}
          <div>
            <Label>Timezone</Label>
            <Input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} placeholder="Africa/Kigali" />
          </div>

          {/* Organizer */}
          <div className="border-t border-border/30 pt-4">
            <h4 className="text-sm font-semibold mb-3">Organizer Info</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Organizer Name</Label>
                <Input value={form.organizerName} onChange={(e) => setForm({ ...form, organizerName: e.target.value })} />
              </div>
              <div>
                <Label>Organizer Photo URL</Label>
                <Input value={form.organizerPhoto} onChange={(e) => setForm({ ...form, organizerPhoto: e.target.value })} />
              </div>
            </div>
            <div className="mt-3">
              <Label>Organizer Bio</Label>
              <Textarea value={form.organizerBio} onChange={(e) => setForm({ ...form, organizerBio: e.target.value })} />
            </div>
          </div>

          {/* Tags */}
          <div className="border-t border-border/30 pt-4">
            <Label>Tags</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Type a tag and press Enter"
              />
              <Button type="button" variant="outline" onClick={addTag} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                    {tag} <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Featured */}
          <label className="flex items-center gap-2 cursor-pointer pt-2">
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="rounded" />
            <span className="text-sm font-medium">Featured Event</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border/30">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading || !form.title || !form.startDate || !form.endDate}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditing ? "Update Event" : "Create Event"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
