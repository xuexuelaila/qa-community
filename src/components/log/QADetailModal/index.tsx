'use client';

import React from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { QAComment, QAKnowledge, QAReply } from '@/types/qa';
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

export default function QADetailModal({ qa, isOpen, onClose, onFeedback }: QADetailModalProps) {
  const [userFeedback, setUserFeedback] = React.useState<'useful' | 'useless' | null>(null);
  const [commentInput, setCommentInput] = React.useState('');
  const [remoteComments, setRemoteComments] = React.useState<QAComment[]>(qa.comments || []);
  const [localComments, setLocalComments] = React.useState<
    {
      id: string;
      author: { id: string; name: string; avatar?: string; role?: 'captain' | 'assistant' | 'member' };
      content: string;
      images: string[];
      createdAt: Date;
      status?: 'sending' | 'error';
    }[]
  >([]);
  const [commentLikeState, setCommentLikeState] = React.useState<Record<string, { count: number; liked: boolean }>>({});
  const [replyLikeState, setReplyLikeState] = React.useState<Record<string, { count: number; liked: boolean }>>({});
  const [replyInputs, setReplyInputs] = React.useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = React.useState<string | null>(null);
  const [replyTargets, setReplyTargets] = React.useState<
    Record<string, { replyTo?: { id: string; name: string } }>
  >({});
  const [replyPendingImages, setReplyPendingImages] = React.useState<
    Record<string, { id: string; url: string; status: 'uploading' | 'done' | 'error' }[]>
  >({});
  const [commentSubmitError, setCommentSubmitError] = React.useState<string | null>(null);
  const [replySubmitError, setReplySubmitError] = React.useState<Record<string, string>>({});
  const [commentSort, setCommentSort] = React.useState('smart');
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const [showReplyEmojiPicker, setShowReplyEmojiPicker] = React.useState<Record<string, boolean>>({});
  const [liked, setLiked] = React.useState(false);
  const [favorited, setFavorited] = React.useState(false);
  const [shareCount, setShareCount] = React.useState(0);
  const [likedCount, setLikedCount] = React.useState(0);
  const [favoriteCount, setFavoriteCount] = React.useState(0);
  const [pendingImages, setPendingImages] = React.useState<
    { id: string; url: string; status: 'uploading' | 'done' | 'error' }[]
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
  const sanitizedAnswer = stripEmojis(safeAnswer);
  const sanitizedQuestion = stripEmojis(safeQuestion);
  const coreConclusion = extractCoreConclusion(sanitizedAnswer);
  const richTextContent = emphasizeKeywords(sanitizedAnswer);
  const isCommentEmpty = commentInput.trim().length === 0 && pendingImages.length === 0;
  const apiBase = 'http://localhost:3001/api/qa';

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
          next[comment.id] = {
            count: comment.likes ?? 0,
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

  const handleAddComment = () => {
    const value = commentInput.trim();
    if (!value && pendingImages.length === 0) return;
    const images = pendingImages.filter((img) => img.status === 'done').map((img) => img.url);
    const tempId = `local-${Date.now()}`;
    const optimistic = {
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

  const handleReplyImageClick = (commentId: string) => {
    replyFileInputRefs.current[commentId]?.click();
  };

  const handleSubmitReply = (commentId: string) => {
    if (commentId.startsWith('local-')) return;
    const content = (replyInputs[commentId] || '').trim();
    const replyTo = replyTargets[commentId]?.replyTo;
    const images = (replyPendingImages[commentId] || [])
      .filter((img) => img.status === 'done')
      .map((img) => img.url);
    if (!content && images.length === 0) return;
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
    const currentCount = pendingImages.length;
    const maxCount = 6;
    const picked = Array.from(files).slice(0, Math.max(0, maxCount - currentCount));
    for (const file of picked) {
      if (file.size > 5 * 1024 * 1024) {
        continue;
      }
      const id = `img-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setPendingImages((prev) => [...prev, { id, url: URL.createObjectURL(file), status: 'uploading' }]);
      try {
        const blob = await compressImage(file);
        const url = URL.createObjectURL(blob);
        setPendingImages((prev) =>
          prev.map((img) => (img.id === id ? { ...img, url, status: Math.random() < 0.2 ? 'error' : 'done' } : img))
        );
      } catch {
        setPendingImages((prev) => prev.map((img) => (img.id === id ? { ...img, status: 'error' } : img)));
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectReplyImages = async (commentId: string, files: FileList | null) => {
    if (!files) return;
    const currentList = replyPendingImages[commentId] || [];
    const maxCount = 6;
    const picked = Array.from(files).slice(0, Math.max(0, maxCount - currentList.length));
    for (const file of picked) {
      if (file.size > 5 * 1024 * 1024) {
        continue;
      }
      const id = `reply-img-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setReplyPendingImages((prev) => ({
        ...prev,
        [commentId]: [...(prev[commentId] || []), { id, url: URL.createObjectURL(file), status: 'uploading' }],
      }));
      try {
        const blob = await compressImage(file);
        const url = URL.createObjectURL(blob);
        setReplyPendingImages((prev) => ({
          ...prev,
          [commentId]: (prev[commentId] || []).map((img) =>
            img.id === id ? { ...img, url, status: Math.random() < 0.2 ? 'error' : 'done' } : img
          ),
        }));
      } catch {
        setReplyPendingImages((prev) => ({
          ...prev,
          [commentId]: (prev[commentId] || []).map((img) =>
            img.id === id ? { ...img, status: 'error' } : img
          ),
        }));
      }
    }
    if (replyFileInputRefs.current[commentId]) {
      replyFileInputRefs.current[commentId]!.value = '';
    }
  };

  const handleRetryReplyImage = (commentId: string, id: string) => {
    setReplyPendingImages((prev) => ({
      ...prev,
      [commentId]: (prev[commentId] || []).map((img) =>
        img.id === id ? { ...img, status: 'uploading' } : img
      ),
    }));
    setTimeout(() => {
      setReplyPendingImages((prev) => ({
        ...prev,
        [commentId]: (prev[commentId] || []).map((img) =>
          img.id === id ? { ...img, status: 'done' } : img
        ),
      }));
    }, 800);
  };

  const handleRemoveReplyImage = (commentId: string, id: string) => {
    setReplyPendingImages((prev) => ({
      ...prev,
      [commentId]: (prev[commentId] || []).filter((img) => img.id !== id),
    }));
  };

  const handleRetryImage = async (id: string, url: string) => {
    setPendingImages((prev) => prev.map((img) => (img.id === id ? { ...img, status: 'uploading' } : img)));
    setTimeout(() => {
      setPendingImages((prev) => prev.map((img) => (img.id === id ? { ...img, status: 'done' } : img)));
    }, 800);
  };

  const handleRemoveImage = (id: string) => {
    setPendingImages((prev) => prev.filter((img) => img.id !== id));
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
                <Tag variant="secondary" size="small" className={styles.tagPill}>
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

            <div className={styles.commentBox}>
              <textarea
                className={styles.commentTextarea}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="写下你的看法"
                maxLength={1200}
                ref={commentInputRef}
              />
              {pendingImages.length > 0 && (
                <div className={styles.imagePreviewGrid}>
                  {pendingImages.map((img) => (
                    <div key={img.id} className={styles.imagePreviewItem}>
                      <img src={img.url} alt="预览" />
                      {img.status === 'uploading' && (
                        <div className={styles.imageOverlay}>上传中</div>
                      )}
                      {img.status === 'error' && (
                        <div className={styles.imageOverlay}>
                          上传失败
                          <button
                            className={styles.retryButton}
                            onClick={() => handleRetryImage(img.id, img.url)}
                          >
                            重试
                          </button>
                        </div>
                      )}
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
                  <button
                    className={styles.toolButton}
                    aria-label="图片"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="2" />
                      <path d="M8 13l2.5-3 3.5 4 2.5-3 3.5 5" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="9" cy="9" r="1.5" fill="currentColor" />
                    </svg>
                  </button>
                </div>
                <div className={styles.commentMeta}>
                  <span className={styles.commentCount}>{commentInput.length}/1200</span>
                  <button
                    className={styles.commentButton}
                    onClick={handleAddComment}
                    disabled={isCommentEmpty}
                  >
                    发布
                  </button>
                </div>
              </div>
              {commentSubmitError && (
                <div className={styles.commentError}>{commentSubmitError}</div>
              )}
              {showEmojiPicker && (
                <div className={styles.emojiPicker}>
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
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => handleSelectImages(e.target.files)}
            />

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
                  const likeState = commentLikeState[comment.id] || { count: comment.likes ?? 0, liked: false };
                  const replies = comment.replies || [];
                  const isLocal = (comment as { isLocal?: boolean }).isLocal;
                  const status = (comment as { status?: 'sending' | 'error' }).status;
                  const replyReadyImages = (replyPendingImages[comment.id] || []).filter(
                    (img) => img.status === 'done'
                  ).length;
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
                          <div className={styles.replyBox}>
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
                              />
                            </div>
                            {(replyPendingImages[comment.id] || []).length > 0 && (
                              <div className={styles.replyImagePreviewGrid}>
                                {(replyPendingImages[comment.id] || []).map((img) => (
                                  <div key={img.id} className={styles.imagePreviewItem}>
                                    <img src={img.url} alt="预览" />
                                    {img.status === 'uploading' && (
                                      <div className={styles.imageOverlay}>上传中</div>
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
                                <button
                                  className={styles.replyToolButton}
                                  aria-label="图片"
                                  type="button"
                                  onClick={() => handleReplyImageClick(comment.id)}
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="2" />
                                    <path d="M8 13l2.5-3 3.5 4 2.5-3 3.5 5" strokeWidth="2" strokeLinecap="round" />
                                    <circle cx="9" cy="9" r="1.5" fill="currentColor" />
                                  </svg>
                                </button>
                              </div>
                              <div className={styles.replyActions}>
                                <span className={styles.replyCount}>
                                  {(replyInputs[comment.id] || '').length}/1200
                                </span>
                                <button
                                  className={styles.replyButton}
                                  onClick={() => handleSubmitReply(comment.id)}
                                  disabled={
                                    (replyInputs[comment.id] || '').trim().length === 0 &&
                                    replyReadyImages === 0
                                  }
                                >
                                  发布
                                </button>
                              </div>
                            </div>
                            <input
                              ref={(el) => {
                                replyFileInputRefs.current[comment.id] = el;
                              }}
                              type="file"
                              accept="image/*"
                              multiple
                              style={{ display: 'none' }}
                              onChange={(e) => handleSelectReplyImages(comment.id, e.target.files)}
                            />
                            {showReplyEmojiPicker[comment.id] && (
                              <div className={styles.replyEmojiPicker}>
                                {replyEmojiLabels.map((label) => (
                                  <button
                                    key={`${comment.id}-${label}`}
                                    className={styles.replyEmojiItem}
                                    onClick={() => insertReplyEmoji(comment.id, label)}
                                  >
                                    {label}
                                  </button>
                                ))}
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
