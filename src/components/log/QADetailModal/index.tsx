'use client';

import React from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { QAComment, QAKnowledge, QAReply, QAUser } from '@/types/qa';
import { stripEmojis } from '@/lib/text';
import Tag from '@/components/common/Tag';
import styles from './QADetailModal.module.css';

interface QADetailModalProps {
  qa: QAKnowledge;
  isOpen: boolean;
  onClose: () => void;
  onFeedback?: (qaId: string, type: 'useful' | 'useless') => void;
}

const categoryNames = {
  practical: '实操技巧',
  pitfall: '避坑指南',
  logic: '底层逻辑',
};

type LocalComment = {
  id: string;
  author: QAUser;
  content: string;
  images: string[];
  createdAt: Date;
  status?: 'sending' | 'error';
  likes?: number;
  likedUserIds?: string[];
  replies?: QAReply[];
};

export default function QADetailModal({ qa, isOpen, onClose, onFeedback }: QADetailModalProps) {
  const [userFeedback, setUserFeedback] = React.useState<'useful' | 'useless' | null>(null);
  const [commentInput, setCommentInput] = React.useState('');
  const [remoteComments, setRemoteComments] = React.useState<QAComment[]>(qa.comments || []);
  const [localComments, setLocalComments] = React.useState<LocalComment[]>([]);
  const [commentLikeState, setCommentLikeState] = React.useState<Record<string, { count: number; liked: boolean }>>({});
  const [replyLikeState, setReplyLikeState] = React.useState<Record<string, { count: number; liked: boolean }>>({});
  const [replyInputs, setReplyInputs] = React.useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = React.useState<string | null>(null);
  const [replyTargets, setReplyTargets] = React.useState<
    Record<string, { replyTo?: { id: string; name: string } }>
  >({});
  const [replyPendingImages, setReplyPendingImages] = React.useState<
    Record<
      string,
      { id: string; url: string; status: 'uploading' | 'done' | 'error'; progress: number; file?: File }[]
    >
  >({});
  const [commentSubmitError, setCommentSubmitError] = React.useState<string | null>(null);
  const [replySubmitError, setReplySubmitError] = React.useState<Record<string, string>>({});
  const [commentUploadError, setCommentUploadError] = React.useState<string | null>(null);
  const [replyUploadError, setReplyUploadError] = React.useState<Record<string, string>>({});
  const [commentDragOver, setCommentDragOver] = React.useState(false);
  const [replyDragOver, setReplyDragOver] = React.useState<Record<string, boolean>>({});
  const [commentSort, setCommentSort] = React.useState('smart');
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const [showReplyEmojiPicker, setShowReplyEmojiPicker] = React.useState<Record<string, boolean>>({});
  const [liked, setLiked] = React.useState(false);
  const [favorited, setFavorited] = React.useState(false);
  const [shareCount, setShareCount] = React.useState(0);
  const [likedCount, setLikedCount] = React.useState(0);
  const [favoriteCount, setFavoriteCount] = React.useState(0);
  const [pendingImages, setPendingImages] = React.useState<
    { id: string; url: string; status: 'uploading' | 'done' | 'error'; progress: number; file?: File }[]
  >([]);
  const [visibleCount, setVisibleCount] = React.useState(6);
  const [isLoadingComments, setIsLoadingComments] = React.useState(false);
  const [commentLoadError, setCommentLoadError] = React.useState<string | null>(null);
  const [lightbox, setLightbox] = React.useState<{
    isOpen: boolean;
    images: string[];
    index: number;
    originRect?: DOMRect;
  }>({ isOpen: false, images: [], index: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const lightboxRef = React.useRef<HTMLDivElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const replyFileInputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});
  const commentInputRef = React.useRef<HTMLTextAreaElement | null>(null);
  const dragRef = React.useRef<{ x: number; y: number } | null>(null);
  const pinchRef = React.useRef<{ dist: number; zoom: number } | null>(null);
  const swipeRef = React.useRef<{ x: number; y: number } | null>(null);
  const uploadTimersRef = React.useRef<Record<string, number>>({});

  React.useEffect(() => {
    if (!lightbox.isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeLightbox();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightbox.isOpen]);

  if (!isOpen) return null;

  const extractCoreConclusion = (text: string): string => {
    const cleanText = text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,6}\s/g, '');
    const lines = cleanText.split('\n').filter((line) => line.trim());
    if (lines.length > 0) {
      return lines[0];
    }
    return cleanText.substring(0, 80);
  };

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const dedupeMarkdownLines = (text: string): string => {
    const lines = text.split('\n');
    const output: string[] = [];
    const seen = new Set<string>();
    const normalize = (value: string) => {
      const cleaned = value.replace(/^[-*\\d\\.]+\\s*/, '');
      return cleaned.replace(/[^\\p{L}\\p{N}]+/gu, '').toLowerCase();
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        output.push(line);
        continue;
      }
      const key = normalize(trimmed);
      if (key.length > 3 && seen.has(key)) {
        continue;
      }
      if (key.length > 3) {
        seen.add(key);
      }
      output.push(line);
    }
    return output.join('\n');
  };

  const emphasizeKeywords = (text: string): string => {
    const keywords = ['转化率', '流量池', '留存', '冷启动', '权重', '推荐', '复购', 'ROI'];
    return keywords.reduce((acc, keyword) => {
      const pattern = new RegExp(`(?<!\\*\\*)${escapeRegExp(keyword)}(?!\\*\\*)`, 'g');
      return acc.replace(pattern, `**${keyword}**`);
    }, text);
  };

  const safeAnswer = qa.answer ?? '';
  const safeQuestion = qa.question ?? '';
  const safeTags = qa.tags ?? [];
  const feedbackUseful = qa.feedback?.useful ?? 0;
  const feedbackUseless = qa.feedback?.useless ?? 0;
  const sanitizedAnswer = dedupeMarkdownLines(stripEmojis(safeAnswer));
  const sanitizedQuestion = stripEmojis(safeQuestion);
  const coreConclusion = extractCoreConclusion(sanitizedAnswer);
  const richTextContent = emphasizeKeywords(sanitizedAnswer);
  const isCommentEmpty = commentInput.trim().length === 0 && pendingImages.length === 0;
  const hasUploadingImages = pendingImages.some((img) => img.status === 'uploading');
  const hasErrorImages = pendingImages.some((img) => img.status === 'error');
  const apiOrigin = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const apiBase = `${apiOrigin}/api/qa`;
  const uploadEndpoint = `${apiOrigin}/api/upload`;

  const fetchComments = React.useCallback(async () => {
    setIsLoadingComments(true);
    setCommentLoadError(null);
    try {
      const response = await fetch(`${apiBase}/${qa._id}/comments`);
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setRemoteComments(result.data);
      } else {
        setCommentLoadError(result.message || '评论加载失败');
      }
    } catch (error) {
      console.error('加载评论失败:', error);
      setCommentLoadError('评论加载失败');
    } finally {
      setIsLoadingComments(false);
    }
  }, [apiBase, qa._id]);

  const combinedComments = React.useMemo(() => {
    const qaComments = (remoteComments || []).map((comment) => ({
      ...comment,
      createdAt: comment.createdAt ? new Date(comment.createdAt) : undefined,
      isLocal: false,
    }));
    const local = localComments.map((comment) => ({
      ...comment,
      createdAt: comment.createdAt ? new Date(comment.createdAt) : undefined,
      isLocal: true,
      status: comment.status,
    }));
    return [...qaComments, ...local];
  }, [remoteComments, localComments]);

  React.useEffect(() => {
    setRemoteComments(qa.comments || []);
  }, [qa.comments, qa._id]);

  React.useEffect(() => {
    if (!isOpen) return;
    setVisibleCount(6);
    fetchComments();
  }, [fetchComments, isOpen, qa._id]);

  React.useEffect(() => {
    setVisibleCount(6);
  }, [commentSort]);

  React.useEffect(() => {
    setCommentLikeState((prev) => {
      const next = { ...prev };
      combinedComments.forEach((comment) => {
        if (!next[comment.id]) {
          const likeCount =
            'likes' in comment && typeof comment.likes === 'number' ? comment.likes : 0;
          next[comment.id] = {
            count: likeCount,
            liked: false,
          };
        }
      });
      return next;
    });
    setReplyLikeState((prev) => {
      const next = { ...prev };
      combinedComments.forEach((comment) => {
        (comment.replies || []).forEach((reply) => {
          if (!next[reply.id]) {
            next[reply.id] = { count: reply.likes ?? 0, liked: false };
          }
        });
      });
      return next;
    });
  }, [combinedComments]);

  const sortedComments = React.useMemo(() => {
    const list = [...combinedComments];
    const now = Date.now();
    const getTime = (date?: Date) => (date ? new Date(date).getTime() : 0);
    const getHeat = (content: string, images?: string[], date?: Date) => {
      const hours = Math.max(1, (now - getTime(date)) / (1000 * 60 * 60));
      const lengthScore = Math.min(content.length / 120, 2);
      const imageScore = Math.min(images?.length || 0, 3) * 0.6;
      return (lengthScore + imageScore) / hours;
    };
    if (commentSort === 'latest') {
      return list.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
    }
    if (commentSort === 'hot') {
      return list.sort(
        (a, b) => getHeat(b.content, b.images, b.createdAt) - getHeat(a.content, a.images, a.createdAt)
      );
    }
    return list.sort((a, b) => {
      const aTime = getTime(a.createdAt);
      const bTime = getTime(b.createdAt);
      const aScore = getHeat(a.content, a.images, a.createdAt) + Math.min(2, aTime / now);
      const bScore = getHeat(b.content, b.images, b.createdAt) + Math.min(2, bTime / now);
      return bScore - aScore;
    });
  }, [combinedComments, commentSort]);

  const pagedComments = React.useMemo(
    () => sortedComments.slice(0, visibleCount),
    [sortedComments, visibleCount]
  );

  const likedUsers = qa.likedUsers || [];
  const avatarStack = likedUsers.slice(0, 6);

  const handleFeedback = (type: 'useful' | 'useless') => {
    setUserFeedback(type);
    onFeedback?.(qa._id, type);
  };

  React.useEffect(() => {
    setLikedCount(feedbackUseful);
    setFavoriteCount(0);
  }, [feedbackUseful]);

  React.useEffect(() => {
    return () => {
      Object.values(uploadTimersRef.current).forEach((timerId) => {
        window.clearInterval(timerId);
      });
      uploadTimersRef.current = {};
    };
  }, []);

  const handleAddComment = () => {
    const value = commentInput.trim();
    if (!value && pendingImages.length === 0) return;
    if (hasUploadingImages) {
      setCommentSubmitError('图片还在上传中，请稍等完成后再发布');
      return;
    }
    if (hasErrorImages) {
      setCommentSubmitError('有图片上传失败，请先重试或移除失败图片');
      return;
    }
    const images = pendingImages.filter((img) => img.status === 'done').map((img) => img.url);
    const tempId = `local-${Date.now()}`;
    const optimistic: LocalComment = {
      id: tempId,
      author: { id: 'local', name: '船友', role: 'member' },
      content: value,
      images,
      createdAt: new Date(),
      status: 'sending' as const,
    };
    setLocalComments((prev) => [...prev, optimistic]);
    setCommentInput('');
    setPendingImages([]);
    setCommentSubmitError(null);
    const submit = async () => {
      try {
        const response = await fetch(`${apiBase}/${qa._id}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            author: optimistic.author,
            content: value,
            images,
          }),
        });
        const result = await response.json();
        if (result.success && result.data) {
          setRemoteComments((prev) => [...prev, result.data]);
          setLocalComments((prev) => prev.filter((comment) => comment.id !== tempId));
          return;
        }
        setLocalComments((prev) =>
          prev.map((comment) => (comment.id === tempId ? { ...comment, status: 'error' } : comment))
        );
        setCommentSubmitError(result.message || '评论发送失败');
      } catch (error) {
        console.error('提交评论失败:', error);
        setLocalComments((prev) =>
          prev.map((comment) => (comment.id === tempId ? { ...comment, status: 'error' } : comment))
        );
        setCommentSubmitError('评论发送失败');
      }
    };
    submit();
  };

  const handleRetryComment = (commentId: string) => {
    const target = localComments.find((comment) => comment.id === commentId);
    if (!target) return;
    setLocalComments((prev) =>
      prev.map((comment) => (comment.id === commentId ? { ...comment, status: 'sending' } : comment))
    );
    const submit = async () => {
      try {
        const response = await fetch(`${apiBase}/${qa._id}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            author: target.author,
            content: target.content,
            images: target.images,
          }),
        });
        const result = await response.json();
        if (result.success && result.data) {
          setRemoteComments((prev) => [...prev, result.data]);
          setLocalComments((prev) => prev.filter((comment) => comment.id !== commentId));
          return;
        }
        setLocalComments((prev) =>
          prev.map((comment) => (comment.id === commentId ? { ...comment, status: 'error' } : comment))
        );
      } catch (error) {
        console.error('重试评论失败:', error);
        setLocalComments((prev) =>
          prev.map((comment) => (comment.id === commentId ? { ...comment, status: 'error' } : comment))
        );
      }
    };
    submit();
  };

  const handleToggleCommentLike = async (commentId: string, isLocal?: boolean) => {
    setCommentLikeState((prev) => {
      const current = prev[commentId] || { count: 0, liked: false };
      const next = { ...prev };
      next[commentId] = {
        count: current.count + (current.liked ? -1 : 1),
        liked: !current.liked,
      };
      return next;
    });
    if (isLocal) return;
    try {
      await fetch(`${apiBase}/${qa._id}/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'local' }),
      });
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  const handleToggleReplyLike = async (commentId: string, replyId: string, isLocal?: boolean) => {
    setReplyLikeState((prev) => {
      const current = prev[replyId] || { count: 0, liked: false };
      const next = { ...prev };
      next[replyId] = {
        count: current.count + (current.liked ? -1 : 1),
        liked: !current.liked,
      };
      return next;
    });
    if (isLocal) return;
    try {
      await fetch(`${apiBase}/${qa._id}/comments/${commentId}/replies/${replyId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'local' }),
      });
    } catch (error) {
      console.error('回复点赞失败:', error);
    }
  };

  const handleToggleReplyBox = (commentId: string, authorName?: string) => {
    setActiveReplyId((prev) => (prev === commentId ? null : commentId));
    setShowReplyEmojiPicker((prev) => ({ ...prev, [commentId]: false }));
    if (authorName) {
      setReplyInputs((prev) => ({
        ...prev,
        [commentId]: prev[commentId] || `@${authorName} `,
      }));
      setReplyTargets((prev) => ({
        ...prev,
        [commentId]: { replyTo: { id: 'comment-author', name: authorName } },
      }));
    }
  };

  const handleReplyInputChange = (commentId: string, value: string) => {
    setReplyInputs((prev) => ({ ...prev, [commentId]: value }));
  };

  const maxImageCount = 6;
  const maxImageSize = 5 * 1024 * 1024;

  const startUploadProgress = React.useCallback((id: string, onProgress: (value: number) => void) => {
    if (uploadTimersRef.current[id]) {
      window.clearInterval(uploadTimersRef.current[id]);
    }
    let progress = 0;
    const timerId = window.setInterval(() => {
      progress = Math.min(progress + 8 + Math.random() * 12, 90);
      onProgress(Math.round(progress));
    }, 200);
    uploadTimersRef.current[id] = timerId;
    return () => {
      window.clearInterval(timerId);
      delete uploadTimersRef.current[id];
    };
  }, []);

  const uploadFileToServer = async (file: File) => {
    const formData = new FormData();
    formData.append('files', file);
    const response = await fetch(uploadEndpoint, {
      method: 'POST',
      body: formData,
    });
    let result: any = null;
    try {
      result = await response.json();
    } catch {
      result = null;
    }
    if (!response.ok || !result?.success) {
      throw new Error(result?.message || '上传失败');
    }
    const url = result.data?.[0]?.url;
    if (!url) {
      throw new Error('上传失败');
    }
    return url.startsWith('http') ? url : `${apiOrigin}${url}`;
  };

  const openFilePicker = (input: HTMLInputElement | null) => {
    if (!input) return;
    if (typeof (input as HTMLInputElement & { showPicker?: () => void }).showPicker === 'function') {
      (input as HTMLInputElement & { showPicker: () => void }).showPicker();
    } else {
      input.click();
    }
  };

  const extractImageFiles = (files: FileList | File[]) => {
    return Array.from(files).filter((file) => file.type.startsWith('image/'));
  };

  const extractImageFilesFromItems = (items: DataTransferItemList | null) => {
    if (!items) return [];
    const output: File[] = [];
    Array.from(items).forEach((item) => {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file && file.type.startsWith('image/')) {
          output.push(file);
        }
      }
    });
    return output;
  };

  const addCommentImages = async (files: File[]) => {
    if (files.length === 0) return;
    setCommentUploadError(null);
    const currentCount = pendingImages.length;
    if (currentCount >= maxImageCount) {
      setCommentUploadError(`最多上传${maxImageCount}张图片`);
      return;
    }
    const picked = files.slice(0, Math.max(0, maxImageCount - currentCount));
    let hasOversize = false;
    let hasValid = false;
    for (const file of picked) {
      if (file.size > maxImageSize) {
        hasOversize = true;
        continue;
      }
      hasValid = true;
      const id = `img-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const previewUrl = URL.createObjectURL(file);
      setPendingImages((prev) => [
        ...prev,
        { id, url: previewUrl, status: 'uploading', progress: 0, file },
      ]);
      const stopProgress = startUploadProgress(id, (progress) => {
        updatePendingImage(id, { progress });
      });
      try {
        const blob = await compressImage(file);
        const uploadFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
          type: 'image/jpeg',
        });
        const url = await uploadFileToServer(uploadFile);
        stopProgress();
        updatePendingImage(id, { url, status: 'done', progress: 100, file });
      } catch {
        stopProgress();
        updatePendingImage(id, { status: 'error', progress: 0 });
        setCommentUploadError('图片上传失败，请重试');
      }
    }
    if (hasOversize) {
      setCommentUploadError(`图片大小不能超过${Math.round(maxImageSize / 1024 / 1024)}MB`);
    }
    if (!hasValid && !hasOversize) {
      setCommentUploadError('没有可上传的图片');
    }
  };

  const addReplyImages = async (commentId: string, files: File[]) => {
    if (files.length === 0) return;
    setReplyUploadError((prev) => ({ ...prev, [commentId]: '' }));
    const currentList = replyPendingImages[commentId] || [];
    if (currentList.length >= maxImageCount) {
      setReplyUploadError((prev) => ({ ...prev, [commentId]: `最多上传${maxImageCount}张图片` }));
      return;
    }
    const picked = files.slice(0, Math.max(0, maxImageCount - currentList.length));
    let hasOversize = false;
    let hasValid = false;
    for (const file of picked) {
      if (file.size > maxImageSize) {
        hasOversize = true;
        continue;
      }
      hasValid = true;
      const id = `reply-img-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const previewUrl = URL.createObjectURL(file);
      setReplyPendingImages((prev) => ({
        ...prev,
        [commentId]: [
          ...(prev[commentId] || []),
          { id, url: previewUrl, status: 'uploading', progress: 0, file },
        ],
      }));
      const stopProgress = startUploadProgress(id, (progress) => {
        updateReplyImage(commentId, id, { progress });
      });
      try {
        const blob = await compressImage(file);
        const uploadFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
          type: 'image/jpeg',
        });
        const url = await uploadFileToServer(uploadFile);
        stopProgress();
        updateReplyImage(commentId, id, { url, status: 'done', progress: 100, file });
      } catch {
        stopProgress();
        updateReplyImage(commentId, id, { status: 'error', progress: 0 });
        setReplyUploadError((prev) => ({ ...prev, [commentId]: '图片上传失败，请重试' }));
      }
    }
    if (hasOversize) {
      setReplyUploadError((prev) => ({
        ...prev,
        [commentId]: `图片大小不能超过${Math.round(maxImageSize / 1024 / 1024)}MB`,
      }));
    }
    if (!hasValid && !hasOversize) {
      setReplyUploadError((prev) => ({ ...prev, [commentId]: '没有可上传的图片' }));
    }
  };

  const handleCommentPaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = extractImageFilesFromItems(event.clipboardData?.items || null);
    if (files.length > 0) {
      event.preventDefault();
      void addCommentImages(files);
    }
  };

  const handleReplyPaste = (commentId: string, event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = extractImageFilesFromItems(event.clipboardData?.items || null);
    if (files.length > 0) {
      event.preventDefault();
      void addReplyImages(commentId, files);
    }
  };

  const handleCommentDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setCommentDragOver(false);
    const files = extractImageFiles(event.dataTransfer.files);
    if (files.length > 0) {
      void addCommentImages(files);
    }
  };

  const handleReplyDrop = (commentId: string, event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setReplyDragOver((prev) => ({ ...prev, [commentId]: false }));
    const files = extractImageFiles(event.dataTransfer.files);
    if (files.length > 0) {
      void addReplyImages(commentId, files);
    }
  };

  const updatePendingImage = React.useCallback(
    (
      id: string,
      patch: Partial<{ url: string; status: 'uploading' | 'done' | 'error'; progress: number; file?: File }>
    ) => {
      setPendingImages((prev) => prev.map((img) => (img.id === id ? { ...img, ...patch } : img)));
    },
    []
  );

  const updateReplyImage = React.useCallback(
    (
      commentId: string,
      id: string,
      patch: Partial<{ url: string; status: 'uploading' | 'done' | 'error'; progress: number; file?: File }>
    ) => {
      setReplyPendingImages((prev) => ({
        ...prev,
        [commentId]: (prev[commentId] || []).map((img) => (img.id === id ? { ...img, ...patch } : img)),
      }));
    },
    []
  );

  const handleSubmitReply = (commentId: string) => {
    if (commentId.startsWith('local-')) return;
    const content = (replyInputs[commentId] || '').trim();
    const replyTo = replyTargets[commentId]?.replyTo;
    const replyUploads = replyPendingImages[commentId] || [];
    const hasReplyUploading = replyUploads.some((img) => img.status === 'uploading');
    const hasReplyError = replyUploads.some((img) => img.status === 'error');
    const images = replyUploads.filter((img) => img.status === 'done').map((img) => img.url);
    if (!content && images.length === 0) return;
    if (hasReplyUploading) {
      setReplySubmitError((prev) => ({ ...prev, [commentId]: '图片还在上传中，请稍等完成后再发布' }));
      return;
    }
    if (hasReplyError) {
      setReplySubmitError((prev) => ({ ...prev, [commentId]: '有图片上传失败，请先重试或移除失败图片' }));
      return;
    }
    const optimistic: QAReply = {
      id: `reply-local-${Date.now()}`,
      author: { id: 'local', name: '船友', role: 'member' },
      content,
      replyTo: replyTo ? { id: replyTo.id, name: replyTo.name, role: 'member' } : undefined,
      images,
      createdAt: new Date(),
    };
    setRemoteComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? { ...comment, replies: [...(comment.replies || []), optimistic] }
          : comment
      )
    );
    setReplyInputs((prev) => ({ ...prev, [commentId]: '' }));
    setActiveReplyId(null);
    setShowReplyEmojiPicker((prev) => ({ ...prev, [commentId]: false }));
    setReplyPendingImages((prev) => ({ ...prev, [commentId]: [] }));
    setReplySubmitError((prev) => ({ ...prev, [commentId]: '' }));
    const submit = async () => {
      try {
        const response = await fetch(`${apiBase}/${qa._id}/comments/${commentId}/replies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            author: optimistic.author,
            content,
            replyTo,
            images,
          }),
        });
        const result = await response.json();
        if (result.success && result.data) {
          setRemoteComments((prev) =>
            prev.map((comment) =>
              comment.id === commentId
                ? {
                    ...comment,
                    replies: [
                      ...(comment.replies || []).filter((reply) => reply.id !== optimistic.id),
                      result.data,
                    ],
                  }
                : comment
            )
          );
          return;
        }
        setReplySubmitError((prev) => ({ ...prev, [commentId]: result.message || '回复发送失败' }));
      } catch (error) {
        console.error('提交回复失败:', error);
        setReplySubmitError((prev) => ({ ...prev, [commentId]: '回复发送失败' }));
      }
    };
    submit();
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const maxSize = 1080;
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('canvas'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (!blob) {
              reject(new Error('blob'));
              return;
            }
            resolve(blob);
          },
          'image/jpeg',
          0.85
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('image'));
      };
      img.src = url;
    });
  };

  const handleSelectImages = async (files: FileList | null) => {
    if (!files) return;
    await addCommentImages(extractImageFiles(files));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectReplyImages = async (commentId: string, files: FileList | null) => {
    if (!files) return;
    await addReplyImages(commentId, extractImageFiles(files));
    if (replyFileInputRefs.current[commentId]) {
      replyFileInputRefs.current[commentId]!.value = '';
    }
  };

  const handleRetryReplyImage = async (commentId: string, id: string) => {
    const target = (replyPendingImages[commentId] || []).find((img) => img.id === id);
    if (!target?.file) {
      setReplyUploadError((prev) => ({ ...prev, [commentId]: '原文件已丢失，请替换图片' }));
      return;
    }
    updateReplyImage(commentId, id, { status: 'uploading', progress: 0 });
    const stopProgress = startUploadProgress(id, (progress) => {
      updateReplyImage(commentId, id, { progress });
    });
    try {
      const blob = await compressImage(target.file);
      const uploadFile = new File([blob], target.file.name.replace(/\.[^/.]+$/, '.jpg'), {
        type: 'image/jpeg',
      });
      const url = await uploadFileToServer(uploadFile);
      stopProgress();
      updateReplyImage(commentId, id, { url, status: 'done', progress: 100 });
    } catch {
      stopProgress();
      updateReplyImage(commentId, id, { status: 'error', progress: 0 });
      setReplyUploadError((prev) => ({ ...prev, [commentId]: '图片上传失败，请重试' }));
    }
  };

  const handleRemoveReplyImage = (commentId: string, id: string) => {
    if (uploadTimersRef.current[id]) {
      window.clearInterval(uploadTimersRef.current[id]);
      delete uploadTimersRef.current[id];
    }
    setReplyPendingImages((prev) => {
      const target = (prev[commentId] || []).find((img) => img.id === id);
      if (target?.url?.startsWith('blob:')) {
        URL.revokeObjectURL(target.url);
      }
      return {
        ...prev,
        [commentId]: (prev[commentId] || []).filter((img) => img.id !== id),
      };
    });
  };

  const handleRetryImage = async (id: string) => {
    const target = pendingImages.find((img) => img.id === id);
    if (!target?.file) {
      setCommentUploadError('原文件已丢失，请替换图片');
      return;
    }
    updatePendingImage(id, { status: 'uploading', progress: 0 });
    const stopProgress = startUploadProgress(id, (progress) => {
      updatePendingImage(id, { progress });
    });
    try {
      const blob = await compressImage(target.file);
      const uploadFile = new File([blob], target.file.name.replace(/\.[^/.]+$/, '.jpg'), {
        type: 'image/jpeg',
      });
      const url = await uploadFileToServer(uploadFile);
      stopProgress();
      updatePendingImage(id, { url, status: 'done', progress: 100 });
    } catch {
      stopProgress();
      updatePendingImage(id, { status: 'error', progress: 0 });
      setCommentUploadError('图片上传失败，请重试');
    }
  };

  const handleRemoveImage = (id: string) => {
    if (uploadTimersRef.current[id]) {
      window.clearInterval(uploadTimersRef.current[id]);
      delete uploadTimersRef.current[id];
    }
    setPendingImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target?.url?.startsWith('blob:')) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleReplaceCommentImage = async (
    id: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > maxImageSize) {
      setCommentUploadError(`图片大小不能超过${Math.round(maxImageSize / 1024 / 1024)}MB`);
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    updatePendingImage(id, { url: previewUrl, status: 'uploading', progress: 0, file });
    const stopProgress = startUploadProgress(id, (progress) => {
      updatePendingImage(id, { progress });
    });
    try {
      const blob = await compressImage(file);
      const uploadFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
        type: 'image/jpeg',
      });
      const url = await uploadFileToServer(uploadFile);
      stopProgress();
      updatePendingImage(id, { url, status: 'done', progress: 100, file });
    } catch {
      stopProgress();
      updatePendingImage(id, { status: 'error', progress: 0 });
      setCommentUploadError('图片上传失败，请重试');
    }
  };

  const handleReplaceReplyImage = async (
    commentId: string,
    id: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > maxImageSize) {
      setReplyUploadError((prev) => ({
        ...prev,
        [commentId]: `图片大小不能超过${Math.round(maxImageSize / 1024 / 1024)}MB`,
      }));
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    updateReplyImage(commentId, id, { url: previewUrl, status: 'uploading', progress: 0, file });
    const stopProgress = startUploadProgress(id, (progress) => {
      updateReplyImage(commentId, id, { progress });
    });
    try {
      const blob = await compressImage(file);
      const uploadFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
        type: 'image/jpeg',
      });
      const url = await uploadFileToServer(uploadFile);
      stopProgress();
      updateReplyImage(commentId, id, { url, status: 'done', progress: 100, file });
    } catch {
      stopProgress();
      updateReplyImage(commentId, id, { status: 'error', progress: 0 });
      setReplyUploadError((prev) => ({ ...prev, [commentId]: '图片上传失败，请重试' }));
    }
  };

  const handleToggleLike = () => {
    setLiked((prev) => {
      const next = !prev;
      setLikedCount((count) => count + (next ? 1 : -1));
      return next;
    });
  };

  const handleToggleFavorite = () => {
    setFavorited((prev) => {
      const next = !prev;
      setFavoriteCount((count) => count + (next ? 1 : -1));
      return next;
    });
  };

  const handleShare = () => {
    setShareCount((count) => count + 1);
  };

  const focusCommentInput = () => {
    commentInputRef.current?.focus();
    commentInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const emojiLabels = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂',
    '🙂', '😉', '😊', '😇', '🥰', '😍', '😘',
    '😋', '😛', '😜', '🤪', '😝', '😎', '🤩',
    '🥳', '😏', '😐', '😑', '😶', '🙄', '🤔',
    '😴', '😌', '😮', '😯', '😲', '😳', '🥺',
    '😢', '😭', '😤', '😠', '😡', '🤗', '🤝',
    '👍', '👎', '👏', '🙏', '👌', '💪', '🔥',
    '🎉', '✨', '💯', '❤️', '🫶', '💙', '💚',
  ];
  const replyEmojiLabels = emojiLabels;

  const insertEmoji = (label: string) => {
    setCommentInput((prev) => `${prev}${label}`);
    setShowEmojiPicker(false);
    commentInputRef.current?.focus();
  };

  const insertReplyEmoji = (commentId: string, label: string) => {
    setReplyInputs((prev) => ({
      ...prev,
      [commentId]: `${prev[commentId] || ''}${label}`,
    }));
  };

  const openLightbox = (images: string[], index: number, rect?: DOMRect) => {
    setLightbox({ isOpen: true, images, index, originRect: rect });
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const closeLightbox = () => {
    setLightbox((prev) => ({ ...prev, isOpen: false }));
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const goPrev = () => {
    setLightbox((prev) => ({
      ...prev,
      index: (prev.index - 1 + prev.images.length) % prev.images.length,
    }));
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const goNext = () => {
    setLightbox((prev) => ({
      ...prev,
      index: (prev.index + 1) % prev.images.length,
    }));
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleLightboxWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.min(3, Math.max(1, prev + delta)));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (zoom <= 1) return;
    dragRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setPan({ x: e.clientX - dragRef.current.x, y: e.clientY - dragRef.current.y });
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      swipeRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { dist: Math.hypot(dx, dy), zoom };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const nextZoom = Math.min(3, Math.max(1, (dist / pinchRef.current.dist) * pinchRef.current.zoom));
      setZoom(nextZoom);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (pinchRef.current && e.touches.length < 2) {
      pinchRef.current = null;
    }
    if (swipeRef.current && e.changedTouches.length === 1) {
      const dx = e.changedTouches[0].clientX - swipeRef.current.x;
      const dy = e.changedTouches[0].clientY - swipeRef.current.y;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
        dx > 0 ? goPrev() : goNext();
      } else if (dy > 80 && Math.abs(dy) > Math.abs(dx)) {
        closeLightbox();
      }
      swipeRef.current = null;
    }
  };

  const formatCommentDate = (date?: Date) => {
    if (!date) return '';
    try {
      return format(new Date(date), 'yyyy-MM-dd HH:mm');
    } catch {
      return '';
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <div className={styles.qaBadge}>问</div>
            <div className={styles.titleBlock}>
              <h2 className={styles.title}>{sanitizedQuestion}</h2>
              <div className={styles.tags}>
                <Tag variant="secondary" className={styles.tagPill}>
                  {stripEmojis(categoryNames[qa.category])}
                </Tag>
                {safeTags.map((tag, index) => (
                  <Tag key={index} variant="primary" className={styles.tagPill}>
                    {stripEmojis(tag)}
                  </Tag>
                ))}
              </div>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.content}>
          {/* 答案 */}
          <div className={styles.section}>
            {qa.steps && qa.steps.length > 0 ? (
              <div className={styles.steps}>
                {qa.steps.map((step, index) => (
                  <div key={index} className={styles.stepItem}>
                    <div className={styles.stepMarker}>{index + 1}</div>
                    <div className={styles.stepBody}>
                      {step.title && (
                        <div className={styles.stepTitle}>{stripEmojis(step.title)}</div>
                      )}
                      <div className={styles.stepContent}>{stripEmojis(step.content)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.richText}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {richTextContent}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {/* 多观点 */}
          {qa.alternatives && qa.alternatives.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>多观点</h3>
              {qa.alternatives.map((alt, index) => (
                <div key={index} className={styles.alternative}>
                  <h4 className={styles.alternativeTitle}>{stripEmojis(alt.title)}</h4>
                  <p className={styles.alternativeContent}>{stripEmojis(alt.content)}</p>
                </div>
              ))}
            </div>
          )}

          <div className={styles.socialBar}>
            <div className={styles.socialActions}>
              <button
                className={styles.socialButton}
                aria-label="转发"
                onClick={handleShare}
              >
                <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 2a5 5 0 0 0-5 5v5a3 3 0 0 0 6 0V7a1 1 0 0 1 2 0v5a5 5 0 0 1-10 0V7a7 7 0 0 1 14 0v6a9 9 0 0 1-18 0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{shareCount}</span>
              </button>
              <button
                className={`${styles.socialButton} ${liked ? styles.socialActive : ''}`}
                onClick={handleToggleLike}
                aria-label="点赞"
              >
                <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{likedCount}</span>
              </button>
              <button className={styles.socialButton} aria-label="评论" onClick={focusCommentInput}>
                <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{combinedComments.length}</span>
              </button>
              <button
                className={`${styles.socialButton} ${favorited ? styles.socialActive : ''}`}
                aria-label="收藏"
                onClick={handleToggleFavorite}
              >
                <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{favoriteCount}</span>
              </button>
            </div>
            <div className={styles.socialStack}>
              <div className={styles.avatarStack}>
                {avatarStack.length === 0 ? (
                  <div className={styles.avatarPlaceholder}>暂无头像</div>
                ) : (
                  avatarStack.map((user, index) => {
                    const isAuthority = user.role === 'captain' || user.role === 'assistant';
                    const initials = stripEmojis(user.name).slice(0, 2) || '船友';
                    return (
                      <div
                        key={user.id || `${user.name}-${index}`}
                        className={`${styles.avatarItem} ${isAuthority ? styles.avatarAuthority : ''}`}
                        style={{ zIndex: avatarStack.length - index }}
                      >
                        {user.avatar ? (
                          <img src={user.avatar} alt={initials} />
                        ) : (
                          initials
                        )}
                        {isAuthority && <span className={styles.avatarBadge}>V</span>}
                      </div>
                    );
                  })
                )}
              </div>
              <span className={styles.socialHint}>已有 {likedCount} 人觉得有用</span>
            </div>
          </div>

          <div className={styles.commentsSection}>
            <div className={styles.commentsHeader}>
              <div className={styles.commentsTitle}>
                全部评论
                <span className={styles.commentsCount}>{combinedComments.length}</span>
              </div>
              <select
                className={styles.commentSort}
                value={commentSort}
                onChange={(e) => setCommentSort(e.target.value)}
              >
                <option value="smart">智能排序</option>
                <option value="latest">最新</option>
                <option value="hot">最热</option>
              </select>
            </div>

            <div
              className={`${styles.commentBox} ${commentDragOver ? styles.dragActive : ''}`}
              onDragOver={(event) => {
                event.preventDefault();
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                setCommentDragOver(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                const related = event.relatedTarget as Node | null;
                if (!related || !event.currentTarget.contains(related)) {
                  setCommentDragOver(false);
                }
              }}
              onDrop={handleCommentDrop}
            >
              <textarea
                className={styles.commentTextarea}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="写下你的看法"
                maxLength={1200}
                ref={commentInputRef}
                onPaste={handleCommentPaste}
              />
              {pendingImages.length > 0 && (
                <div className={styles.imagePreviewGrid}>
                  {pendingImages.map((img) => (
                    <div key={img.id} className={styles.imagePreviewItem}>
                      <img src={img.url} alt="预览" />
                      {img.status === 'uploading' && (
                        <div className={styles.imageOverlay}>
                          <span>上传中 {img.progress}%</span>
                          <div className={styles.uploadProgressBar}>
                            <div
                              className={styles.uploadProgressFill}
                              style={{ width: `${img.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {img.status === 'error' && (
                        <div className={styles.imageOverlay}>
                          上传失败
                          <button
                            className={styles.retryButton}
                            onClick={() => handleRetryImage(img.id)}
                          >
                            重试
                          </button>
                        </div>
                      )}
                      {img.status === 'done' && (
                        <span className={styles.uploadedBadge}>已上传</span>
                      )}
                      <span className={styles.replaceImage}>
                        替换
                        <input
                          type="file"
                          accept="image/*"
                          className={styles.fileInputOverlay}
                          onChange={(event) => handleReplaceCommentImage(img.id, event)}
                        />
                      </span>
                      <button
                        className={styles.removeImage}
                        onClick={() => handleRemoveImage(img.id)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className={styles.commentToolbar}>
                <div className={styles.commentTools}>
                  <div className={styles.emojiPopoverAnchor}>
                  <button
                    className={styles.toolButton}
                    aria-label="表情"
                    type="button"
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="9" strokeWidth="2" />
                        <path d="M8 14s1.5 2 4 2 4-2 4-2" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="9" cy="10" r="1" fill="currentColor" />
                        <circle cx="15" cy="10" r="1" fill="currentColor" />
                      </svg>
                    </button>
                    {showEmojiPicker && (
                      <div className={styles.emojiPopover}>
                        <div className={styles.emojiHeader}>常用表情</div>
                        <div className={styles.emojiGrid}>
                          {emojiLabels.map((label) => (
                            <button
                              key={label}
                              className={styles.emojiItem}
                              onClick={() => insertEmoji(label)}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className={styles.nativeFileInput}
                    aria-label="上传图片"
                    onChange={(e) => handleSelectImages(e.target.files)}
                  />
                </div>
                <div className={styles.commentMeta}>
                  <span className={styles.commentCount}>{commentInput.length}/1200</span>
                  <button
                    className={styles.commentButton}
                    onClick={handleAddComment}
                    disabled={isCommentEmpty || hasUploadingImages || hasErrorImages}
                  >
                    发布
                  </button>
                </div>
              </div>
              <div className={styles.uploadFallbackRow}>
                可拖拽图片到评论框，或直接粘贴图片（Ctrl/Cmd + V）
              </div>
              {(hasUploadingImages || hasErrorImages) && (
                <div
                  className={`${styles.uploadHint} ${
                    hasErrorImages ? styles.uploadHintError : ''
                  }`}
                >
                  {hasUploadingImages && '图片上传中，请稍候…'}
                  {hasErrorImages && '有图片上传失败，请重试或删除后再发布'}
                </div>
              )}
              {commentUploadError && (
                <div className={styles.uploadHintError}>{commentUploadError}</div>
              )}
              {commentSubmitError && (
                <div className={styles.commentError}>{commentSubmitError}</div>
              )}
            </div>
            <div className={styles.commentList}>
              {commentLoadError && (
                <div className={styles.commentErrorBanner}>
                  <span>{commentLoadError}</span>
                  <button className={styles.retryLoadButton} onClick={fetchComments}>
                    重试
                  </button>
                </div>
              )}
              {isLoadingComments ? (
                <div className={styles.commentSkeletonList}>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={`skeleton-${index}`} className={styles.commentSkeletonItem}>
                      <div className={styles.commentSkeletonAvatar} />
                      <div className={styles.commentSkeletonBody}>
                        <div className={styles.commentSkeletonLine} />
                        <div className={styles.commentSkeletonLineShort} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : sortedComments.length === 0 ? (
                <div className={styles.emptyComment}>暂无评论，期待你的观点</div>
              ) : (
                pagedComments.map((comment) => {
                  const name = stripEmojis(comment.author?.name || '船友') || '船友';
                  const initials = name.slice(0, 2);
                  const commentDate = formatCommentDate(comment.createdAt);
                  const likeState = commentLikeState[comment.id] || {
                    count:
                      'likes' in comment && typeof comment.likes === 'number' ? comment.likes : 0,
                    liked: false,
                  };
                  const replies = comment.replies || [];
                  const isLocal = (comment as { isLocal?: boolean }).isLocal;
                  const status = (comment as { status?: 'sending' | 'error' }).status;
                  const replyUploads = replyPendingImages[comment.id] || [];
                  const replyReadyImages = replyUploads.filter((img) => img.status === 'done').length;
                  const replyHasUploading = replyUploads.some((img) => img.status === 'uploading');
                  const replyHasError = replyUploads.some((img) => img.status === 'error');
                  return (
                    <div key={comment.id} className={styles.commentItem}>
                      <div className={styles.commentAvatar}>
                        {comment.author?.avatar ? <img src={comment.author.avatar} alt={name} /> : initials}
                      </div>
                      <div className={styles.commentBody}>
                        <div className={styles.commentName}>{name}</div>
                        <div className={styles.commentText}>{stripEmojis(comment.content)}</div>
                        {isLocal && status && (
                          <div className={styles.commentStatusRow}>
                            <span className={styles.commentStatus}>
                              {status === 'sending' ? '发送中…' : '发送失败'}
                            </span>
                            {status === 'error' && (
                              <button
                                className={styles.retryCommentButton}
                                onClick={() => handleRetryComment(comment.id)}
                              >
                                重试
                              </button>
                            )}
                          </div>
                        )}
                        {comment.images && comment.images.length > 0 && (
                          <div className={styles.commentImages}>
                            {comment.images.map((src, imgIndex) => (
                              <button
                                key={`${comment.id}-${imgIndex}`}
                                className={styles.commentImage}
                                onClick={(e) => {
                                  const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                                  openLightbox(comment.images || [], imgIndex, rect);
                                }}
                              >
                                <img src={src} alt="评论图片" />
                              </button>
                            ))}
                          </div>
                        )}
                        <div className={styles.commentMetaRow}>
                          <span className={styles.commentDate}>{commentDate || '刚刚'}</span>
                          <div className={styles.commentActions}>
                          <button
                            className={`${styles.commentAction} ${
                              likeState.liked ? styles.commentActionActive : ''
                            }`}
                            aria-label="点赞"
                            onClick={() => handleToggleCommentLike(comment.id, isLocal)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span>{likeState.count}</span>
                          </button>
                          <button
                            className={styles.commentAction}
                            aria-label="回复"
                            onClick={() => handleToggleReplyBox(comment.id, name)}
                            disabled={isLocal}
                          >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                        {activeReplyId === comment.id && (
                          <div
                            className={`${styles.replyBox} ${replyDragOver[comment.id] ? styles.dragActive : ''}`}
                            onDragOver={(event) => {
                              event.preventDefault();
                            }}
                            onDragEnter={(event) => {
                              event.preventDefault();
                              setReplyDragOver((prev) => ({ ...prev, [comment.id]: true }));
                            }}
                            onDragLeave={(event) => {
                              event.preventDefault();
                              const related = event.relatedTarget as Node | null;
                              if (!related || !event.currentTarget.contains(related)) {
                                setReplyDragOver((prev) => ({ ...prev, [comment.id]: false }));
                              }
                            }}
                            onDrop={(event) => handleReplyDrop(comment.id, event)}
                          >
                            <div className={styles.replyHeader}>
                              <span className={styles.replyTitle}>回复{name}：</span>
                              <button
                                className={styles.replyCancel}
                                onClick={() => {
                                  setActiveReplyId(null);
                                  setShowReplyEmojiPicker((prev) => ({ ...prev, [comment.id]: false }));
                                }}
                              >
                                取消
                              </button>
                            </div>
                            <div className={styles.replyInputShell}>
                              <textarea
                                className={styles.replyTextarea}
                                value={replyInputs[comment.id] || ''}
                                onChange={(e) => handleReplyInputChange(comment.id, e.target.value)}
                                placeholder="写下你的看法"
                                maxLength={1200}
                                onPaste={(event) => handleReplyPaste(comment.id, event)}
                              />
                            </div>
                            {(replyPendingImages[comment.id] || []).length > 0 && (
                              <div className={styles.replyImagePreviewGrid}>
                                {(replyPendingImages[comment.id] || []).map((img) => (
                                  <div key={img.id} className={styles.imagePreviewItem}>
                                    <img src={img.url} alt="预览" />
                                    {img.status === 'uploading' && (
                                      <div className={styles.imageOverlay}>
                                        <span>上传中 {img.progress}%</span>
                                        <div className={styles.uploadProgressBar}>
                                          <div
                                            className={styles.uploadProgressFill}
                                            style={{ width: `${img.progress}%` }}
                                          />
                                        </div>
                                      </div>
                                    )}
                                    {img.status === 'error' && (
                                      <div className={styles.imageOverlay}>
                                        上传失败
                                        <button
                                          className={styles.retryButton}
                                          onClick={() => handleRetryReplyImage(comment.id, img.id)}
                                        >
                                          重试
                                        </button>
                                      </div>
                                    )}
                                    {img.status === 'done' && (
                                      <span className={styles.uploadedBadge}>已上传</span>
                                    )}
                                    <span className={styles.replaceImage}>
                                      替换
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className={styles.fileInputOverlay}
                                        onChange={(event) =>
                                          handleReplaceReplyImage(comment.id, img.id, event)
                                        }
                                      />
                                    </span>
                                    <button
                                      className={styles.removeImage}
                                      onClick={() => handleRemoveReplyImage(comment.id, img.id)}
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className={styles.replyToolbar}>
                              <div className={styles.replyTools}>
                                <div className={styles.emojiPopoverAnchor}>
                                  <button
                                    className={styles.replyToolButton}
                                    aria-label="表情"
                                    type="button"
                                    onClick={() =>
                                      setShowReplyEmojiPicker((prev) => ({
                                        ...prev,
                                        [comment.id]: !prev[comment.id],
                                      }))
                                    }
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                      <circle cx="12" cy="12" r="9" strokeWidth="2" />
                                      <path d="M8 14s1.5 2 4 2 4-2 4-2" strokeWidth="2" strokeLinecap="round" />
                                      <circle cx="9" cy="10" r="1" fill="currentColor" />
                                      <circle cx="15" cy="10" r="1" fill="currentColor" />
                                    </svg>
                                  </button>
                                  {showReplyEmojiPicker[comment.id] && (
                                    <div className={styles.emojiPopover}>
                                      <div className={styles.emojiHeader}>常用表情</div>
                                      <div className={styles.emojiGrid}>
                                        {replyEmojiLabels.map((label) => (
                                          <button
                                            key={`${comment.id}-${label}`}
                                            className={styles.emojiItem}
                                            onClick={() => insertReplyEmoji(comment.id, label)}
                                          >
                                            {label}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <input
                                  ref={(el) => {
                                    replyFileInputRefs.current[comment.id] = el;
                                  }}
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className={styles.nativeFileInput}
                                  aria-label="上传图片"
                                  onChange={(e) => handleSelectReplyImages(comment.id, e.target.files)}
                                />
                              </div>
                              <div className={styles.replyActions}>
                                <span className={styles.replyCount}>
                                  {(replyInputs[comment.id] || '').length}/1200
                                </span>
                                <button
                                  className={styles.replyButton}
                                  onClick={() => handleSubmitReply(comment.id)}
                                  disabled={
                                    ((replyInputs[comment.id] || '').trim().length === 0 &&
                                      replyReadyImages === 0) ||
                                    replyHasUploading ||
                                    replyHasError
                                  }
                                >
                                  发布
                                </button>
                              </div>
                            </div>
                            <div className={styles.uploadFallbackRow}>
                              可拖拽图片到回复框，或直接粘贴图片（Ctrl/Cmd + V）
                            </div>
                            {(replyHasUploading || replyHasError) && (
                              <div
                                className={`${styles.uploadHint} ${
                                  replyHasError ? styles.uploadHintError : ''
                                }`}
                              >
                                {replyHasUploading && '图片上传中，请稍候…'}
                                {replyHasError && '有图片上传失败，请重试或删除后再发布'}
                              </div>
                            )}
                            {replyUploadError[comment.id] && (
                              <div className={styles.uploadHintError}>
                                {replyUploadError[comment.id]}
                              </div>
                            )}
                            {replySubmitError[comment.id] && (
                              <div className={styles.replyError}>{replySubmitError[comment.id]}</div>
                            )}
                          </div>
                        )}
                        {replies.length > 0 && (
                          <div className={styles.replyList}>
                            {replies.map((reply) => {
                              const replyName = stripEmojis(reply.author?.name || '船友') || '船友';
                              const replyDate = formatCommentDate(reply.createdAt);
                              const replyLike = replyLikeState[reply.id] || { count: reply.likes ?? 0, liked: false };
                              const replyToName = reply.replyTo?.name;
                              return (
                                <div key={reply.id} className={styles.replyItem}>
                                  <div className={styles.replyContentRow}>
                                    <span className={styles.replyAuthor}>{replyName}</span>
                                    {replyToName && <span className={styles.replyTo}>@{replyToName}</span>}
                                    <span className={styles.replyContent}>{stripEmojis(reply.content)}</span>
                                  </div>
                                  {reply.images && reply.images.length > 0 && (
                                    <div className={styles.replyImages}>
                                      {reply.images.map((src, imgIndex) => (
                                        <button
                                          key={`${reply.id}-${imgIndex}`}
                                          className={styles.replyImage}
                                          onClick={(e) => {
                                            const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                                            openLightbox(reply.images || [], imgIndex, rect);
                                          }}
                                        >
                                          <img src={src} alt="回复图片" />
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                  <div className={styles.replyMetaRow}>
                                    <span className={styles.replyDate}>{replyDate || '刚刚'}</span>
                                    <button
                                      className={`${styles.replyLikeButton} ${
                                        replyLike.liked ? styles.replyLikeActive : ''
                                      }`}
                                      onClick={() => handleToggleReplyLike(comment.id, reply.id, isLocal)}
                                    >
                                      ❤ {replyLike.count}
                                    </button>
                                    <button
                                      className={styles.replyInlineButton}
                                      onClick={() => {
                                        setActiveReplyId(comment.id);
                                        setReplyInputs((prev) => ({
                                          ...prev,
                                          [comment.id]: prev[comment.id] || `@${replyName} `,
                                        }));
                                        setReplyTargets((prev) => ({
                                          ...prev,
                                          [comment.id]: { replyTo: { id: reply.id, name: replyName } },
                                        }));
                                      }}
                                    >
                                      回复
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {sortedComments.length > visibleCount && (
              <div className={styles.loadMore}>
                <button className={styles.loadMoreButton} onClick={() => setVisibleCount((prev) => prev + 6)}>
                  查看更多评论
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className={styles.footer}>
          <span className={styles.date}>
            {format(new Date(qa.createdAt), 'PPP', { locale: zhCN })}
          </span>
        </div>
      </div>
      </div>
      {lightbox.isOpen && (
      <div
        className={styles.lightbox}
        onClick={(e) => e.target === e.currentTarget && closeLightbox()}
        onWheel={handleLightboxWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        ref={lightboxRef}
      >
        <button className={styles.lightboxClose} onClick={closeLightbox}>
          ×
        </button>
        {lightbox.images.length > 1 && (
          <>
            <button className={styles.lightboxNavLeft} onClick={goPrev}>
              ‹
            </button>
            <button className={styles.lightboxNavRight} onClick={goNext}>
              ›
            </button>
          </>
        )}
        <div className={styles.lightboxInner}>
          <img
            src={lightbox.images[lightbox.index]}
            alt="预览"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            draggable={false}
          />
        </div>
      </div>
      )}
    </>
  );
}
