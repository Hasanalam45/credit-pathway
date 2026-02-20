/**
 * Lessons Service
 * 
 * Handles CRUD operations for lessons in Firestore.
 * Lessons are educational content that pair with articles or courses.
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
  getDoc,
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
 * Map Firestore lesson document to ContentItem type
 */
const mapFirestoreLessonToContentItem = (
  doc: QueryDocumentSnapshot<DocumentData>
): ContentItem => {
  const data = doc.data();
  
  const id = doc.id;
  const title = data.title || "Untitled Lesson";
  const category = data.sectionLabel || "General";
  const visibility: Visibility = data.visibility === "hidden" ? "hidden" : "visible";
  const tier: MembershipTier = mapTierToMembershipTier(data.requiredTier);
  
  const publishedAt = data.publishedAt?.toDate?.() || null;
  const lastUpdated = formatDate(publishedAt);
  
  return {
    id,
    kind: "lesson",
    typeLabel: "Lesson",
    title,
    category,
    visibility,
    tier,
    lastUpdated,
  };
};

/**
 * Lesson data structure for Firestore
 */
export interface LessonData {
  title: string;
  sectionLabel: string;
  content: string;
  visibility: Visibility;
  requiredTier: MembershipTier;
  publishedAt: Timestamp;
  authorName: string;
  updatedAt?: Timestamp;
}

/**
 * Get all lessons from Firestore
 */
export const getLessons = async (): Promise<ContentItem[]> => {
  try {
    const lessonsRef = collection(firestore, "lessons");
    
    let snapshot;
    let needsManualSort = false;
    
    try {
      const lessonsQuery = query(lessonsRef, orderBy("publishedAt", "desc"));
      snapshot = await getDocs(lessonsQuery);
    } catch (error) {
      console.warn("Could not order by publishedAt, fetching all lessons:", error);
      snapshot = await getDocs(lessonsRef);
      needsManualSort = true;
    }
    
    const lessons: ContentItem[] = [];
    
    snapshot.forEach((doc) => {
      try {
        const lesson = mapFirestoreLessonToContentItem(doc);
        lessons.push(lesson);
      } catch (error) {
        console.error(`Error mapping lesson ${doc.id} to ContentItem:`, error);
      }
    });
    
    if (needsManualSort) {
      lessons.sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));
    }
    
    return lessons;
  } catch (error) {
    console.error("Error getting lessons:", error);
    throw error;
  }
};

/**
 * Get a single lesson by ID
 */
export const getLessonById = async (id: string): Promise<LessonData | null> => {
  try {
    const lessonRef = doc(firestore, "lessons", id);
    const lessonDoc = await getDoc(lessonRef);
    
    if (!lessonDoc.exists()) {
      console.warn(`Lesson ${id} not found`);
      return null;
    }
    
    const data = lessonDoc.data();
    
    return {
      title: data.title || "",
      sectionLabel: data.sectionLabel || "",
      content: data.content || "",
      visibility: data.visibility || "visible",
      requiredTier: data.requiredTier || "free",
      publishedAt: data.publishedAt || Timestamp.now(),
      authorName: data.authorName || "Paramount Credit Pathway",
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    console.error("Error getting lesson by ID:", error);
    throw error;
  }
};

/**
 * Create a new lesson in Firestore
 */
export const createLesson = async (values: {
  title: string;
  category: string;
  content: string;
  visibility: Visibility;
  tier: MembershipTier;
}): Promise<string> => {
  try {
    const lessonsRef = collection(firestore, "lessons");
    
    const lessonData: LessonData = {
      title: values.title.trim(),
      sectionLabel: values.category.trim(),
      content: values.content.trim(),
      visibility: values.visibility,
      requiredTier: values.tier,
      publishedAt: Timestamp.now(),
      authorName: "Paramount Credit Pathway",
    };
    
    const docRef = await addDoc(lessonsRef, lessonData);
    
    console.log("Lesson created successfully with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating lesson:", error);
    throw error;
  }
};

/**
 * Update an existing lesson in Firestore
 */
export const updateLesson = async (
  id: string,
  values: {
    title: string;
    category: string;
    content: string;
    visibility: Visibility;
    tier: MembershipTier;
  }
): Promise<void> => {
  try {
    const lessonRef = doc(firestore, "lessons", id);
    
    const updateData = {
      title: values.title.trim(),
      sectionLabel: values.category.trim(),
      content: values.content.trim(),
      visibility: values.visibility,
      requiredTier: values.tier,
      updatedAt: Timestamp.now(),
    };
    
    await updateDoc(lessonRef, updateData);
    
    console.log("Lesson updated successfully:", id);
  } catch (error) {
    console.error("Error updating lesson:", error);
    throw error;
  }
};

/**
 * Delete a lesson from Firestore
 */
export const deleteLesson = async (id: string): Promise<void> => {
  try {
    const lessonRef = doc(firestore, "lessons", id);
    await deleteDoc(lessonRef);
    
    console.log("Lesson deleted successfully:", id);
  } catch (error) {
    console.error("Error deleting lesson:", error);
    throw error;
  }
};
