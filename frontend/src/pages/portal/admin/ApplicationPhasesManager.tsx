import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMutation, useQuery } from '@apollo/client/react';
import { GET_APPLICATION_PHASES } from '@/lib/graphql/queries';
import { CREATE_APPLICATION_PHASE } from '@/lib/graphql/mutations';

export const ApplicationPhasesManager = ({ programId }: { programId: string }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    order: 0,
    enableApproval: true,
    isInterviewPhase: false,
    allowMeetingScheduling: false,
  });

  const { data, refetch } = useQuery<{ getApplicationPhases: any[] }>(GET_APPLICATION_PHASES, { variables: { programId } });
  const [createPhase] = useMutation(CREATE_APPLICATION_PHASE, {
    onCompleted: () => {
      setFormData({ name: '', description: '', order: 0, enableApproval: true, isInterviewPhase: false, allowMeetingScheduling: false });
      refetch();
    },
  });

  const handleSubmit = () => {
    if (!formData.name) return;
    createPhase({ variables: { programId, ...formData } });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Phase</CardTitle>
          <CardDescription>Add a new phase to this internship program</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Phase name (e.g., Application, Interview, Offer)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isInterviewPhase}
                onChange={(e) => setFormData({ ...formData, isInterviewPhase: e.target.checked })}
              />
              Interview Phase
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.allowMeetingScheduling}
                onChange={(e) => setFormData({ ...formData, allowMeetingScheduling: e.target.checked })}
              />
              Allow Meetings
            </label>
          </div>
          <Button onClick={handleSubmit}>Create Phase</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Program Phases ({data?.getApplicationPhases.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data?.getApplicationPhases.map((phase: any) => (
              <div key={phase.id} className="p-3 border rounded-lg">
                <p className="font-semibold">
                  {phase.order}. {phase.name}
                </p>
                <p className="text-sm text-gray-600">{phase.description}</p>
                {phase.isInterviewPhase && <span className="text-xs bg-blue-100 px-2 py-1 rounded">Interview</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
