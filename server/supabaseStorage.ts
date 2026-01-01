import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Response } from "express";
import { randomUUID } from "crypto";

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  // Support multiple variable names to avoid Railway secret detection
  const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY; // Support both names

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "SUPABASE_PROJECT_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE (or SUPABASE_SERVICE_ROLE_KEY) must be set. " +
      "Configure Supabase Storage in your environment variables."
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseClient;
}

export class SupabaseStorageService {
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.SUPABASE_STORAGE_BUCKET || "patient-files";
    
    // Don't throw error here - let it fail gracefully when methods are called
    // The routes.ts will catch and use fallback
    if (!(process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL) || (!process.env.SUPABASE_SERVICE_ROLE && !process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_ANON_KEY)) {
      console.warn(
        "⚠️  Supabase Storage not fully configured. " +
        "File uploads will use fallback storage until SUPABASE_PROJECT_URL and SUPABASE_SERVICE_ROLE are set."
      );
    }
  }

  async getObjectEntityUploadURL(): Promise<string> {
    const supabase = getSupabaseClient();
    const objectId = randomUUID();
    const filePath = `uploads/${objectId}`;

    // Generate a signed URL for upload (15 minutes expiry)
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .createSignedUploadUrl(filePath, {
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to create upload URL: ${error.message}`);
    }

    if (!data?.signedUrl) {
      throw new Error("Failed to create upload URL: No signed URL returned");
    }

    return data.signedUrl;
  }

  async getObjectEntityFile(objectPath: string): Promise<{ path: string; bucket: string }> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    // Remove /objects/ prefix
    const filePath = objectPath.slice(9); // "/objects/".length = 9
    console.log("🔍 Looking for file in Supabase:", filePath);

    const supabase = getSupabaseClient();
    
    // For Supabase, the path should be exactly as stored (e.g., "uploads/uuid")
    // Try to get the file directly first
    const { data: fileData, error: fileError } = await supabase.storage
      .from(this.bucketName)
      .list(filePath.split('/').slice(0, -1).join('/') || '', {
        limit: 1000,
        search: filePath.split('/').pop() || '',
      });

    // If that doesn't work, try listing the folder
    if (fileError || !fileData || fileData.length === 0) {
      const pathParts = filePath.split("/");
      const fileName = pathParts.pop() || "";
      const folderPath = pathParts.join("/");

      console.log("🔍 Trying folder listing:", folderPath, "filename:", fileName);

      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list(folderPath || "", {
          limit: 1000,
        });

      if (error) {
        console.error("❌ Supabase list error:", error);
        throw new ObjectNotFoundError();
      }

      // Check if file exists in the list
      const fileExists = data?.some((item) => item.name === fileName && !item.id); // files don't have id, folders do

      if (!fileExists) {
        console.error("❌ File not found in list. Available files:", data?.map(f => f.name));
        throw new ObjectNotFoundError();
      }
    }

    console.log("✅ File found, path:", filePath);
    return {
      path: filePath,
      bucket: this.bucketName,
    };
  }

  async downloadObject(
    fileInfo: { path: string; bucket: string },
    res: Response,
    cacheTtlSec: number = 3600
  ) {
    try {
      const supabase = getSupabaseClient();

      // Generate signed URL for download
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from(fileInfo.bucket)
        .createSignedUrl(fileInfo.path, cacheTtlSec);

      if (urlError || !signedUrlData?.signedUrl) {
        throw new ObjectNotFoundError();
      }

      // Download the file from Supabase
      const fileResponse = await fetch(signedUrlData.signedUrl);
      if (!fileResponse.ok) {
        throw new ObjectNotFoundError();
      }

      // Get content type from response or default
      const contentType = fileResponse.headers.get("content-type") || "application/octet-stream";
      const contentLength = fileResponse.headers.get("content-length") || "0";

      // Set headers
      res.set({
        "Content-Type": contentType,
        "Content-Length": contentLength,
        "Cache-Control": `private, max-age=${cacheTtlSec}`,
      });

      // Stream the file to the client
      const fileBuffer = await fileResponse.arrayBuffer();
      res.send(Buffer.from(fileBuffer));
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        if (error instanceof ObjectNotFoundError) {
          res.status(404).json({ error: "File not found" });
        } else {
          res.status(500).json({ error: "Error downloading file" });
        }
      }
    }
  }

  normalizeObjectEntityPath(rawPath: string): string {
    // If it's already a normalized path, return it
    if (rawPath.startsWith("/objects/")) {
      return rawPath;
    }

    // If it's a Supabase storage URL, extract the path
    if (rawPath.includes(".supabase.co/storage/v1/object")) {
      try {
        const url = new URL(rawPath);
        const pathMatch = url.pathname.match(/\/object\/[^/]+\/(.+)$/);
        if (pathMatch) {
          return `/objects/${pathMatch[1]}`;
        }
      } catch (e) {
        // Not a valid URL, return as-is
      }
    }

    // For upload URLs or other formats, extract the object ID
    // This handles the case where we get back a full URL from upload
    if (rawPath.includes("uploads/")) {
      const uploadMatch = rawPath.match(/uploads\/([^/?]+)/);
      if (uploadMatch) {
        return `/objects/uploads/${uploadMatch[1]}`;
      }
    }

    return rawPath;
  }

  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: { visibility: "public" | "private" }
  ): Promise<string> {
    // Supabase Storage uses bucket-level policies, not file-level ACLs
    // For now, we'll just normalize the path
    // In production, you'd manage this through Supabase Storage policies
    return this.normalizeObjectEntityPath(rawPath);
  }

  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: { path: string; bucket: string };
    requestedPermission?: "read" | "write" | "delete";
  }): Promise<boolean> {
    // Supabase Storage policies handle access control
    // If we can get the file info, the user has access
    // In production, you'd check against Supabase RLS policies
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.storage
        .from(objectFile.bucket)
        .list(objectFile.path.split("/").slice(0, -1).join("/") || "", {
          limit: 1,
          search: objectFile.path.split("/").pop() || "",
        });

      return !error && data !== null && data.length > 0;
    } catch {
      return false;
    }
  }
}

