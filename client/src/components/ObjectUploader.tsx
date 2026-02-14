import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";

type UploadHttpMethod = "PUT" | "POST";

interface UploadParameters {
  method: UploadHttpMethod;
  url: string;
  fields?: Record<string, string>;
  headers?: Record<string, string>;
}

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: (file: File) => Promise<UploadParameters>;
  onComplete: (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => void;
  onError?: (error: Error) => void;
  buttonClassName?: string;
  children: ReactNode;
}

export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10 * 1024 * 1024,
  onGetUploadParameters,
  onComplete,
  onError,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const triggerFileSelect = () => {
    inputRef.current?.click();
  };

  const createError = (message: string) => new Error(message);

  const uploadSingleFile = async (file: File) => {
    const params = await onGetUploadParameters(file);
    if (!params?.url || !params?.method) {
      throw createError("Invalid upload parameters returned by uploader.");
    }

    if (params.method === "PUT") {
      const response = await fetch(params.url, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          ...(params.headers ?? {}),
        },
        body: file,
      });

      if (!response.ok) {
        throw createError(`Upload failed with status ${response.status}.`);
      }

      return {
        name: file.name,
        type: file.type,
        size: file.size,
        uploadURL: params.url,
        response: { status: response.status },
      };
    }

    const formData = new FormData();
    if (params.fields) {
      for (const [key, value] of Object.entries(params.fields)) {
        formData.append(key, value);
      }
    }
    formData.append("file", file, file.name);

    const response = await fetch(params.url, {
      method: "POST",
      headers: params.headers,
      body: formData,
    });

    if (!response.ok) {
      throw createError(`Upload failed with status ${response.status}.`);
    }

    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    return {
      name: file.name,
      type: file.type,
      size: file.size,
      uploadURL: params.url,
      response: { status: response.status, body },
    };
  };

  const handleFilesSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (selectedFiles.length === 0) {
      return;
    }

    const files = selectedFiles.slice(0, Math.max(1, maxNumberOfFiles));
    const oversized = files.find((file) => file.size > maxFileSize);
    if (oversized) {
      const error = createError(
        `File "${oversized.name}" exceeds the ${(maxFileSize / (1024 * 1024)).toFixed(0)}MB size limit.`,
      );
      onError?.(error);
      return;
    }

    setIsUploading(true);
    const successful: any[] = [];
    const failed: any[] = [];

    try {
      for (const file of files) {
        try {
          const uploaded = await uploadSingleFile(file);
          successful.push(uploaded);
        } catch (error: any) {
          failed.push({
            name: file.name,
            type: file.type,
            size: file.size,
            error: error instanceof Error ? error : createError("Upload failed."),
          });
        }
      }

      if (failed.length > 0 && successful.length === 0) {
        const firstError = failed[0]?.error;
        onError?.(firstError instanceof Error ? firstError : createError("Upload failed."));
      }

      onComplete({
        successful,
        failed,
      } as UploadResult<Record<string, unknown>, Record<string, unknown>>);
    } catch (error: any) {
      const normalizedError = error instanceof Error ? error : createError("Upload failed.");
      onError?.(normalizedError);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple={maxNumberOfFiles > 1}
        onChange={handleFilesSelected}
      />
      <Button
        type="button"
        variant="outline"
        className={buttonClassName}
        onClick={triggerFileSelect}
        disabled={isUploading}
      >
        {isUploading ? "Uploading..." : children}
      </Button>
    </>
  );
}
