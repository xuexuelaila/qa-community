// 标签分类配置
export const TAG_CATEGORIES = {
  account: {
    name: '账号起号',
    icon: '',
    color: '#1a4d7a',
    keywords: ['账号运营', '流量测试', '养号', '播放量', '内容优化'],
  },
  monetization: {
    name: '流量变现',
    icon: '',
    color: '#f5a623',
    keywords: ['密令', '口令', '推广链接', '佣金', '订单', '结算', '万单宝', '密令申请'],
  },
  riskControl: {
    name: '风控避坑',
    icon: '',
    color: '#e74c3c',
    keywords: ['违规词', '敏感词', '限流', '避坑'],
  },
  tools: {
    name: '实操工具',
    icon: '',
    color: '#2ecc71',
    keywords: ['剪映', '视频制作', '曼波配音', '素材', '截图', '表情包', '标题', '话题', '关键词'],
  },
  platform: {
    name: '多平台',
    icon: '',
    color: '#9b59b6',
    keywords: ['多平台', 'B站', '快手', '视频号'],
  },
};

// 根据标签名称判断所属分类
export function getCategoryForTag(tag: string): string {
  for (const [categoryKey, category] of Object.entries(TAG_CATEGORIES)) {
    if (category.keywords.some(keyword => tag.includes(keyword) || keyword.includes(tag))) {
      return categoryKey;
    }
  }
  return 'other'; // 未分类
}

// 将标签列表按分类分组
export function groupTagsByCategory(tags: string[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {
    account: [],
    monetization: [],
    riskControl: [],
    tools: [],
    platform: [],
    other: [],
  };

  tags.forEach(tag => {
    const category = getCategoryForTag(tag);
    grouped[category].push(tag);
  });

  return grouped;
}

// 获取热门标签（按点击量排序）
export function getHotTags(tags: string[], clickCounts: Record<string, number>, limit: number = 8): string[] {
  return tags
    .sort((a, b) => (clickCounts[b] || 0) - (clickCounts[a] || 0))
    .slice(0, limit);
}
