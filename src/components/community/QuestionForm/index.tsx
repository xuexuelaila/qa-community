'use client';

import React, { useState, useEffect } from 'react';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { CreatePostData } from '@/types/post';
import styles from './QuestionForm.module.css';

interface QuestionFormProps {
  onSubmit: (data: CreatePostData) => void;
  onCancel?: () => void;
}

export default function QuestionForm({ onSubmit, onCancel }: QuestionFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    stage: '',
    problem: '',
    attempts: '',
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    const savedDraft = localStorage.getItem('questionDraft');
    if (savedDraft) {
      setFormData(JSON.parse(savedDraft));
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('questionDraft', JSON.stringify(formData));
      setLastSaved(new Date());
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
    const postData: CreatePostData = {
      title: formData.title,
      content: {
        stage: formData.stage,
        problem: formData.problem,
        attempts: formData.attempts,
      },
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

      <div className={styles.field}>
        <label className={styles.label}>
          当前阶段<span className={styles.required}>*</span>
        </label>
        <select
          className={styles.select}
          value={formData.stage}
          onChange={(e) => handleChange('stage', e.target.value)}
        >
          <option value="">请选择</option>
          <option value="planning">规划阶段</option>
          <option value="development">开发阶段</option>
          <option value="testing">测试阶段</option>
          <option value="deployment">部署阶段</option>
          <option value="maintenance">维护阶段</option>
        </select>
      </div>

      <div className={styles.field}>
        <Input
          label="具体卡点"
          placeholder="详细描述你遇到的问题"
          multiline
          rows={4}
          value={formData.problem}
          onChange={(e) => handleChange('problem', e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <Input
          label="已做尝试"
          placeholder="说明你已经尝试过的解决方案"
          multiline
          rows={4}
          value={formData.attempts}
          onChange={(e) => handleChange('attempts', e.target.value)}
        />
      </div>

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
