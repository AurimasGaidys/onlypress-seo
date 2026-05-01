// No more need to disable ESLint rules!
import {
    getDownloadURL,
    ref,
    uploadBytesResumable,
    UploadTask,
} from "firebase/storage";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "../ui/button";
import { FileType, X } from "lucide-react";
import { Progress } from "../ui/progress";
import { storage } from "@/lib/firebase";

const ALLOWED_FILE_TYPES = ["image/png", "image/jpeg"];

export interface ImagePickerProps {
    /** The Firebase storage path to upload the file to (e.g., 'user-avatars'). */
    uploadLocation: string;
    /** The URL of the currently saved image. */
    value: string | null;
    /** Callback function when a new image is successfully uploaded. */
    onChange: (url: string, name: string) => void;
    /** Optional: The name of the currently saved image for display purposes. */
    fileName?: string;
}

export const ImagePicker = ({
    uploadLocation,
    value,
    onChange,
    fileName,
}: ImagePickerProps) => {
    // Start in "edit" mode if no initial value is provided.
    const [isEditing, setIsEditing] = React.useState(!value);

    // Use proper types. The user selects a `File`, not `any`.
    const [fileToUpload, setFileToUpload] = React.useState<File | null>(null);

    const [isUploading, setIsUploading] = React.useState(false);
    const [uploadProgress, setUploadProgress] = React.useState(0);
    const [error, setError] = React.useState<string | null>(null);

    /**
     * Handles the file input change event. Validates the file and sets it in state.
     */
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null); // Clear previous errors
        const file = e.target.files?.[0];

        if (!file) {
            setFileToUpload(null);
            return;
        }

        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            setError("Invalid file type. Please select a PNG or JPG image.");
            setFileToUpload(null);
            return;
        }

        setFileToUpload(file);
    };

    React.useEffect(() => {
        handleUpload();
    }, [fileToUpload]);

    /**
     * Handles the upload process to Firebase Storage using async/await.
     */
    const handleUpload = async () => {
        if (!fileToUpload) return;

        setIsUploading(true);
        setUploadProgress(0);
        setError(null);

        const fileExtension = fileToUpload.name.split(".").pop();
        const mediaFileName = `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 9)}.${fileExtension}`;

        const storageRef = ref(storage, `${uploadLocation}/${mediaFileName}`);
        const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

        // Listen for state changes, errors, and completion of the upload.
        uploadTask.on(
            "state_changed",
            (snapshot) => {
                const progress =
                    (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
            },
            (uploadError) => {
                // Handle unsuccessful uploads
                console.error("Upload failed:", uploadError);
                setError("Upload failed. Please try again.");
                setIsUploading(false);
            },
            async () => {
                // Handle successful uploads on complete
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    onChange(downloadURL, fileToUpload.name);
                    setIsEditing(false); // Switch back to display view
                } catch (urlError) {
                    console.error("Failed to get download URL:", urlError);
                    setError("Could not retrieve file URL after upload.");
                } finally {
                    setIsUploading(false);
                    setFileToUpload(null); // Clean up
                }
            }
        );
    };

    // --- Render Logic ---

    // VIEW 1: Displaying the existing image
    if (!isEditing && value) {
        return (
            <div className="flex items-center justify-between space-x-4 p-2 border rounded-md">
                <div className="flex items-center gap-2 min-w-0">
                    <FileType className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    <p className="truncate text-sm font-medium">
                        {fileName || "Uploaded Image"}
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    Change
                </Button>
            </div>
        );
    }

    // VIEW 2: Editing/Uploading a new image
    return (
        <div className="flex flex-col gap-4 p-2 border rounded-md">
            <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="file-upload">Select Image</Label>
                <Input
                    id="file-upload"
                    type="file"
                    accept={ALLOWED_FILE_TYPES.join(",")}
                    onChange={handleFileChange}
                    disabled={isUploading}
                />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {isUploading && (
                <div className="flex items-center gap-2">
                    <Progress value={uploadProgress} className="w-full" />
                    <span className="text-sm text-gray-600">
                        {Math.round(uploadProgress)}%
                    </span>
                </div>
            )}

            <div className="flex items-center gap-2">
                <Button
                    onClick={handleUpload}
                    disabled={!fileToUpload || isUploading}
                >
                    {isUploading ? "Uploading..." : "Upload & Save"}
                </Button>
                {value && !isUploading && (
                    <Button variant="ghost" onClick={() => setIsEditing(false)}>
                        Cancel
                    </Button>
                )}
            </div>
        </div>
    );
};