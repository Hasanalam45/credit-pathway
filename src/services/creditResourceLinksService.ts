/**
 * Credit Resource Links Service
 * 
 * Handles CRUD operations for credit resource links in Firestore.
 * Credit resource links are external resources that help users with credit-related topics.
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
 * Validate URL format
 */
const isValidUrl = (urlString: string): boolean => {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * Map Firestore credit resource link document to ContentItem type
 */
const mapFirestoreLinkToContentItem = (
  doc: QueryDocumentSnapshot<DocumentData>
): ContentItem => {
  const data = doc.data();
  
  const id = doc.id;
  const title = data.title || "Untitled Link";
  const category = data.sectionLabel || "General";
  const visibility: Visibility = data.visibility === "hidden" ? "hidden" : "visible";
  const tier: MembershipTier = mapTierToMembershipTier(data.requiredTier);
  
  const publishedAt = data.publishedAt?.toDate?.() || null;
  const lastUpdated = formatDate(publishedAt);
  
  return {
    id,
    kind: "link",
    typeLabel: "Resource Link",
    title,
    category,
    visibility,
    tier,
    lastUpdated,
  };
};

/**
 * Credit Resource Link data structure for Firestore
 */
export interface CreditResourceLinkData {
  title: string;
  sectionLabel: string;
  url: string;
  description?: string;
  visibility: Visibility;
  requiredTier: MembershipTier;
  publishedAt: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Get all credit resource links from Firestore
 */
export const getCreditResourceLinks = async (): Promise<ContentItem[]> => {
  try {
    const linksRef = collection(firestore, "creditResourceLinks");
    
    let snapshot;
    let needsManualSort = false;
    
    try {
      const linksQuery = query(linksRef, orderBy("publishedAt", "desc"));
      snapshot = await getDocs(linksQuery);
    } catch (error) {
      console.warn("Could not order by publishedAt, fetching all links:", error);
      snapshot = await getDocs(linksRef);
      needsManualSort = true;
    }
    
    const links: ContentItem[] = [];
    
    snapshot.forEach((doc) => {
      try {
        const link = mapFirestoreLinkToContentItem(doc);
        links.push(link);
      } catch (error) {
        console.error(`Error mapping link ${doc.id} to ContentItem:`, error);
      }
    });
    
    if (needsManualSort) {
      links.sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));
    }
    
    return links;
  } catch (error) {
    console.error("Error getting credit resource links:", error);
    throw error;
  }
};

/**
 * Get a single credit resource link by ID
 */
export const getCreditResourceLinkById = async (id: string): Promise<CreditResourceLinkData | null> => {
  try {
    const linkRef = doc(firestore, "creditResourceLinks", id);
    const linkDoc = await getDoc(linkRef);
    
    if (!linkDoc.exists()) {
      console.warn(`Credit resource link ${id} not found`);
      return null;
    }
    
    const data = linkDoc.data();
    
    return {
      title: data.title || "",
      sectionLabel: data.sectionLabel || "",
      url: data.url || "",
      description: data.description || "",
      visibility: data.visibility || "visible",
      requiredTier: data.requiredTier || "free",
      publishedAt: data.publishedAt || Timestamp.now(),
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    console.error("Error getting credit resource link by ID:", error);
    throw error;
  }
};

/**
 * Create a new credit resource link in Firestore
 */
export const createCreditResourceLink = async (values: {
  title: string;
  category: string;
  url: string;
  description?: string;
  visibility: Visibility;
  tier: MembershipTier;
}): Promise<string> => {
  try {
    // Validate URL
    if (!isValidUrl(values.url)) {
      throw new Error("Invalid URL format. Please provide a valid HTTP or HTTPS URL.");
    }
    
    const linksRef = collection(firestore, "creditResourceLinks");
    
    const linkData: CreditResourceLinkData = {
      title: values.title.trim(),
      sectionLabel: values.category.trim(),
      url: values.url.trim(),
      description: values.description?.trim() || "",
      visibility: values.visibility,
      requiredTier: values.tier,
      publishedAt: Timestamp.now(),
    };
    
    const docRef = await addDoc(linksRef, linkData);
    
    console.log("Credit resource link created successfully with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating credit resource link:", error);
    throw error;
  }
};

/**
 * Update an existing credit resource link in Firestore
 */
export const updateCreditResourceLink = async (
  id: string,
  values: {
    title: string;
    category: string;
    url: string;
    description?: string;
    visibility: Visibility;
    tier: MembershipTier;
  }
): Promise<void> => {
  try {
    // Validate URL
    if (!isValidUrl(values.url)) {
      throw new Error("Invalid URL format. Please provide a valid HTTP or HTTPS URL.");
    }
    
    const linkRef = doc(firestore, "creditResourceLinks", id);
    
    const updateData = {
      title: values.title.trim(),
      sectionLabel: values.category.trim(),
      url: values.url.trim(),
      description: values.description?.trim() || "",
      visibility: values.visibility,
      requiredTier: values.tier,
      updatedAt: Timestamp.now(),
    };
    
    await updateDoc(linkRef, updateData);
    
    console.log("Credit resource link updated successfully:", id);
  } catch (error) {
    console.error("Error updating credit resource link:", error);
    throw error;
  }
};

/**
 * Delete a credit resource link from Firestore
 */
export const deleteCreditResourceLink = async (id: string): Promise<void> => {
  try {
    const linkRef = doc(firestore, "creditResourceLinks", id);
    await deleteDoc(linkRef);
    
    console.log("Credit resource link deleted successfully:", id);
  } catch (error) {
    console.error("Error deleting credit resource link:", error);
    throw error;
  }
};
