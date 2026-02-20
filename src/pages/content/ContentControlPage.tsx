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
import NewVideoModal, {
  type NewVideoValues,
} from "../../components/content/NewVideoModal";
import NewLinkModal, {
  type NewLinkValues,
} from "../../components/content/NewLinkModal";
import NewStaticPageModal, {
  type NewStaticPageValues,
} from "../../components/content/NewStaticPageModal";
import { useArticles } from "../../hooks/useArticles";
import { useEducationContent } from "../../hooks/useEducationContent";
import { useLessons } from "../../hooks/useLessons";
import { useCreditResourceLinks } from "../../hooks/useCreditResourceLinks";
import { useStaticPages } from "../../hooks/useStaticPages";
import { createArticle, updateArticle, deleteArticle, getArticleById } from "../../services/articlesService";
import { createEducationContent, updateEducationContent, deleteEducationContent } from "../../services/educationContentService";
import { createLesson, updateLesson, deleteLesson, getLessonById } from "../../services/lessonsService";
import { createCreditResourceLink, updateCreditResourceLink, deleteCreditResourceLink, getCreditResourceLinkById } from "../../services/creditResourceLinksService";
import { createStaticPage, updateStaticPage, deleteStaticPage, getStaticPageById } from "../../services/staticPagesService";

const ContentManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ContentTab>("articles");

  // Fetch articles from Firebase
  const { articles, loading: articlesLoading, error: articlesError, refetch: refetchArticles } = useArticles();

  // Fetch videos from Firebase
  const { videos, loading: videosLoading, error: videosError, refetch: refetchVideos } = useEducationContent();

  // Fetch lessons from Firebase
  const { lessons, loading: lessonsLoading, error: lessonsError, refetch: refetchLessons } = useLessons();

  // Fetch credit resource links from Firebase
  const { links, loading: linksLoading, error: linksError, refetch: refetchLinks } = useCreditResourceLinks();

  // Fetch static pages from Firebase
  const { staticPages, loading: staticPagesLoading, error: staticPagesError, refetch: refetchStaticPages } = useStaticPages();

  // All content types are now fetched from Firebase
  const [otherItems] = useState<ContentItem[]>([]);

  const [articleModalOpen, setArticleModalOpen] = useState(false);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [staticPageModalOpen, setStaticPageModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingArticleData, setEditingArticleData] = useState<NewArticleValues | null>(null);
  const [editingLessonData, setEditingLessonData] = useState<NewLessonValues | null>(null);
  const [editingLinkData, setEditingLinkData] = useState<NewLinkValues | null>(null);
  const [editingStaticPageData, setEditingStaticPageData] = useState<NewStaticPageValues | null>(null);

  // Combine Firebase articles, videos, lessons, links, static pages with other items
  const allItems = useMemo(() => {
    return [...articles, ...videos, ...lessons, ...links, ...staticPages, ...otherItems];
  }, [articles, videos, lessons, links, staticPages, otherItems]);

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

  const handleCreateLesson = async (values: NewLessonValues) => {
    try {
      // Create lesson in Firestore
      await createLesson(values);
      
      // Refetch lessons to update the list
      await refetchLessons();
      
      setLessonModalOpen(false);
      setActiveTab("lessons");
    } catch (error: any) {
      console.error("Error creating lesson:", error);
      alert(error.message || "Failed to create lesson. Please try again.");
    }
  };

  const handleCreateVideo = async (values: NewVideoValues) => {
    try {
      // Create video in Firestore
      await createEducationContent(values);
      
      // Refetch videos to update the list
      await refetchVideos();
      
      setVideoModalOpen(false);
      setActiveTab("videos");
    } catch (error: any) {
      console.error("Error creating video:", error);
      alert(error.message || "Failed to create video. Please try again.");
    }
  };

  const handleCreateLink = async (values: NewLinkValues) => {
    try {
      // Create link in Firestore
      await createCreditResourceLink(values);
      
      // Refetch links to update the list
      await refetchLinks();
      
      setLinkModalOpen(false);
      setActiveTab("links");
    } catch (error: any) {
      console.error("Error creating credit resource link:", error);
      alert(error.message || "Failed to create credit resource link. Please try again.");
    }
  };

  const handleCreateStaticPage = async (values: NewStaticPageValues) => {
    try {
      // Create static page in Firestore
      await createStaticPage(values);
      
      // Refetch static pages to update the list
      await refetchStaticPages();
      
      setStaticPageModalOpen(false);
      setActiveTab("static");
    } catch (error: any) {
      console.error("Error creating static page:", error);
      alert(error.message || "Failed to create static page. Please try again.");
    }
  };

  const handleEditRequest = async (item: ContentItem) => {
    setEditingItem(item);
    
    // If it's an article, fetch the full article data including content
    if (item.kind === "article") {
      try {
        const articleData = await getArticleById(item.id);
        if (articleData) {
          setEditingArticleData(articleData);
        } else {
          setEditingArticleData({
            title: item.title,
            category: item.category,
            content: "",
            visibility: item.visibility,
            tier: item.tier,
          });
        }
      } catch (error) {
        console.error("Error fetching article data:", error);
        setEditingArticleData({
          title: item.title,
          category: item.category,
          content: "",
          visibility: item.visibility,
          tier: item.tier,
        });
      }
    }
    
    // If it's a lesson, fetch the full lesson data including content
    if (item.kind === "lesson") {
      try {
        const lessonData = await getLessonById(item.id);
        if (lessonData) {
          setEditingLessonData({
            title: lessonData.title,
            category: lessonData.sectionLabel,
            content: lessonData.content,
            visibility: lessonData.visibility,
            tier: lessonData.requiredTier,
          });
        } else {
          setEditingLessonData({
            title: item.title,
            category: item.category,
            content: "",
            visibility: item.visibility,
            tier: item.tier,
          });
        }
      } catch (error) {
        console.error("Error fetching lesson data:", error);
        setEditingLessonData({
          title: item.title,
          category: item.category,
          content: "",
          visibility: item.visibility,
          tier: item.tier,
        });
      }
    }
    
    // If it's a link, fetch the full link data including URL and description
    if (item.kind === "link") {
      try {
        const linkData = await getCreditResourceLinkById(item.id);
        if (linkData) {
          setEditingLinkData({
            title: linkData.title,
            category: linkData.sectionLabel,
            url: linkData.url,
            description: linkData.description,
            visibility: linkData.visibility,
            tier: linkData.requiredTier,
          });
        } else {
          setEditingLinkData({
            title: item.title,
            category: item.category,
            url: "",
            description: "",
            visibility: item.visibility,
            tier: item.tier,
          });
        }
      } catch (error) {
        console.error("Error fetching link data:", error);
        setEditingLinkData({
          title: item.title,
          category: item.category,
          url: "",
          description: "",
          visibility: item.visibility,
          tier: item.tier,
        });
      }
    }
    
    // If it's a static page, fetch the full page data including content and SEO fields
    if (item.kind === "page") {
      try {
        const pageData = await getStaticPageById(item.id);
        if (pageData) {
          setEditingStaticPageData({
            title: pageData.title,
            slug: pageData.slug,
            category: pageData.sectionLabel,
            content: pageData.content,
            previewContent: pageData.previewContent,
            metaTitle: pageData.metaTitle,
            metaDescription: pageData.metaDescription,
            visibility: pageData.visibility,
            tier: pageData.requiredTier,
          });
        } else {
          setEditingStaticPageData({
            title: item.title,
            slug: "",
            category: item.category,
            content: "",
            previewContent: "",
            metaTitle: "",
            metaDescription: "",
            visibility: item.visibility,
            tier: item.tier,
          });
        }
      } catch (error) {
        console.error("Error fetching static page data:", error);
        setEditingStaticPageData({
          title: item.title,
          slug: "",
          category: item.category,
          content: "",
          previewContent: "",
          metaTitle: "",
          metaDescription: "",
          visibility: item.visibility,
          tier: item.tier,
        });
      }
    }
    
    setEditModalOpen(true);
  };

  const handleUpdate = async (
    id: string,
    values: { 
      title: string; 
      category: string; 
      content?: string;
      slug?: string;
      previewContent?: string;
      metaTitle?: string;
      metaDescription?: string;
      videoUrl?: string;
      thumbnailUrl?: string;
      duration?: string;
      url?: string;
      description?: string;
      visibility: Visibility; 
      tier: MembershipTier;
    }
  ) => {
    // Check if it's an article, video, lesson, link, or static page (from Firebase) or other item
    const isArticle = articles.some((item) => item.id === id);
    const isVideo = videos.some((item) => item.id === id);
    const isLesson = lessons.some((item) => item.id === id);
    const isLink = links.some((item) => item.id === id);
    const isStaticPage = staticPages.some((item) => item.id === id);
    
    try {
      if (isArticle) {
        // Update article in Firestore (content is required for articles)
        if (values.content !== undefined) {
          await updateArticle(id, {
            title: values.title,
            category: values.category,
            content: values.content,
            visibility: values.visibility,
            tier: values.tier,
          });
        }
        await refetchArticles();
      } else if (isVideo) {
        // Update video in Firestore
        await updateEducationContent(id, {
          title: values.title,
          category: values.category,
          videoUrl: values.videoUrl,
          thumbnailUrl: values.thumbnailUrl,
          duration: values.duration,
          visibility: values.visibility,
          tier: values.tier,
        });
        await refetchVideos();
      } else if (isLesson) {
        // Update lesson in Firestore (content is required for lessons)
        if (values.content !== undefined) {
          await updateLesson(id, {
            title: values.title,
            category: values.category,
            content: values.content,
            visibility: values.visibility,
            tier: values.tier,
          });
        }
        await refetchLessons();
      } else if (isLink) {
        // Update link in Firestore (url is required for links)
        if (values.url !== undefined) {
          await updateCreditResourceLink(id, {
            title: values.title,
            category: values.category,
            url: values.url,
            description: values.description,
            visibility: values.visibility,
            tier: values.tier,
          });
        }
        await refetchLinks();
      } else if (isStaticPage) {
        // Update static page in Firestore (content and slug are required for static pages)
        if (values.content !== undefined && values.slug !== undefined) {
          await updateStaticPage(id, {
            title: values.title,
            slug: values.slug,
            category: values.category,
            content: values.content,
            previewContent: values.previewContent,
            metaTitle: values.metaTitle,
            metaDescription: values.metaDescription,
            visibility: values.visibility,
            tier: values.tier,
          });
        }
        await refetchStaticPages();
      }
      
      setEditingItem(null);
      setEditingArticleData(null);
      setEditingLessonData(null);
      setEditingLinkData(null);
      setEditingStaticPageData(null);
      setEditModalOpen(false);
    } catch (error: any) {
      console.error("Error updating item:", error);
      alert(error.message || "Failed to update item. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this item? This action cannot be undone.");
    if (!confirmed) return;
    
    // Check if it's an article, video, lesson, link, or static page (from Firebase) or other item
    const isArticle = articles.some((item) => item.id === id);
    const isVideo = videos.some((item) => item.id === id);
    const isLesson = lessons.some((item) => item.id === id);
    const isLink = links.some((item) => item.id === id);
    const isStaticPage = staticPages.some((item) => item.id === id);
    
    try {
      if (isArticle) {
        await deleteArticle(id);
        await refetchArticles();
      } else if (isVideo) {
        await deleteEducationContent(id);
        await refetchVideos();
      } else if (isLesson) {
        await deleteLesson(id);
        await refetchLessons();
      } else if (isLink) {
        await deleteCreditResourceLink(id);
        await refetchLinks();
      } else if (isStaticPage) {
        await deleteStaticPage(id);
        await refetchStaticPages();
      }
      
      if (editingItem && editingItem.id === id) {
        setEditingItem(null);
        setEditingArticleData(null);
        setEditingLessonData(null);
        setEditingLinkData(null);
        setEditingStaticPageData(null);
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
            {activeTab === "videos" ? (
              <Button variant="secondary" onClick={() => setVideoModalOpen(true)}>
                New Video
              </Button>
            ) : activeTab === "lessons" ? (
              <Button variant="secondary" onClick={() => setLessonModalOpen(true)}>
                New Lesson
              </Button>
            ) : activeTab === "links" ? (
              <Button variant="secondary" onClick={() => setLinkModalOpen(true)}>
                New Link
              </Button>
            ) : activeTab === "static" ? (
              <Button variant="secondary" onClick={() => setStaticPageModalOpen(true)}>
                New Page
              </Button>
            ) : (
              <Button onClick={() => setArticleModalOpen(true)}>
                New Article
              </Button>
            )}
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

      {activeTab === "lessons" && lessonsLoading && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-gray-800">
          <p className="text-sm text-gray-500">Loading lessons...</p>
        </div>
      )}

      {activeTab === "lessons" && lessonsError && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-gray-800">
          <p className="text-sm text-red-600">Error: {lessonsError}</p>
        </div>
      )}

      {activeTab === "links" && linksLoading && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-gray-800">
          <p className="text-sm text-gray-500">Loading credit resource links...</p>
        </div>
      )}

      {activeTab === "links" && linksError && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-gray-800">
          <p className="text-sm text-red-600">Error: {linksError}</p>
        </div>
      )}

      {activeTab === "static" && staticPagesLoading && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-gray-800">
          <p className="text-sm text-gray-500">Loading static pages...</p>
        </div>
      )}

      {activeTab === "static" && staticPagesError && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-gray-800">
          <p className="text-sm text-red-600">Error: {staticPagesError}</p>
        </div>
      )}

      {!(activeTab === "articles" && articlesLoading) && 
       !(activeTab === "articles" && articlesError) &&
       !(activeTab === "videos" && videosLoading) &&
       !(activeTab === "videos" && videosError) &&
       !(activeTab === "lessons" && lessonsLoading) &&
       !(activeTab === "lessons" && lessonsError) &&
       !(activeTab === "links" && linksLoading) &&
       !(activeTab === "links" && linksError) &&
       !(activeTab === "static" && staticPagesLoading) &&
       !(activeTab === "static" && staticPagesError) && (
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
        onCreate={handleCreateLesson}
      />

      <NewVideoModal
        open={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        onCreate={handleCreateVideo}
      />

      <NewLinkModal
        open={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        onCreate={handleCreateLink}
      />

      <NewStaticPageModal
        open={staticPageModalOpen}
        onClose={() => setStaticPageModalOpen(false)}
        onCreate={handleCreateStaticPage}
      />

      {/* Edit modal - reuse modals with initialValues/onUpdate */}
      {editingItem && editingItem.kind === "article" && (
        <NewArticleModal
          open={editModalOpen}
          onClose={() => {
            setEditingItem(null);
            setEditingArticleData(null);
            setEditModalOpen(false);
          }}
          initialValues={editingArticleData || {
            title: editingItem.title,
            category: editingItem.category,
            content: "",
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
            setEditingLessonData(null);
            setEditModalOpen(false);
          }}
          initialValues={editingLessonData || {
            title: editingItem.title,
            category: editingItem.category,
            content: "",
            visibility: editingItem.visibility,
            tier: editingItem.tier,
          }}
          onCreate={() => {}}
          onUpdate={(values) => handleUpdate(editingItem.id, values)}
        />
      )}

      {editingItem && editingItem.kind === "video" && (
        <NewVideoModal
          open={editModalOpen}
          onClose={() => {
            setEditingItem(null);
            setEditModalOpen(false);
          }}
          initialValues={{
            title: editingItem.title,
            category: editingItem.category,
            videoUrl: "", // Existing video URL (will be kept if not changed)
            thumbnailUrl: "",
            duration: "",
            visibility: editingItem.visibility,
            tier: editingItem.tier,
          }}
          onCreate={() => {}}
          onUpdate={(values) => handleUpdate(editingItem.id, values)}
        />
      )}

      {editingItem && editingItem.kind === "link" && (
        <NewLinkModal
          open={editModalOpen}
          onClose={() => {
            setEditingItem(null);
            setEditingLinkData(null);
            setEditModalOpen(false);
          }}
          initialValues={editingLinkData || {
            title: editingItem.title,
            category: editingItem.category,
            url: "",
            description: "",
            visibility: editingItem.visibility,
            tier: editingItem.tier,
          }}
          onCreate={() => {}}
          onUpdate={(values) => handleUpdate(editingItem.id, values)}
        />
      )}

      {editingItem && editingItem.kind === "page" && (
        <NewStaticPageModal
          open={editModalOpen}
          onClose={() => {
            setEditingItem(null);
            setEditingStaticPageData(null);
            setEditModalOpen(false);
          }}
          initialValues={editingStaticPageData || {
            title: editingItem.title,
            slug: "",
            category: editingItem.category,
            content: "",
            previewContent: "",
            metaTitle: "",
            metaDescription: "",
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
