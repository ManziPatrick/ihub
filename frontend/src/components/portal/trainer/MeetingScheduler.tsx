import React, { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { SCHEDULE_MEETING } from '@/lib/graphql/mutations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Video, Calendar, Clock } from 'lucide-react';

interface MeetingSchedulerProps {
  internshipId: string;
  onSuccess?: () => void;
}

export const MeetingScheduler: React.FC<MeetingSchedulerProps> = ({ internshipId, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [type, setType] = useState('1on1');
  const [url, setUrl] = useState('');

  const [scheduleMeeting, { loading }] = useMutation(SCHEDULE_MEETING, {
    onCompleted: () => {
      toast.success("Meeting scheduled successfully!");
      setTitle('');
      setDate('');
      setTimeStr('');
      setUrl('');
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !timeStr) {
      toast.error("Please fill in the meeting title, date, and time.");
      return;
    }

    const meetingTime = new Date(`${date}T${timeStr}`).toISOString();

    scheduleMeeting({
      variables: {
        internshipId,
        title,
        time: meetingTime,
        type,
        url,
        attendees: []
      }
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Video className="w-5 h-5 text-indigo-500" />
          Schedule a Meeting
        </CardTitle>
        <CardDescription>
          Set up a 1-on-1 or group sync for this program.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Meeting Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Sprint 2 Planning"
            />
          </div>
          
          <div className="flex gap-4">
            <div className="space-y-2 flex-1">
              <Label className="flex items-center gap-1"><Calendar className="w-4 h-4"/> Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label className="flex items-center gap-1"><Clock className="w-4 h-4"/> Time</Label>
              <Input
                type="time"
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="space-y-2 flex-1">
              <Label>Type</Label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="1on1">1-on-1</option>
                <option value="group_sync">Group Sync</option>
                <option value="technical_review">Technical Review</option>
              </select>
            </div>
            <div className="space-y-2 flex-1">
              <Label>Meeting Link (URL)</Label>
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://meet.google.com/..."
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Scheduling..." : "Schedule Meeting"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default MeetingScheduler;
