import { useState, useRef } from "react";
import { useLazyQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, File, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const GET_UPLOAD_SIGNATURE = gql`
  query GetUploadSignature($folder: String, $resourceType: String) {
    getUploadSignature(folder: $folder, resourceType: $resourceType) {
      signature
      timestamp
      folder
      cloudName
      apiKey
    }
  }
`;

const SINGLE_UPLOAD = gql`
  mutation SingleUpload($file: Upload!, $folder: String, $resourceType: String) {
    singleUpload(file: $file, folder: $folder, resourceType: $resourceType) {
      url
      publicId
      resourceType
    }
  }
`;

interface UploadSignatureData {
    getUploadSignature: {
        signature: string;
        timestamp: number;
        folder: string;
        cloudName: string;
        apiKey: string;
    };
}

interface SingleUploadData {
    singleUpload: {
        url: string;
        publicId: string;
        resourceType: string;
    };
}

interface FileUploadProps {
    onUploadComplete: (url: string, fileType: string) => void;
    folder?: string;
    accept?: string;
    maxSizeMB?: number;
    className?: string;
    label?: string;
}

export function FileUpload({
    onUploadComplete,
    folder = "ihub-academy",
    accept = "image/*,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation",
    maxSizeMB = 100,
    className,
    label = "Upload File"
}: FileUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [getSignatureQuery] = useLazyQuery<UploadSignatureData>(GET_UPLOAD_SIGNATURE);
    const [singleUpload] = useMutation<SingleUploadData>(SINGLE_UPLOAD);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        validateAndSetFile(selectedFile);
    };

    const validateAndSetFile = (selectedFile: File) => {
        setError(null);

        // Validate size
        if (selectedFile.size > maxSizeMB * 1024 * 1024) {
            setError(`File size exceeds ${maxSizeMB}MB limit`);
            return;
        }

        setFile(selectedFile);

        // Create preview for images
        if (selectedFile.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        } else {
            setPreview(null);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            validateAndSetFile(droppedFile);
        }
    };

    const uploadFile = async () => {
        if (!file) return;

        setUploading(true);
        setProgress(10);
        setError(null);

        try {
            // Determine resource type
            const isVideo = file.type.startsWith("video/");
            const isImageOrPdf = file.type.startsWith("image/") || file.type.includes("pdf");
            const resourceType = isVideo ? "video" : isImageOrPdf ? "image" : "auto";

            setProgress(30);

            // Use the GraphQL mutation for upload
            // This goes through our backend, which has the 100MB limit and uses the Private Secret
            const { data } = await singleUpload({
                variables: {
                    file,
                    folder,
                    resourceType
                }
            });

            if (data?.singleUpload) {
                setProgress(100);
                onUploadComplete(data.singleUpload.url, data.singleUpload.resourceType);
                toast.success("File uploaded successfully");
                setFile(null);
                setPreview(null);
            } else {
                throw new Error("Upload failed");
            }
        } catch (err: any) {
            console.error("Upload error:", err);
            setError(err.message || "Upload failed");
            toast.error(err.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const clearFile = () => {
        setFile(null);
        setPreview(null);
        setError(null);
        setProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className={cn("w-full", className)}>
            {!file ? (
                <div
                    className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                        <Upload className="w-6 h-6 text-accent" />
                    </div>
                    <p className="text-[11px] font-black text-foreground mb-1 uppercase tracking-widest">Click to upload screenshot</p>
                    <p className="text-[10px] text-muted-foreground text-center mb-4">
                        Drag & drop or click to browse<br />
                        Max size: 100MB
                    </p>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                        accept={accept}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                    }}>
                        Select File
                    </Button>
                </div>
            ) : (
                <div className="border border-border rounded-lg p-4 bg-card">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            {preview ? (
                                <img src={preview} alt="Preview" className="w-12 h-12 object-cover rounded-md" />
                            ) : (
                                <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                                    <File className="w-6 h-6 text-muted-foreground" />
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        </div>
                        {!uploading && (
                            <Button type="button" variant="ghost" size="icon" onClick={clearFile} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-2 rounded mb-3">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    {uploading ? (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Uploading...</span>
                                <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                    ) : (
                        <Button type="button" className="w-full bg-accent hover:bg-accent/90" onClick={uploadFile}>
                            Upload Now
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
