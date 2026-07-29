import { useState } from 'react';
import { useQuery, useMutation } from "@apollo/client/react";
import { CREATE_INTERNSHIP_PROJECT_NEW } from '@/lib/graphql/mutations';
import { GET_INTERNSHIP_PROJECTS_NEW, GET_INTERNSHIP_PROGRAMS } from '@/lib/graphql/queries';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface CreateAgileProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refetch?: () => void;
}

export function CreateAgileProjectDialog({ open, onOpenChange, refetch }: CreateAgileProjectDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    internshipProgramId: '',
    requiredSkills: '',
    minTeamSize: 1,
    maxTeamSize: 5
  });

  const { data: programsData } = useQuery(GET_INTERNSHIP_PROGRAMS);
  const programs = (programsData as any)?.internshipPrograms?.items || [];

  const [createProject, { loading }] = useMutation(CREATE_INTERNSHIP_PROJECT_NEW, {
    onCompleted: () => {
      toast.success('Agile project created successfully');
      onOpenChange(false);
      refetch?.();
      setFormData({
        title: '',
        description: '',
        internshipProgramId: '',
        requiredSkills: '',
        minTeamSize: 1,
        maxTeamSize: 5
      });
    },
    onError: (err) => toast.error(err.message)
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.internshipProgramId) {
      toast.error('Title and Program are required');
      return;
    }
    
    createProject({
      variables: {
        ...formData,
        requiredSkills: formData.requiredSkills.split(',').map(s => s.trim()).filter(s => s !== ''),
        minTeamSize: parseInt(formData.minTeamSize.toString()),
        maxTeamSize: parseInt(formData.maxTeamSize.toString())
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Agile Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Project Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. E-Commerce Platform"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Program</Label>
            <Select 
              value={formData.internshipProgramId} 
              onValueChange={(val) => setFormData({ ...formData, internshipProgramId: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a program" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Project goals and requirements..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">Required Skills (comma separated)</Label>
            <Input
              id="skills"
              value={formData.requiredSkills}
              onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
              placeholder="React, Node.js, MongoDB"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min">Min Team Size</Label>
              <Input
                id="min"
                type="number"
                min="1"
                value={formData.minTeamSize}
                onChange={(e) => setFormData({ ...formData, minTeamSize: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max">Max Team Size</Label>
              <Input
                id="max"
                type="number"
                min="1"
                value={formData.maxTeamSize}
                onChange={(e) => setFormData({ ...formData, maxTeamSize: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-accent hover:bg-accent/90">
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
