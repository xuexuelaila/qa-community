'use client';

import React from 'react';

export default function UploadTestPage() {
  const [fileName, setFileName] = React.useState<string>('');
  const [fileSize, setFileSize] = React.useState<number | null>(null);

  return (
    <div style={{ padding: '24px', fontFamily: 'var(--font-family-base)' }}>
      <h1 style={{ marginBottom: '12px' }}>文件选择器测试</h1>
      <p style={{ marginBottom: '16px', color: '#6b7280' }}>
        如果这里都无法弹出文件选择器，说明是浏览器或系统层面限制。
      </p>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) {
            setFileName('');
            setFileSize(null);
            return;
          }
          setFileName(file.name);
          setFileSize(file.size);
        }}
      />
      <div style={{ marginTop: '16px', fontSize: '14px' }}>
        <div>文件名：{fileName || '未选择'}</div>
        <div>大小：{fileSize ? `${(fileSize / 1024).toFixed(1)} KB` : '-'}</div>
      </div>
    </div>
  );
}
