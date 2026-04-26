import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Upload,
    Loader2,
    Link as LinkIcon,
    FileText,
    Video,
    Globe,
    ArrowRight,
    Check,
    Cloud,
} from "lucide-react";
import { useMutation } from "@apollo/client/react";
import { CREATE_RESOURCE } from "@/lib/graphql/mutations";
import { GET_RESOURCES } from "@/lib/graphql/queries";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getApiBaseUrl, getGraphqlUrl } from "@/lib/env";

interface AddResourceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    linkedTo?: string;
    onModel?: string;
    onSuccess?: () => void;
}

export function AddResourceDialog({ open, onOpenChange, linkedTo, onModel, onSuccess }: AddResourceDialogProps) {
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const [type, setType] = useState<"video" | "pdf" | "drive" | "link">("link");
    const [source, setSource] = useState<"cloudinary" | "google_drive" | "external">("external");
    const [uploading, setUploading] = useState(false);

    const [createResource, { loading }] = useMutation(CREATE_RESOURCE, {
        refetchQueries: [{ query: GET_RESOURCES, variables: { linkedTo, onModel } }],
        onCompleted: () => {
            toast.success("Resource added successfully!");
            onOpenChange(false);
            resetForm();
            if (onSuccess) onSuccess();
        },
        onError: (err) => {
            toast.error(err.message || "Failed to add resource");
        }
    });

    const resetForm = () => {
        setTitle("");
        setUrl("");
        setType("link");
        setSource("external");
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file); // Current backend uses 'image' field for all uploads

        try {
            // Use the GRAPHQL_URL from environment or fallback
            const graphqlUrl = getGraphqlUrl(); // This line was added as per instruction, though its direct use here is not shown in the instruction's snippet.
            const API_BASE_URL = getApiBaseUrl();
            const response = await fetch(`${API_BASE_URL}/api/upload/image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('ihub_token')}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            setUrl(data.url);
            setSource("cloudinary");

            // Auto-detect type from file extension
            if (file.type.includes('pdf')) setType('pdf');
            else if (file.type.includes('video')) setType('video');
            else setType('link');

            toast.success("File uploaded to Cloudinary!");
        } catch (err) {
            toast.error("Failed to upload file");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !url) {
            toast.error("Title and URL are required");
            return;
        }

        await createResource({
            variables: {
                input: {
                    title,
                    url,
                    type,
                    source,
                    linkedTo,
                    onModel,
                    visibility: "public"
                }
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <LinkIcon className="w-5 h-5 text-accent" />
                        Add Learning Resource
                    </DialogTitle>
                    <DialogDescription>
                        Attach a resource from your computer, Google Drive, or the web.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="external" onValueChange={(v) => setSource(v as any)} className="w-full">
                    <TabsList className="grid grid-cols-3 w-full">
                        <TabsTrigger value="external">External</TabsTrigger>
                        <TabsTrigger value="cloudinary">Upload</TabsTrigger>
                        <TabsTrigger value="google_drive">Drive</TabsTrigger>
                    </TabsList>

                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="res-title">Title</Label>
                            <Input
                                id="res-title"
                                placeholder="E.g. React Hooks Deep Dive"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <TabsContent value="external" className="space-y-4 mt-0">
                            <div className="space-y-2">
                                <Label htmlFor="res-url">External URL</Label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="res-url"
                                        className="pl-9"
                                        placeholder="https://youtube.com/..."
                                        value={source === "external" ? url : ""}
                                        onChange={(e) => {
                                            setUrl(e.target.value);
                                            setSource("external");
                                        }}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="cloudinary" className="space-y-4 mt-0">
                            <div className="space-y-2">
                                <Label>File Upload</Label>
                                <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 hover:bg-muted/50 transition-colors cursor-pointer relative bg-muted/20">
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleUpload}
                                        disabled={uploading}
                                    />
                                    {uploading ? (
                                        <Loader2 className="w-8 h-8 animate-spin text-accent" />
                                    ) : url && source === "cloudinary" ? (
                                        <div className="flex flex-col items-center text-green-500">
                                            <Check className="w-8 h-8" />
                                            <span className="text-xs mt-1">Uploaded!</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Cloud className="w-8 h-8 text-muted-foreground mb-2" />
                                            <span className="text-sm font-medium">Click to upload (Cloudinary)</span>
                                            <span className="text-xs text-muted-foreground">PDF, Video, Docs up to 10MB</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="google_drive" className="space-y-4 mt-0">
                            <div className="space-y-2">
                                <Label htmlFor="drive-url">Google Drive Link</Label>
                                <div className="relative">
                                    <Cloud className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                                    <Input
                                        id="drive-url"
                                        className="pl-9"
                                        placeholder="Paste share link here..."
                                        value={source === "google_drive" ? url : ""}
                                        onChange={(e) => {
                                            setUrl(e.target.value);
                                            setSource("google_drive");
                                            setType("drive");
                                        }}
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground italic">
                                    Ensure the file/folder is set to "Anyone with the link can view".
                                </p>
                            </div>
                        </TabsContent>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Resource Type</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={type}
                                    onChange={(e) => setType(e.target.value as any)}
                                >
                                    <option value="link">Website/Article</option>
                                    <option value="video">Video</option>
                                    <option value="pdf">PDF Document</option>
                                    <option value="drive">Google Drive</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Visibility</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    defaultValue="public"
                                >
                                    <option value="public">Public</option>
                                    <option value="interns_only">Interns Only</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="gold"
                                className="flex-1"
                                disabled={loading || uploading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4 mr-2" />
                                        Save Resource
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
