/**
 * Articles Service
 * 
 * Fetches articles from Firestore and maps them to ContentItem type
 * for display in the Content Management page.
 */

import {
  collection,
  getDocs,
  getDoc,
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
 * Map Firestore article document to ContentItem type
 */
const mapFirestoreArticleToContentItem = (
  doc: QueryDocumentSnapshot<DocumentData>
): ContentItem => {
  const data = doc.data();
  
  // Extract required fields
  const id = doc.id;
  const title = data.title || "Untitled Article";
  
  // Extract optional fields with defaults (hybrid approach)
  const category = data.category || "General";
  const visibility: Visibility = data.visibility === "hidden" ? "hidden" : "visible";
  const tier: MembershipTier = data.tier === "paid" ? "paid" : 
                               data.tier === "vip" ? "vip" : "free";
  
  // Format createdAt timestamp
  const createdAt = data.createdAt?.toDate?.() || null;
  const lastUpdated = formatDate(createdAt);
  
  return {
    id,
    kind: "article",
    typeLabel: "Article",
    title,
    category,
    visibility,
    tier,
    lastUpdated,
  };
};

/**
 * Get all articles from Firestore
 */
export const getArticles = async (): Promise<ContentItem[]> => {
  try {
    const articlesRef = collection(firestore, "articles");
    
    // Try to query articles ordered by createdAt (most recent first)
    // If the query fails (e.g., no index), fall back to getting all articles
    let snapshot;
    let needsManualSort = false;
    
    try {
      const articlesQuery = query(articlesRef, orderBy("createdAt", "desc"));
      snapshot = await getDocs(articlesQuery);
    } catch (error) {
      // If orderBy fails (e.g., no index), get all articles and sort manually
      console.warn("Could not order by createdAt, fetching all articles:", error);
      snapshot = await getDocs(articlesRef);
      needsManualSort = true;
    }
    
    const articles: ContentItem[] = [];
    
    snapshot.forEach((doc) => {
      try {
        const article = mapFirestoreArticleToContentItem(doc);
        articles.push(article);
      } catch (error) {
        console.error(`Error mapping article ${doc.id} to ContentItem:`, error);
      }
    });
    
    // Sort manually if we couldn't use orderBy
    if (needsManualSort) {
      articles.sort((a, b) => {
        return b.lastUpdated.localeCompare(a.lastUpdated);
      });
    }
    
    return articles;
  } catch (error) {
    console.error("Error getting articles:", error);
    throw error;
  }
};

/**
 * Create a new article in Firestore
 */
export const createArticle = async (values: {
  title: string;
  category: string;
  content: string;
  visibility: Visibility;
  tier: MembershipTier;
}): Promise<string> => {
  try {
    const articlesRef = collection(firestore, "articles");
    
    // Prepare article data for Firestore
    const articleData = {
      title: values.title.trim(),
      authorName: "Paramount Credit Pathway", // Default author
      category: values.category.trim(),
      visibility: values.visibility,
      tier: values.tier,
      createdAt: Timestamp.now(),
      // Save content as body field for consistency with Flutter app
      body: values.content.trim() || "",
      // Optional fields with defaults
      thumbnailUrl: null,
      readTimeMinutes: null,
      summary: "",
      sections: [], // Empty sections array (required field)
    };
    
    // Add document to Firestore
    const docRef = await addDoc(articlesRef, articleData);
    
    console.log("Article created successfully with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating article:", error);
    throw error;
  }
};

/**
 * Update an existing article in Firestore
 */
export const updateArticle = async (
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
    const articleRef = doc(firestore, "articles", id);
    
    // Prepare update data (only update the fields that can be changed)
    const updateData = {
      title: values.title.trim(),
      category: values.category.trim(),
      visibility: values.visibility,
      tier: values.tier,
      // Save content as body field for consistency with Flutter app
      body: values.content.trim() || "",
      updatedAt: Timestamp.now(), // Add updatedAt timestamp
    };
    
    await updateDoc(articleRef, updateData);
    
    console.log("Article updated successfully:", id);
  } catch (error) {
    console.error("Error updating article:", error);
    throw error;
  }
};

/**
 * Get a single article by ID with full content
 */
export const getArticleById = async (id: string): Promise<{
  id: string;
  title: string;
  category: string;
  content: string;
  visibility: Visibility;
  tier: MembershipTier;
} | null> => {
  try {
    const articleRef = doc(firestore, "articles", id);
    const articleSnap = await getDoc(articleRef);
    
    if (!articleSnap.exists()) {
      return null;
    }
    
    const data = articleSnap.data();
    
    return {
      id: articleSnap.id,
      title: data.title || "Untitled Article",
      category: data.category || "General",
      content: data.body || "", // Map body field to content
      visibility: data.visibility === "hidden" ? "hidden" : "visible",
      tier: data.tier === "paid" ? "paid" : 
            data.tier === "vip" ? "vip" : "free",
    };
  } catch (error) {
    console.error("Error getting article by ID:", error);
    throw error;
  }
};

/**
 * Delete an article from Firestore
 */
export const deleteArticle = async (id: string): Promise<void> => {
  try {
    const articleRef = doc(firestore, "articles", id);
    await deleteDoc(articleRef);
    
    console.log("Article deleted successfully:", id);
  } catch (error) {
    console.error("Error deleting article:", error);
    throw error;
  }
};

