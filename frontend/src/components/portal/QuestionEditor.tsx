import { useState } from "react";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

const CREATE_QUESTION = gql`
  mutation CreateQuestion($courseId: ID!, $type: String, $questionText: String!, $options: [String!]!, $correctOptionIndex: Int!, $explanation: String) {
    createQuestion(courseId: $courseId, type: $type, questionText: $questionText, options: $options, correctOptionIndex: $correctOptionIndex, explanation: $explanation) {
      id
      questionText
    }
  }
`;

const UPDATE_QUESTION = gql`
  mutation UpdateQuestion($id: ID!, $type: String, $questionText: String, $options: [String!], $correctOptionIndex: Int, $explanation: String) {
    updateQuestion(id: $id, type: $type, questionText: $questionText, options: $options, correctOptionIndex: $correctOptionIndex, explanation: $explanation) {
      id
      questionText
    }
  }
`;

interface QuestionEditorProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: string;
    questionToEdit?: any; // If provided, we are in edit mode
    onSuccess: () => void;
}

export function QuestionEditor({ isOpen, onClose, courseId, questionToEdit, onSuccess }: QuestionEditorProps) {
    const [type, setType] = useState(questionToEdit?.type || "multiple_choice");
    const [questionText, setQuestionText] = useState(questionToEdit?.questionText || "");
    const [options, setOptions] = useState<string[]>(questionToEdit?.options?.length ? questionToEdit.options : ["", "", "", ""]);
    const [correctOptionIndex, setCorrectOptionIndex] = useState(questionToEdit?.correctOptionIndex || 0);
    const [explanation, setExplanation] = useState(questionToEdit?.explanation || "");

    const [createQuestion, { loading: creating }] = useMutation(CREATE_QUESTION);
    const [updateQuestion, { loading: updating }] = useMutation(UPDATE_QUESTION);

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const addOption = () => {
        setOptions([...options, ""]);
    };

    const removeOption = (index: number) => {
        if (options.length <= 2) {
            toast.error("A question must have at least 2 options");
            return;
        }
        const newOptions = options.filter((_, i) => i !== index);
        setOptions(newOptions);
        if (correctOptionIndex >= index && correctOptionIndex > 0) {
            setCorrectOptionIndex(correctOptionIndex - 1);
        }
    };

    const handleSubmit = async () => {
        if (!questionText.trim()) {
            toast.error("Please enter a question text");
            return;
        }
        if (type === 'multiple_choice' && options.some(opt => !opt.trim())) {
            toast.error("Please fill in all options");
            return;
        }

        try {
            if (questionToEdit) {
                await updateQuestion({
                    variables: {
                        id: questionToEdit.id,
                        type,
                        questionText,
                        options: type === 'open_ended' ? [] : options,
                        correctOptionIndex: type === 'open_ended' ? 0 : correctOptionIndex,
                        explanation
                    }
                });
                toast.success("Question updated successfully");
            } else {
                await createQuestion({
                    variables: {
                        courseId,
                        type,
                        questionText,
                        options: type === 'open_ended' ? [] : options,
                        correctOptionIndex: type === 'open_ended' ? 0 : correctOptionIndex,
                        explanation
                    }
                });
                toast.success("Question created successfully");
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.message || "Failed to save question");
        }
    };

    const isLoading = creating || updating;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{questionToEdit ? "Edit Question" : "Add New Question"}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label>Question Type</Label>
                        <RadioGroup value={type} onValueChange={setType} className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="multiple_choice" id="t-mc" />
                                <Label htmlFor="t-mc">Multiple Choice</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="open_ended" id="t-oe" />
                                <Label htmlFor="t-oe">Open Ended</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                        <Label>Question Text</Label>
                        <Textarea
                            placeholder="e.g., What does HTML stand for?"
                            value={questionText}
                            onChange={(e) => setQuestionText(e.target.value)}
                        />
                    </div>

                    {type === 'multiple_choice' && (
                        <div className="space-y-3">
                            <Label>Options</Label>
                            <RadioGroup value={correctOptionIndex.toString()} onValueChange={(val) => setCorrectOptionIndex(parseInt(val))}>
                                {options.map((option, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <RadioGroupItem value={index.toString()} id={`opt-${index}`} />
                                        <Input
                                            value={option}
                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                            placeholder={`Option ${index + 1}`}
                                            className="flex-1"
                                        />
                                        <Button variant="ghost" size="icon" onClick={() => removeOption(index)} disabled={options.length <= 2}>
                                            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </RadioGroup>
                            <Button variant="outline" size="sm" onClick={addOption} className="mt-2">
                                <Plus className="w-3 h-3 mr-2" /> Add Option
                            </Button>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Explanation (Optional)</Label>
                        <Textarea
                            placeholder="Explain why the answer is correct or expected format..."
                            value={explanation}
                            onChange={(e) => setExplanation(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isLoading} className="bg-accent hover:bg-accent/90">
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Question
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
