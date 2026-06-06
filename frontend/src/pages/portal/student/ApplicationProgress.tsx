import React from 'react';
import { useQuery } from '@apollo/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GET_APPLICATION_PROGRESS } from '@/lib/graphql/queries';
import { CheckCircle2, Clock, X } from 'lucide-react';

export const ApplicationProgress = ({ applicationId }: { applicationId: string }) => {
  const { data, loading } = useQuery(GET_APPLICATION_PROGRESS, { variables: { applicationId } });

  if (loading) return <div>Loading...</div>;

  const progress = data?.getApplicationProgress;
  if (!progress) return <div>Application not found</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Application Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Progress Timeline */}
            <div className="space-y-4">
              {progress.completedPhases.map((completion: any, idx: number) => (
                <div key={completion.phaseId} className="flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold">Phase Completed</p>
                    <p className="text-sm text-gray-600">{new Date(completion.completedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}

              {progress.currentPhase && (
                <div className="flex gap-4">
                  <Clock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold">{progress.currentPhase.name}</p>
                    <p className="text-sm text-gray-600">{progress.currentPhase.description}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Performance Grades */}
            {progress.application.performanceGrades?.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Feedback</h3>
                <div className="space-y-2">
                  {progress.application.performanceGrades.map((grade: any) => (
                    <div key={grade.feedbackDate} className={`p-3 rounded-lg ${
                      grade.color === 'green' ? 'bg-green-50' :
                      grade.color === 'yellow' ? 'bg-yellow-50' :
                      'bg-red-50'
                    }`}>
                      <p className="font-semibold capitalize">{grade.feedbackType}: {grade.grade}</p>
                      {grade.notes && <p className="text-sm mt-1">{grade.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
