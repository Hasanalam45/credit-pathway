/**
 * Articles Service
 * 
 * Fetches articles from Firestore and maps them to ContentItem type
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
      // Optional fields with defaults
      thumbnailUrl: null,
      readTimeMinutes: null,
      summary: "",
      body: "",
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

