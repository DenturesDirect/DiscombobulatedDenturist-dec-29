import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Response } from "express";
import { randomUUID } from "crypto";

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

let s3Client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (s3Client) {
    return s3Client;
  }

  const accessKeyId = process.env.RAILWAY_STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.RAILWAY_STORAGE_SECRET_ACCESS_KEY;
  const endpoint = process.env.RAILWAY_STORAGE_ENDPOINT;
  const region = process.env.RAILWAY_STORAGE_REGION || "us-east-1";

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error(
      "Railway Storage not configured. Please set RAILWAY_STORAGE_ACCESS_KEY_ID, " +
      "RAILWAY_STORAGE_SECRET_ACCESS_KEY, and RAILWAY_STORAGE_ENDPOINT environment variables."
    );
  }

  s3Client = new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: false, // Railway Storage uses virtual host style (like AWS S3)
  });

  return s3Client;
}

export class RailwayStorageService {
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.RAILWAY_STORAGE_BUCKET_NAME || "patient-files";
    
    // Check if Railway Storage is configured
    if (!process.env.RAILWAY_STORAGE_ACCESS_KEY_ID || 
        !process.env.RAILWAY_STORAGE_SECRET_ACCESS_KEY || 
        !process.env.RAILWAY_STORAGE_ENDPOINT) {
      console.warn(
        "⚠️  Railway Storage not fully configured. " +
        "Set RAILWAY_STORAGE_ACCESS_KEY_ID, RAILWAY_STORAGE_SECRET_ACCESS_KEY, and RAILWAY_STORAGE_ENDPOINT."
      );
    }
  }

  async getObjectEntityUploadURL(): Promise<{ uploadURL: string; objectPath: string }> {
    const s3 = getS3Client();
    const objectId = randomUUID();
    const filePath = `uploads/${objectId}`;

    // Generate a presigned URL for PUT (15 minutes expiry)
    // Note: ContentType is set to allow any file type - the actual type will be set by the browser
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: filePath,
      ContentType: 'application/octet-stream', // Allow any file type
    });

    try {
      const signedUrl = await getSignedUrl(s3, command, { expiresIn: 900 }); // 15 minutes
      
      // Return both the signed URL and the normalized object path
      return {
        uploadURL: signedUrl,
        objectPath: `/objects/${filePath}`
      };
    } catch (error: any) {
      console.error("❌ [RailwayStorage] Failed to generate presigned URL:", error);
      console.error("   Bucket:", this.bucketName);
      console.error("   Error details:", error.message);
      throw new Error(`Failed to generate upload URL: ${error.message}`);
    }
  }

  /** Upload file buffer server-side (avoids CORS with presigned URL) */
  async uploadBuffer(buffer: Buffer, contentType: string = "application/octet-stream"): Promise<{ objectPath: string }> {
    const s3 = getS3Client();
    const objectId = randomUUID();
    const filePath = `uploads/${objectId}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
        Body: buffer,
        ContentType: contentType,
      })
    );
    return { objectPath: `/objects/${filePath}` };
  }

  async getObjectEntityFile(objectPath: string): Promise<{ path: string; bucket: string }> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    // Remove /objects/ prefix
    const filePath = objectPath.slice(9); // "/objects/".length = 9
    
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
      const s3 = getS3Client();

      // Get the object
      const command = new GetObjectCommand({
        Bucket: fileInfo.bucket,
        Key: fileInfo.path,
      });

      const response = await s3.send(command);
      
      if (!response.Body) {
        throw new ObjectNotFoundError();
      }

      // Get content type and length
      const contentType = response.ContentType || "application/octet-stream";
      const contentLength = response.ContentLength?.toString() || "0";

      // Set headers
      res.set({
        "Content-Type": contentType,
        "Content-Length": contentLength,
        "Cache-Control": `private, max-age=${cacheTtlSec}`,
      });

      // Stream the file to the client
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      res.send(buffer);
    } catch (error: any) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        if (error.name === "NoSuchKey" || error.name === "NotFound") {
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

    // For upload URLs or other formats, extract the object ID
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
    // Railway Storage buckets are private by default
    // Access is controlled via presigned URLs
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
    // Railway Storage buckets are private
    // Access is controlled via presigned URLs generated by the backend
    // If we can generate a URL, the user has access
    return true;
  }
}
