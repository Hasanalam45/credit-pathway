/**
 * Static Pages Service
 * 
 * Handles CRUD operations for static pages in Firestore.
 * Static pages are informational pages like About Us, Privacy Policy, Terms of Service, etc.
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
  where,
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
 * Validate slug format (lowercase, numbers, hyphens only)
 */
const isValidSlug = (slug: string): boolean => {
  return /^[a-z0-9-]+$/.test(slug);
};

/**
 * Map Firestore static page document to ContentItem type
 */
const mapFirestorePageToContentItem = (
  doc: QueryDocumentSnapshot<DocumentData>
): ContentItem => {
  const data = doc.data();
  
  const id = doc.id;
  const title = data.title || "Untitled Page";
  const category = data.sectionLabel || "General";
  const visibility: Visibility = data.visibility === "hidden" ? "hidden" : "visible";
  const tier: MembershipTier = mapTierToMembershipTier(data.requiredTier);
  
  const publishedAt = data.publishedAt?.toDate?.() || null;
  const lastUpdated = formatDate(publishedAt);
  
  return {
    id,
    kind: "page",
    typeLabel: "Static Page",
    title,
    category,
    visibility,
    tier,
    lastUpdated,
  };
};

/**
 * Static Page data structure for Firestore
 */
export interface StaticPageData {
  title: string;
  slug: string;
  sectionLabel: string;
  content: string;
  previewContent?: string;
  metaTitle?: string;
  metaDescription?: string;
  visibility: Visibility;
  requiredTier: MembershipTier;
  publishedAt: Timestamp;
  authorName: string;
  updatedAt?: Timestamp;
}

/**
 * Get all static pages from Firestore
 */
export const getStaticPages = async (): Promise<ContentItem[]> => {
  try {
    const pagesRef = collection(firestore, "staticPages");
    
    let snapshot;
    let needsManualSort = false;
    
    try {
      const pagesQuery = query(pagesRef, orderBy("publishedAt", "desc"));
      snapshot = await getDocs(pagesQuery);
    } catch (error) {
      console.warn("Could not order by publishedAt, fetching all pages:", error);
      snapshot = await getDocs(pagesRef);
      needsManualSort = true;
    }
    
    const pages: ContentItem[] = [];
    
    snapshot.forEach((doc) => {
      try {
        const page = mapFirestorePageToContentItem(doc);
        pages.push(page);
      } catch (error) {
        console.error(`Error mapping page ${doc.id} to ContentItem:`, error);
      }
    });
    
    if (needsManualSort) {
      pages.sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));
    }
    
    return pages;
  } catch (error) {
    console.error("Error getting static pages:", error);
    throw error;
  }
};

/**
 * Get a single static page by ID
 */
export const getStaticPageById = async (id: string): Promise<StaticPageData | null> => {
  try {
    const pageRef = doc(firestore, "staticPages", id);
    const pageDoc = await getDoc(pageRef);
    
    if (!pageDoc.exists()) {
      console.warn(`Static page ${id} not found`);
      return null;
    }
    
    const data = pageDoc.data();
    
    return {
      title: data.title || "",
      slug: data.slug || "",
      sectionLabel: data.sectionLabel || "",
      content: data.content || "",
      previewContent: data.previewContent || "",
      metaTitle: data.metaTitle || "",
      metaDescription: data.metaDescription || "",
      visibility: data.visibility || "visible",
      requiredTier: data.requiredTier || "free",
      publishedAt: data.publishedAt || Timestamp.now(),
      authorName: data.authorName || "",
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    console.error("Error getting static page by ID:", error);
    throw error;
  }
};

/**
 * Check if a slug already exists in Firestore
 */
export const checkSlugExists = async (slug: string, excludeId?: string): Promise<boolean> => {
  try {
    const pagesRef = collection(firestore, "staticPages");
    const slugQuery = query(pagesRef, where("slug", "==", slug));
    const snapshot = await getDocs(slugQuery);
    
    // If we're editing, exclude the current page from the check
    if (excludeId) {
      return snapshot.docs.some(doc => doc.id !== excludeId);
    }
    
    return !snapshot.empty;
  } catch (error) {
    console.error("Error checking slug existence:", error);
    return false;
  }
};

/**
 * Create a new static page in Firestore
 */
export const createStaticPage = async (values: {
  title: string;
  slug: string;
  category: string;
  content: string;
  previewContent?: string;
  metaTitle?: string;
  metaDescription?: string;
  visibility: Visibility;
  tier: MembershipTier;
}): Promise<string> => {
  try {
    // Validate slug format
    if (!isValidSlug(values.slug)) {
      throw new Error("Invalid slug format. Use only lowercase letters, numbers, and hyphens.");
    }
    
    // Check if slug already exists
    const slugExists = await checkSlugExists(values.slug);
    if (slugExists) {
      throw new Error(`A page with slug "${values.slug}" already exists. Please use a different slug.`);
    }
    
    const pagesRef = collection(firestore, "staticPages");
    
    const pageData: StaticPageData = {
      title: values.title.trim(),
      slug: values.slug.trim().toLowerCase(),
      sectionLabel: values.category.trim(),
      content: values.content.trim(),
      previewContent: values.previewContent?.trim() || "",
      metaTitle: values.metaTitle?.trim() || "",
      metaDescription: values.metaDescription?.trim() || "",
      visibility: values.visibility,
      requiredTier: values.tier,
      publishedAt: Timestamp.now(),
      authorName: "Admin", // TODO: Get from auth context
    };
    
    const docRef = await addDoc(pagesRef, pageData);
    
    console.log("Static page created successfully with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating static page:", error);
    throw error;
  }
};

/**
 * Update an existing static page in Firestore
 */
export const updateStaticPage = async (
  id: string,
  values: {
    title: string;
    slug: string;
    category: string;
    content: string;
    previewContent?: string;
    metaTitle?: string;
    metaDescription?: string;
    visibility: Visibility;
    tier: MembershipTier;
  }
): Promise<void> => {
  try {
    // Validate slug format
    if (!isValidSlug(values.slug)) {
      throw new Error("Invalid slug format. Use only lowercase letters, numbers, and hyphens.");
    }
    
    // Check if slug already exists (excluding current page)
    const slugExists = await checkSlugExists(values.slug, id);
    if (slugExists) {
      throw new Error(`A page with slug "${values.slug}" already exists. Please use a different slug.`);
    }
    
    const pageRef = doc(firestore, "staticPages", id);
    
    const updateData = {
      title: values.title.trim(),
      slug: values.slug.trim().toLowerCase(),
      sectionLabel: values.category.trim(),
      content: values.content.trim(),
      previewContent: values.previewContent?.trim() || "",
      metaTitle: values.metaTitle?.trim() || "",
      metaDescription: values.metaDescription?.trim() || "",
      visibility: values.visibility,
      requiredTier: values.tier,
      updatedAt: Timestamp.now(),
    };
    
    await updateDoc(pageRef, updateData);
    
    console.log("Static page updated successfully:", id);
  } catch (error) {
    console.error("Error updating static page:", error);
    throw error;
  }
};

/**
 * Delete a static page from Firestore
 */
export const deleteStaticPage = async (id: string): Promise<void> => {
  try {
    const pageRef = doc(firestore, "staticPages", id);
    await deleteDoc(pageRef);
    
    console.log("Static page deleted successfully:", id);
  } catch (error) {
    console.error("Error deleting static page:", error);
    throw error;
  }
};
