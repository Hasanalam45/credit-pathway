import React, { useMemo, useState } from "react";
import PageHeader from "../../components/shared/layout/PageHeader";
import Button from "../../components/shared/buttons/Button";
import ContentTabs, { type ContentTab } from "../../components/content/ContentTabs";
import ContentTable, {
  type ContentItem,
  type ContentKind,
  type Visibility,
  type MembershipTier,
} from "../../components/content/ContentTable";
import NewArticleModal, {
  type NewArticleValues,
} from "../../components/content/NewArticleModal";
import NewLessonModal, {
  type NewLessonValues,
} from "../../components/content/NewLessonModal";
import { useArticles } from "../../hooks/useArticles";
import { useEducationContent } from "../../hooks/useEducationContent";
import { createArticle, updateArticle, deleteArticle } from "../../services/articlesService";
import { createEducationContent, updateEducationContent, deleteEducationContent } from "../../services/educationContentService";

const ContentManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ContentTab>("articles");

  // Fetch articles from Firebase
  const { articles, loading: articlesLoading, error: articlesError, refetch: refetchArticles } = useArticles();

  // Fetch videos from Firebase
  const { videos, loading: videosLoading, error: videosError, refetch: refetchVideos } = useEducationContent();

  // Local state for other content types (lessons, links, static pages)
  // Articles and videos are now fetched from Firebase, so we only store non-Firebase items here
  const [otherItems, setOtherItems] = useState<ContentItem[]>([]);

  const [articleModalOpen, setArticleModalOpen] = useState(false);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Combine Firebase articles, videos with other items
  const allItems = useMemo(() => {
    return [...articles, ...videos, ...otherItems];
  }, [articles, videos, otherItems]);

  const filteredItems = useMemo(() => {
    const map: Record<ContentTab, ContentKind> = {
      articles: "article",
      lessons: "lesson",
      videos: "video",
      links: "link",
      static: "page",
    };
    const kind = map[activeTab];
    return allItems.filter((item) => item.kind === kind);
  }, [activeTab, allItems]);

  const addItem = (kind: ContentKind, values: {
    title: string;
    category: string;
    visibility: Visibility;
    tier: MembershipTier;
  }) => {
    const typeLabelMap: Record<ContentKind, string> = {
      article: "Article",
      lesson: "Lesson",
      video: "Video",
      link: "Resource Link",
      page: "Static Page",
    };

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const newItem: ContentItem = {
      id: String(Date.now()),
      kind,
      typeLabel: typeLabelMap[kind],
      title: values.title,
      category: values.category,
      visibility: values.visibility,
      tier: values.tier,
      lastUpdated: today,
    };

    // Articles and videos are now handled through their respective handlers which save to Firestore
    // Only add non-Firebase items (lessons, links, static pages) to local state
    if (kind !== "article" && kind !== "video") {
      setOtherItems((prev) => [newItem, ...prev]);
    }
  };

  const handleCreateArticle = async (values: NewArticleValues) => {
    try {
      // Create article in Firestore
      await createArticle(values);
      
      // Refetch articles to update the list
      await refetchArticles();
      
      setArticleModalOpen(false);
      setActiveTab("articles");
    } catch (error: any) {
      console.error("Error creating article:", error);
      alert(error.message || "Failed to create article. Please try again.");
    }
  };

  const handleCreateLesson = (values: NewLessonValues) => {
    addItem("lesson", values);
    setLessonModalOpen(false);
    setActiveTab("lessons");
  };

  const handleCreateVideo = async (values: NewLessonValues) => {
    try {
      // Create video in Firestore (reuse NewLessonValues type as it has same fields)
      await createEducationContent(values);
      
      // Refetch videos to update the list
      await refetchVideos();
      
      setLessonModalOpen(false);
      setActiveTab("videos");
    } catch (error: any) {
      console.error("Error creating video:", error);
      alert(error.message || "Failed to create video. Please try again.");
    }
  };

  const handleEditRequest = (item: ContentItem) => {
    setEditingItem(item);
    setEditModalOpen(true);
  };

  const handleUpdate = async (
    id: string,
    values: { title: string; category: string; visibility: Visibility; tier: MembershipTier }
  ) => {
    // Check if it's an article or video (from Firebase) or other item
    const isArticle = articles.some((item) => item.id === id);
    const isVideo = videos.some((item) => item.id === id);
    
    try {
      if (isArticle) {
        // Update article in Firestore
        await updateArticle(id, values);
        // Refetch articles to update the list
        await refetchArticles();
      } else if (isVideo) {
        // Update video in Firestore
        await updateEducationContent(id, values);
        // Refetch videos to update the list
        await refetchVideos();
      } else {
        // Update other items in local state
        setOtherItems((prev) =>
          prev.map((it) =>
            it.id === id
              ? { ...it, title: values.title, category: values.category, visibility: values.visibility, tier: values.tier, lastUpdated: new Date().toISOString().slice(0, 10) }
              : it
          )
        );
      }
      
      setEditingItem(null);
      setEditModalOpen(false);
    } catch (error: any) {
      console.error("Error updating item:", error);
      alert(error.message || "Failed to update item. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this item? This action cannot be undone.");
    if (!confirmed) return;
    
    // Check if it's an article or video (from Firebase) or other item
    const isArticle = articles.some((item) => item.id === id);
    const isVideo = videos.some((item) => item.id === id);
    
    try {
      if (isArticle) {
        // Delete article from Firestore
        await deleteArticle(id);
        // Refetch articles to update the list
        await refetchArticles();
      } else if (isVideo) {
        // Delete video from Firestore
        await deleteEducationContent(id);
        // Refetch videos to update the list
        await refetchVideos();
      } else {
        // Delete from other items
        setOtherItems((prev) => prev.filter((it) => it.id !== id));
      }
      
      if (editingItem && editingItem.id === id) {
        setEditingItem(null);
        setEditModalOpen(false);
      }
    } catch (error: any) {
      console.error("Error deleting item:", error);
      alert(error.message || "Failed to delete item. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Management"
        description="Manage all educational and static content shown in the app."
        rightContent={
          <>
            {activeTab === "videos" && (
              <Button
                variant="secondary"
                onClick={() => setLessonModalOpen(true)}
              >
                New Video
              </Button>
            )}
            {activeTab !== "videos" && (
              <Button
                variant="secondary"
                onClick={() => setLessonModalOpen(true)}
              >
                New Lesson
              </Button>
            )}
            <Button onClick={() => setArticleModalOpen(true)}>
              New Article
            </Button>
          </>
        }
      />

      <ContentTabs value={activeTab} onChange={setActiveTab} />

      {activeTab === "articles" && articlesLoading && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-gray-800">
          <p className="text-sm text-gray-500">Loading articles...</p>
        </div>
      )}

      {activeTab === "articles" && articlesError && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-gray-800">
          <p className="text-sm text-red-600">Error: {articlesError}</p>
        </div>
      )}

      {activeTab === "videos" && videosLoading && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-gray-800">
          <p className="text-sm text-gray-500">Loading videos...</p>
        </div>
      )}

      {activeTab === "videos" && videosError && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-gray-800">
          <p className="text-sm text-red-600">Error: {videosError}</p>
        </div>
      )}

      {!(activeTab === "articles" && articlesLoading) && 
       !(activeTab === "articles" && articlesError) &&
       !(activeTab === "videos" && videosLoading) &&
       !(activeTab === "videos" && videosError) && (
        <ContentTable items={filteredItems} onEdit={handleEditRequest} onDelete={handleDelete} />
      )}

      <NewArticleModal
        open={articleModalOpen}
        onClose={() => setArticleModalOpen(false)}
        onCreate={handleCreateArticle}
      />

      <NewLessonModal
        open={lessonModalOpen}
        onClose={() => setLessonModalOpen(false)}
        onCreate={activeTab === "videos" ? handleCreateVideo : handleCreateLesson}
      />

      {/* Edit modal - reuse modals with initialValues/onUpdate */}
      {editingItem && editingItem.kind === "article" && (
        <NewArticleModal
          open={editModalOpen}
          onClose={() => {
            setEditingItem(null);
            setEditModalOpen(false);
          }}
          initialValues={{
            title: editingItem.title,
            category: editingItem.category,
            visibility: editingItem.visibility,
            tier: editingItem.tier,
          }}
          onCreate={() => {}}
          onUpdate={(values) => handleUpdate(editingItem.id, values)}
        />
      )}

      {editingItem && editingItem.kind === "lesson" && (
        <NewLessonModal
          open={editModalOpen}
          onClose={() => {
            setEditingItem(null);
            setEditModalOpen(false);
          }}
          initialValues={{
            title: editingItem.title,
            category: editingItem.category,
            visibility: editingItem.visibility,
            tier: editingItem.tier,
          }}
          onCreate={() => {}}
          onUpdate={(values) => handleUpdate(editingItem.id, values)}
        />
      )}

      {editingItem && editingItem.kind === "video" && (
        <NewLessonModal
          open={editModalOpen}
          onClose={() => {
            setEditingItem(null);
            setEditModalOpen(false);
          }}
          initialValues={{
            title: editingItem.title,
            category: editingItem.category,
            visibility: editingItem.visibility,
            tier: editingItem.tier,
          }}
          onCreate={() => {}}
          onUpdate={(values) => handleUpdate(editingItem.id, values)}
        />
      )}
    </div>
  );
};

export default ContentManagementPage;
