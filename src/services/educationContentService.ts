/**
 * Education Content Service
 * 
 * Fetches education content (videos) from Firestore and maps them to ContentItem type
 * for display in the Content Management page.
 */

import {
  collection,
  getDocs,
  QueryDocumentSnapshot,
  orderBy,
  query,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";
import { firestore } from "../config/firebase";
import type { ContentItem, Visibility, MembershipTier } from "../components/content/ContentTable";

/**
 * Format Firestore timestamp to YYYY-MM-DD string
 */
const formatDate = (timestamp: Date | null | undefined): string => {
  if (!timestamp) {
    return new Date().toISOString().slice(0, 10);
  }
  return timestamp.toISOString().slice(0, 10);
};

/**
 * Map requiredTier to MembershipTier type
 */
const mapTierToMembershipTier = (tier: string | null | undefined): MembershipTier => {
  if (!tier) return "free";
  const tierLower = tier.toLowerCase();
  if (tierLower === "paid") return "paid";
  if (tierLower === "vip") return "vip";
  return "free";
};

/**
 * Map Firestore education content document to ContentItem type
 */
const mapFirestoreEducationContentToContentItem = (
  doc: QueryDocumentSnapshot<DocumentData>
): ContentItem => {
  const data = doc.data();
  
  // Extract required fields
  const id = doc.id;
  const title = data.title || "Untitled Video";
  
  // Extract optional fields with defaults (hybrid approach)
  const category = data.sectionLabel || "General";
  const visibility: Visibility = data.visibility === "hidden" ? "hidden" : "visible";
  const tier: MembershipTier = mapTierToMembershipTier(data.requiredTier);
  
  // Format publishedAt timestamp
  const publishedAt = data.publishedAt?.toDate?.() || null;
  const lastUpdated = formatDate(publishedAt);
  
  return {
    id,
    kind: "video",
    typeLabel: "Video",
    title,
    category,
    visibility,
    tier,
    lastUpdated,
  };
};

/**
 * Get all education content (videos) from Firestore
 */
export const getEducationContent = async (): Promise<ContentItem[]> => {
  try {
    const educationContentRef = collection(firestore, "educationContent");
    
    // Try to query videos ordered by publishedAt (most recent first)
    // If the query fails (e.g., no index), fall back to getting all videos
    let snapshot;
    let needsManualSort = false;
    
    try {
      const educationContentQuery = query(educationContentRef, orderBy("publishedAt", "desc"));
      snapshot = await getDocs(educationContentQuery);
    } catch (error) {
      // If orderBy fails (e.g., no index), get all videos and sort manually
      console.warn("Could not order by publishedAt, fetching all videos:", error);
      snapshot = await getDocs(educationContentRef);
      needsManualSort = true;
    }
    
    const videos: ContentItem[] = [];
    
    snapshot.forEach((doc) => {
      try {
        const video = mapFirestoreEducationContentToContentItem(doc);
        videos.push(video);
      } catch (error) {
        console.error(`Error mapping video ${doc.id} to ContentItem:`, error);
      }
    });
    
    // Sort manually if we couldn't use orderBy
    if (needsManualSort) {
      videos.sort((a, b) => {
        return b.lastUpdated.localeCompare(a.lastUpdated);
      });
    }
    
    return videos;
  } catch (error) {
    console.error("Error getting education content:", error);
    throw error;
  }
};

/**
 * Create a new education content (video) in Firestore
 */
export const createEducationContent = async (values: {
  title: string;
  category: string;
  visibility: Visibility;
  tier: MembershipTier;
}): Promise<string> => {
  try {
    const educationContentRef = collection(firestore, "educationContent");
    
    // Prepare education content data for Firestore
    const educationContentData = {
      title: values.title.trim(),
      sectionLabel: values.category.trim(),
      visibility: values.visibility,
      requiredTier: values.tier,
      publishedAt: Timestamp.now(),
      // Required fields with defaults
      authorName: "Paramount Credit Pathway", // Default author
      coverImageUrl: "",
      durationMinutes: 0,
      presentedBy: "Paramount Credit Pathway",
      shortDescription: "",
      thumbnailUrl: "",
      videoUrl: "", // Will need to be set separately or via additional form fields
    };
    
    // Add document to Firestore
    const docRef = await addDoc(educationContentRef, educationContentData);
    
    console.log("Education content created successfully with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating education content:", error);
    throw error;
  }
};

/**
 * Update an existing education content (video) in Firestore
 */
export const updateEducationContent = async (
  id: string,
  values: {
    title: string;
    category: string;
    visibility: Visibility;
    tier: MembershipTier;
  }
): Promise<void> => {
  try {
    const educationContentRef = doc(firestore, "educationContent", id);
    
    // Prepare update data (only update the fields that can be changed)
    const updateData = {
      title: values.title.trim(),
      sectionLabel: values.category.trim(),
      visibility: values.visibility,
      requiredTier: values.tier,
      updatedAt: Timestamp.now(), // Add updatedAt timestamp
    };
    
    await updateDoc(educationContentRef, updateData);
    
    console.log("Education content updated successfully:", id);
  } catch (error) {
    console.error("Error updating education content:", error);
    throw error;
  }
};

/**
 * Delete an education content (video) from Firestore
 */
export const deleteEducationContent = async (id: string): Promise<void> => {
  try {
    const educationContentRef = doc(firestore, "educationContent", id);
    await deleteDoc(educationContentRef);
    
    console.log("Education content deleted successfully:", id);
  } catch (error) {
    console.error("Error deleting education content:", error);
    throw error;
  }
};

