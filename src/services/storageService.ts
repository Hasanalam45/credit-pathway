/**
 * Storage Service
 * 
 * Handles file uploads to Firebase Storage
 */

import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../config/firebase";

export interface UploadProgress {
  progress: number; // 0-100
  bytesTransferred: number;
  totalBytes: number;
}

/**
 * Upload a video file to Firebase Storage
 * @param file - The video file to upload
 * @param onProgress - Optional callback for upload progress
 * @returns Promise with the download URL
 */
export const uploadVideo = async (
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  // Validate file
  if (!file) {
    throw new Error("No file provided");
  }

  // Check file type
  if (!file.type.startsWith("video/")) {
    throw new Error("File must be a video");
  }

  // Check file size (500MB limit)
  const MAX_SIZE = 500 * 1024 * 1024; // 500MB in bytes
  if (file.size > MAX_SIZE) {
    throw new Error("Video file size must be less than 500MB");
  }

  try {
    // Create a unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `videos/${timestamp}_${sanitizedFileName}`;

    // Create storage reference
    const storageRef = ref(storage, fileName);

    // Upload file with progress tracking
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Calculate progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          
          if (onProgress) {
            onProgress({
              progress: Math.round(progress),
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
            });
          }

          console.log(`Upload is ${progress.toFixed(2)}% done`);
        },
        (error) => {
          // Handle upload errors
          console.error("Upload error:", error);
          reject(new Error(`Upload failed: ${error.message}`));
        },
        async () => {
          // Upload completed successfully, get download URL
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log("File available at:", downloadURL);
            resolve(downloadURL);
          } catch (error: any) {
            reject(new Error(`Failed to get download URL: ${error.message}`));
          }
        }
      );
    });
  } catch (error: any) {
    console.error("Error uploading video:", error);
    throw new Error(`Failed to upload video: ${error.message}`);
  }
};

/**
 * Delete a video file from Firebase Storage
 * @param videoUrl - The download URL of the video to delete
 */
export const deleteVideo = async (videoUrl: string): Promise<void> => {
  try {
    // Extract the file path from the URL
    const url = new URL(videoUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+?)\?/);
    
    if (!pathMatch) {
      throw new Error("Invalid video URL");
    }

    const filePath = decodeURIComponent(pathMatch[1]);
    const storageRef = ref(storage, filePath);

    await deleteObject(storageRef);
    console.log("Video deleted successfully:", filePath);
  } catch (error: any) {
    console.error("Error deleting video:", error);
    throw new Error(`Failed to delete video: ${error.message}`);
  }
};

/**
 * Convert duration string (e.g., "8:32") to decimal minutes (e.g., 8.53)
 * @param duration - Duration string in format "MM:SS" or "HH:MM:SS"
 * @returns Duration in decimal minutes
 */
export const parseDurationToMinutes = (duration: string): number => {
  if (!duration || !duration.trim()) {
    return 0;
  }

  const parts = duration.trim().split(":");
  
  try {
    if (parts.length === 2) {
      // Format: MM:SS
      const minutes = parseInt(parts[0], 10);
      const seconds = parseInt(parts[1], 10);
      
      if (isNaN(minutes) || isNaN(seconds)) {
        throw new Error("Invalid duration format");
      }
      
      return minutes + (seconds / 60);
    } else if (parts.length === 3) {
      // Format: HH:MM:SS
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      const seconds = parseInt(parts[2], 10);
      
      if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
        throw new Error("Invalid duration format");
      }
      
      return (hours * 60) + minutes + (seconds / 60);
    } else {
      throw new Error("Duration must be in format MM:SS or HH:MM:SS");
    }
  } catch (error: any) {
    console.error("Error parsing duration:", error);
    return 0;
  }
};

/**
 * Format file size to human-readable string
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "15.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};
