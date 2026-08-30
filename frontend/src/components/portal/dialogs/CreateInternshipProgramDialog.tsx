import { useState } from 'react';
import { useMutation } from "@apollo/client/react";
import { CREATE_INTERNSHIP_PROGRAM } from '@/lib/graphql/mutations';
import { GET_INTERNSHIP_PROGRAMS, GET_ADMIN_DASHBOARD_DATA } from '@/lib/graphql/queries';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FileUpload } from '@/components/FileUpload';

interface CreateInternshipProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateInternshipProgramDialog({ open, onOpenChange }: CreateInternshipProgramDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    organization: '',
    organizationLogo: '',
    description: '',
    duration: '3 Months',
    startDate: '',
    endDate: '',
    applicationDeadline: '',
    price: 0,
    currency: 'RWF',
    image: '',
    signerName: '',
    signerSignature: '',
    allowedDeliveryModes: ['online'],
    applicationQuestions: [] as { label: string, type: string, required: boolean, options?: string[], maxFileSize?: number, acceptedFileTypes?: string[] }[]
  });

  const [createProgram, { loading }] = useMutation(CREATE_INTERNSHIP_PROGRAM, {
    refetchQueries: [{ query: GET_INTERNSHIP_PROGRAMS }, { query: GET_ADMIN_DASHBOARD_DATA }],
    onCompleted: () => {
      toast.success('Program created successfully');
      onOpenChange(false);
      setFormData({
        title: '',
        organization: '',
        organizationLogo: '',
        description: '',
        duration: '3 Months',
        startDate: '',
        endDate: '',
        applicationDeadline: '',
        price: 0,
        currency: 'RWF',
        image: '',
        signerName: '',
        signerSignature: '',
        allowedDeliveryModes: ['online'],
        applicationQuestions: []
      });
    },
    onError: (err) => toast.error(err.message)
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProgram({
      variables: {
        ...formData,
        price: parseFloat(formData.price.toString())
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Program</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Program Image</Label>
            {formData.image ? (
              <div className="relative aspect-video rounded-lg overflow-hidden border">
                <img src={formData.image} alt="Program image preview" className="w-full h-full object-cover" />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-7 px-2"
                  onClick={() => setFormData({ ...formData, image: '' })}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <FileUpload
                folder="internships"
                label="Upload Program Image"
                onUploadComplete={(url) => setFormData({ ...formData, image: url })}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Opportunity Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Graphic Design or Web Development"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="organization">Organization / Company / School</Label>
            <Input
              id="organization"
              value={formData.organization}
              onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              placeholder="e.g. Google, University of Rwanda, Bank of Kigali"
            />
            <p className="text-[11px] text-muted-foreground">
              Opportunities from the same organization are grouped together on the Opportunities page.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Organization Logo</Label>
            {formData.organizationLogo ? (
              <div className="relative w-20 h-20 rounded-xl overflow-hidden border bg-card p-1">
                <img src={formData.organizationLogo} alt="Organization logo" className="w-full h-full object-contain" />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-1 -right-1 h-6 px-1.5 text-[9px] rounded-full"
                  onClick={() => setFormData({ ...formData, organizationLogo: '' })}
                >
                  ×
                </Button>
              </div>
            ) : (
              <FileUpload
                folder="organizations"
                label="Upload Organization Logo"
                onUploadComplete={(url) => setFormData({ ...formData, organizationLogo: url })}
              />
            )}
            <p className="text-[11px] text-muted-foreground">
              Optional — shown on the opportunity card so learners recognize the company or school.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell applicants what they will learn..."
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="e.g. 3 Months"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (0 for free)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Application Deadline</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.applicationDeadline}
              onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Delivery Modes</Label>
            <div className="flex flex-col gap-2 border p-3 rounded-md">
              {['online', 'physical', 'hybrid'].map((mode) => (
                <label key={mode} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.allowedDeliveryModes.includes(mode)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const modes = formData.allowedDeliveryModes;
                      setFormData({
                        ...formData,
                        allowedDeliveryModes: checked ? [...modes, mode] : modes.filter(m => m !== mode)
                      });
                    }}
                  />
                  <span className="capitalize">{mode}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border/50">
             <Label className="text-base font-bold">Certificate Configuration</Label>
             <div className="grid grid-cols-1 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="signerName">Signer Full Name</Label>
                 <Input
                   id="signerName"
                   value={formData.signerName}
                   onChange={(e) => setFormData({ ...formData, signerName: e.target.value })}
                   placeholder="e.g. Dr. John Smith"
                 />
               </div>
               <div className="space-y-2">
                 <Label>Signer Signature</Label>
                 {formData.signerSignature ? (
                   <div className="relative h-20 rounded-lg overflow-hidden border bg-white p-2">
                     <img src={formData.signerSignature} className="h-full mx-auto object-contain" />
                     <Button
                       type="button"
                       variant="destructive"
                       size="sm"
                       className="absolute top-1 right-1 h-6 px-1.5 text-[9px]"
                       onClick={() => setFormData({ ...formData, signerSignature: '' })}
                     >
                       Remove
                     </Button>
                   </div>
                 ) : (
                   <FileUpload
                     folder="signatures"
                     label="Upload Signature (PNG)"
                     onUploadComplete={(url) => setFormData({ ...formData, signerSignature: url })}
                   />
                 )}
               </div>
             </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <Label className="text-base font-bold">Custom Application Questions</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData({
                  ...formData,
                  applicationQuestions: [...formData.applicationQuestions, { label: '', type: 'text', required: true, options: [], maxFileSize: 10, acceptedFileTypes: ['.pdf', '.doc', '.docx', '.jpg', '.png'] }]
                })}
              >
                Add Question
              </Button>
            </div>
            
            {formData.applicationQuestions.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                No custom questions added yet.
              </p>
            ) : (
              <div className="space-y-4">
                {formData.applicationQuestions.map((q, idx) => (
                  <div key={idx} className="p-3 bg-muted/30 rounded-lg border border-border/50 space-y-3 relative group">
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-1">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Question Label</Label>
                        <Input
                          value={q.label}
                          onChange={(e) => {
                            const newQs = [...formData.applicationQuestions];
                            newQs[idx].label = e.target.value;
                            setFormData({ ...formData, applicationQuestions: newQs });
                          }}
                          placeholder="e.g. Years of Experience"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="w-24 space-y-1">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Type</Label>
                        <select
                          className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs"
                          value={q.type}
                          onChange={(e) => {
                            const newQs = [...formData.applicationQuestions];
                            newQs[idx].type = e.target.value;
                            setFormData({ ...formData, applicationQuestions: newQs });
                          }}
                        >
                          <option value="text">Short Text</option>
                          <option value="textarea">Long Text</option>
                          <option value="select">Select</option>
                          <option value="radio">Radio</option>
                          <option value="checkbox">Checkbox</option>
                          <option value="file">File Upload</option>
                          <option value="number">Number</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`req-${idx}`}
                          checked={q.required}
                          onChange={(e) => {
                            const newQs = [...formData.applicationQuestions];
                            newQs[idx].required = e.target.checked;
                            setFormData({ ...formData, applicationQuestions: newQs });
                          }}
                          className="w-3 h-3 rounded border-gray-300 text-accent focus:ring-accent"
                        />
                        <Label htmlFor={`req-${idx}`} className="text-xs text-muted-foreground">Required</Label>
                      </div>
                      
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="h-7 px-2 text-[10px]"
                        onClick={() => {
                          const newQs = formData.applicationQuestions.filter((_, i) => i !== idx);
                          setFormData({ ...formData, applicationQuestions: newQs });
                        }}
                      >
                        Remove
                      </Button>
                    </div>

                    {/* Options editor for select/radio/checkbox */}
                    {(q.type === 'select' || q.type === 'radio' || q.type === 'checkbox') && (
                      <div className="space-y-2 pl-2 border-l-2 border-accent/30">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Options</Label>
                        {(q.options || []).map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-1.5">
                            <Input
                              value={opt}
                              onChange={(e) => {
                                const newQs = [...formData.applicationQuestions];
                                if (!newQs[idx].options) newQs[idx].options = [];
                                newQs[idx].options![oi] = e.target.value;
                                setFormData({ ...formData, applicationQuestions: newQs });
                              }}
                              placeholder={`Option ${oi + 1}`}
                              className="h-7 text-xs flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                const newQs = [...formData.applicationQuestions];
                                newQs[idx].options = (newQs[idx].options || []).filter((_, i) => i !== oi);
                                setFormData({ ...formData, applicationQuestions: newQs });
                              }}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10px]"
                          onClick={() => {
                            const newQs = [...formData.applicationQuestions];
                            if (!newQs[idx].options) newQs[idx].options = [];
                            newQs[idx].options!.push('');
                            setFormData({ ...formData, applicationQuestions: newQs });
                          }}
                        >
                          + Add Option
                        </Button>
                      </div>
                    )}

                    {/* File type configuration */}
                    {q.type === 'file' && (
                      <div className="space-y-2 pl-2 border-l-2 border-accent/30">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Max File Size (MB)</Label>
                        <Input
                          type="number"
                          value={q.maxFileSize || 10}
                          onChange={(e) => {
                            const newQs = [...formData.applicationQuestions];
                            newQs[idx].maxFileSize = parseInt(e.target.value) || 10;
                            setFormData({ ...formData, applicationQuestions: newQs });
                          }}
                          className="h-7 text-xs w-24"
                          min={1}
                          max={50}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-accent hover:bg-accent/90">
              {loading ? 'Creating...' : 'Create Program'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
