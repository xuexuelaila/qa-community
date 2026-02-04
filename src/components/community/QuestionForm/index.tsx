'use client';

import React, { useState, useEffect } from 'react';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { Attachment, CreatePostData } from '@/types/post';
import styles from './QuestionForm.module.css';

interface QuestionFormProps {
  onSubmit: (data: CreatePostData) => void;
  onCancel?: () => void;
  initialData?: {
    title?: string;
    content?: {
      stage?: string;
      problem?: string;
      attempts?: string;
    };
    mentions?: string[];
    includeAI?: boolean;
    allowReplies?: boolean;
    aiSummary?: string;
    aiHistory?: string;
  };
}

export default function QuestionForm({ onSubmit, onCancel, initialData }: QuestionFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    stage: '',
    problem: '',
    attempts: '',
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [mentions, setMentions] = useState<string[]>([]);
  const [showCoachPicker, setShowCoachPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionRange, setMentionRange] = useState<{ start: number; end: number } | null>(null);
  const [manualPicker, setManualPicker] = useState(false);
  const [problemElement, setProblemElement] = useState<HTMLTextAreaElement | null>(null);
  const [allowReplies, setAllowReplies] = useState(true);
  const [includeAI, setIncludeAI] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [aiHistory, setAiHistory] = useState('');

  const coachOptions = [
    { name: '教练小夏', specialty: '增长策略' },
    { name: '教练阿北', specialty: '技术架构' },
    { name: '教练Mia', specialty: '产品增长' },
    { name: '教练凯文', specialty: '工程效率' },
  ];

  useEffect(() => {
    const savedDraft = localStorage.getItem('questionDraft');
    if (savedDraft) {
      const parsed = JSON.parse(savedDraft);
      setFormData(parsed.formData || parsed);
      setMentions(parsed.mentions || []);
    }
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        title: initialData.title || prev.title,
        stage: initialData.content?.stage ?? prev.stage,
        problem: initialData.content?.problem ?? prev.problem,
        attempts: initialData.content?.attempts ?? prev.attempts,
      }));
      setMentions(initialData.mentions || []);
      setIncludeAI(initialData.includeAI ?? false);
      setAllowReplies(initialData.allowReplies ?? true);
      setAiSummary(initialData.aiSummary || '');
      setAiHistory(initialData.aiHistory || '');
      setAttachments([]);
    }
  }, [initialData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(
        'questionDraft',
        JSON.stringify({ formData, mentions, allowReplies, includeAI, aiSummary })
      );
      setLastSaved(new Date());
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData, mentions, allowReplies, includeAI, aiSummary]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const findMentionMatch = (value: string, caret: number) => {
    const textUntilCaret = value.slice(0, caret);
    const atIndex = textUntilCaret.lastIndexOf('@');
    if (atIndex === -1) return null;
    const afterAt = textUntilCaret.slice(atIndex + 1);
    if (afterAt.includes(' ') || afterAt.includes('\n')) return null;
    return { start: atIndex, end: caret, query: afterAt };
  };

  const handleProblemChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.value;
    const caret = event.target.selectionStart ?? value.length;
    setFormData((prev) => ({ ...prev, problem: value }));

    const match = findMentionMatch(value, caret);
    if (match) {
      setShowCoachPicker(true);
      setMentionQuery(match.query);
      setMentionRange({ start: match.start, end: match.end });
      setManualPicker(false);
      return;
    }

    if (manualPicker) {
      setShowCoachPicker(true);
      setMentionQuery('');
      setMentionRange({ start: caret, end: caret });
      return;
    }

    setShowCoachPicker(false);
    setMentionQuery('');
    setMentionRange(null);
  };

  const handleSelectCoach = (name: string) => {
    setMentions((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setFormData((prev) => {
      const range = mentionRange || { start: prev.problem.length, end: prev.problem.length };
      const prefix = prev.problem.slice(0, range.start);
      const suffix = prev.problem.slice(range.end);
      const inserted = `@${name} `;
      return { ...prev, problem: `${prefix}${inserted}${suffix}` };
    });
    setShowCoachPicker(false);
    setMentionQuery('');
    setMentionRange(null);
    setManualPicker(false);
    if (problemElement) {
      requestAnimationFrame(() => {
        const range = mentionRange || {
          start: problemElement.value.length,
          end: problemElement.value.length,
        };
        const prefix = problemElement.value.slice(0, range.start);
        const inserted = `@${name} `;
        const nextCaret = `${prefix}${inserted}`.length;
        problemElement.focus();
        problemElement.setSelectionRange(nextCaret, nextCaret);
      });
    }
  };

  const handleRemoveMention = (name: string) => {
    setMentions((prev) => prev.filter((item) => item !== name));
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`@${escaped}\\s?`, 'g');
    setFormData((prev) => ({ ...prev, problem: prev.problem.replace(regex, '') }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const mappedAttachments: Attachment[] = attachments.map((file) => ({
      type: file.type.startsWith('video') ? 'video' : 'image',
      url: URL.createObjectURL(file),
    }));
    const postData: CreatePostData = {
      title: formData.title,
      content: {
        stage: formData.stage,
        problem: formData.problem,
        attempts: formData.attempts,
      },
      attachments: mappedAttachments,
      mentions,
      allowReplies,
      includeAI,
      aiSummary: includeAI ? aiSummary : undefined,
      aiHistory: includeAI ? aiHistory : undefined,
    };
    onSubmit(postData);
    localStorage.removeItem('questionDraft');
  };

  return (
    <div className={styles.form}>
      <h2 className={styles.title}>发起求助</h2>

      <div className={styles.field}>
        <Input
          label="问题标题"
          placeholder="用一句话描述你的问题"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
        />
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label className={styles.label}>
            问题类别<span className={styles.required}>*</span>
          </label>
          <select
            className={styles.select}
            value={formData.stage}
            onChange={(e) => handleChange('stage', e.target.value)}
          >
            <option value="">请选择</option>
            <option value="tech">技术问题</option>
            <option value="tool">工具使用</option>
            <option value="process">流程疑问</option>
            <option value="other">其他</option>
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>@教练（可选）</label>
          <div className={styles.mentionRow}>
            <button
              type="button"
              className={styles.mentionButton}
              onClick={() => {
                setManualPicker((prev) => !prev);
                setShowCoachPicker((prev) => !prev);
                setMentionQuery('');
                if (problemElement) {
                  const caret = problemElement.selectionStart ?? formData.problem.length;
                  setMentionRange({ start: caret, end: caret });
                } else {
                  setMentionRange({ start: formData.problem.length, end: formData.problem.length });
                }
              }}
            >
              @ 选择教练
            </button>
            {mentions.length > 0 && (
              <div className={styles.mentionChips}>
                {mentions.map((name) => (
                  <span key={name} className={styles.mentionChip}>
                    {name}
                    <button onClick={() => handleRemoveMention(name)}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          {showCoachPicker && (
            <div className={styles.mentionDropdown}>
              {coachOptions
                .filter((coach) => coach.name.toLowerCase().includes(mentionQuery.toLowerCase()))
                .map((coach) => (
                  <button key={coach.name} onClick={() => handleSelectCoach(coach.name)}>
                    <span className={styles.coachAvatar}>{coach.name.slice(0, 1)}</span>
                    <span>
                      <span className={styles.coachName}>{coach.name}</span>
                      <span className={styles.coachSpecialty}>{coach.specialty}</span>
                    </span>
                  </button>
                ))}
              {coachOptions.filter((coach) =>
                coach.name.toLowerCase().includes(mentionQuery.toLowerCase())
              ).length === 0 && <span className={styles.mentionEmpty}>暂无匹配教练</span>}
            </div>
          )}
          <div className={styles.mentionHint}>输入“@ + 教练名”可筛选教练列表</div>
        </div>
      </div>

      <div className={styles.field}>
        <Input
          label="问题描述"
          placeholder="支持Markdown，尽量描述清楚背景和期望结果（输入 @ 可呼出教练）"
          multiline
          rows={4}
          value={formData.problem}
          onChange={handleProblemChange}
          onFocus={(e) => setProblemElement(e.currentTarget as HTMLTextAreaElement)}
        />
      </div>

      <div className={styles.field}>
        <Input
          label="补充信息"
          placeholder="你已经尝试过什么？还有哪些上下文？"
          multiline
          rows={4}
          value={formData.attempts}
          onChange={(e) => handleChange('attempts', e.target.value)}
        />
      </div>

      <div className={styles.optionRow}>
        <label className={styles.optionItem}>
          <input
            type="checkbox"
            checked={allowReplies}
            onChange={(e) => setAllowReplies(e.target.checked)}
          />
          允许其他船员回答（推荐）
        </label>
        {(aiSummary || aiHistory || includeAI) && (
          <label className={styles.optionItem}>
            <input
              type="checkbox"
              checked={includeAI}
              onChange={(e) => setIncludeAI(e.target.checked)}
            />
            附带 AI 回答记录
          </label>
        )}
      </div>

      {includeAI && (
        <div className={styles.aiPreview}>
          <div className={styles.aiPreviewTitle}>AI 回答摘要（可编辑）</div>
          <textarea
            className={styles.aiPreviewTextarea}
            value={aiSummary}
            onChange={(e) => setAiSummary(e.target.value)}
            placeholder="在此补充 AI 回答摘要，帮助教练快速理解上下文"
          />
          {aiHistory && (
            <details className={styles.aiHistory}>
              <summary>查看完整 AI 对话记录</summary>
              <pre>{aiHistory}</pre>
            </details>
          )}
        </div>
      )}

      <div className={styles.field}>
        <label className={styles.label}>附件（可选）</label>
        <div className={styles.attachments}>
          {attachments.map((file, index) => (
            <div key={index} className={styles.preview}>
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className={styles.previewImage}
              />
              <button
                className={styles.removeButton}
                onClick={() => handleRemoveFile(index)}
              >
                ×
              </button>
            </div>
          ))}
          <label className={styles.uploadArea}>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <div className={styles.uploadIcon}>附件</div>
            <div className={styles.uploadText}>上传文件</div>
          </label>
        </div>
      </div>

      {lastSaved && (
        <div className={styles.draftInfo}>
          草稿已保存于 {lastSaved.toLocaleTimeString()}
        </div>
      )}

      <div className={styles.actions}>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            取消
          </Button>
        )}
        <Button variant="primary" onClick={handleSubmit}>
          发布求助
        </Button>
      </div>
    </div>
  );
}
