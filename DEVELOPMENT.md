# 开发指南

## 快速开始

### 启动服务

```bash
# 方式1: 使用启动脚本（推荐）
./start.sh

# 方式2: 手动启动
# 终端1 - 前端
npm run dev

# 终端2 - 后端
cd backend
npm run dev
```

### 停止服务

```bash
# 使用停止脚本
./stop.sh

# 或手动停止
kill $(lsof -t -i:3000)  # 停止前端
kill $(lsof -t -i:3001)  # 停止后端
```

### 访问地址

- **航海日志页**: http://localhost:3000
- **求助站页**: http://localhost:3000/community
- **API健康检查**: http://localhost:3001/health

## 项目结构

```
qa-community/
├── src/                          # 前端源码
│   ├── app/                     # Next.js页面
│   │   ├── page.tsx            # 航海日志主页
│   │   ├── community/          # 求助站页面
│   │   └── layout.tsx          # 根布局
│   ├── components/              # 组件库
│   │   ├── common/             # 通用组件
│   │   │   ├── Button/         # 按钮组件
│   │   │   ├── Card/           # 卡片组件
│   │   │   ├── Tag/            # 标签组件
│   │   │   └── Input/          # 输入框组件
│   │   ├── log/                # 航海日志组件
│   │   │   ├── DateNavigator/  # 日期导航
│   │   │   ├── SearchBar/      # 搜索栏
│   │   │   ├── DailyBrief/     # 今日概览
│   │   │   └── QACard/         # 知识卡片
│   │   └── community/          # 社区组件
│   │       ├── StatusTabs/     # 状态分类
│   │       ├── QuestionForm/   # 提问表单
│   │       ├── PostCard/       # 帖子卡片
│   │       └── ReplyList/      # 回复列表
│   ├── lib/                    # 工具库
│   │   └── api.ts             # API客户端
│   ├── styles/                 # 样式文件
│   │   ├── variables.css      # CSS变量
│   │   ├── animations.css     # 动画定义
│   │   └── globals.css        # 全局样式
│   └── types/                  # TypeScript类型
│       ├── qa.ts              # Q&A类型
│       └── post.ts            # 帖子类型
├── backend/                     # 后端源码
│   └── src/
│       ├── models/             # 数据模型
│       │   ├── QA.ts          # Q&A模型
│       │   ├── User.ts        # 用户模型
│       │   └── Post.ts        # 帖子模型
│       ├── routes/             # API路由
│       │   ├── qa.ts          # Q&A路由
│       │   ├── posts.ts       # 帖子路由
│       │   ├── users.ts       # 用户路由
│       │   └── mock.ts        # Mock数据路由
│       └── index.ts            # 服务器入口
└── public/                      # 静态资源
```

## API文档

### Q&A相关接口

#### 获取每日Q&A列表
```
GET /api/qa/daily?date=2024-01-30
```

响应示例：
```json
{
  "success": true,
  "data": [
    {
      "_id": "1",
      "question": "如何在Next.js 14中实现SSR？",
      "answer": "...",
      "category": "practical",
      "tags": ["Next.js", "React"],
      "feedback": {
        "useful": 15,
        "useless": 2
      }
    }
  ]
}
```

#### 搜索Q&A
```
GET /api/qa/search?keyword=Next.js&tags=React
```

#### 获取每日概览
```
GET /api/qa/brief?date=2024-01-30
```

#### 提交反馈
```
POST /api/qa/feedback
Content-Type: application/json

{
  "qaId": "1",
  "type": "useful"  // 或 "useless"
}
```

### 社区相关接口

#### 获取帖子列表
```
GET /api/posts?status=pending&page=1&limit=20
```

参数：
- `status`: all | pending | resolved
- `page`: 页码（默认1）
- `limit`: 每页数量（默认20）

#### 获取帖子详情
```
GET /api/posts/:id
```

#### 发布新帖子
```
POST /api/posts
Content-Type: application/json

{
  "authorId": "user123",
  "title": "问题标题",
  "content": {
    "stage": "开发阶段",
    "problem": "具体问题描述",
    "attempts": "已尝试的方案"
  },
  "attachments": [],
  "mentions": []
}
```

#### 回复帖子
```
POST /api/posts/:id/reply
Content-Type: application/json

{
  "authorId": "user123",
  "content": "回复内容"
}
```

#### 采纳答案
```
POST /api/posts/:id/adopt
Content-Type: application/json

{
  "replyId": "reply123"
}
```

## 开发技巧

### 1. 热重载

前端和后端都支持热重载，修改代码后会自动刷新。

### 2. 查看日志

```bash
# 前端日志
tail -f /tmp/nextjs-dev.log

# 后端日志
tail -f /tmp/backend-dev.log
```

### 3. 调试技巧

- 使用浏览器开发者工具查看网络请求
- 使用React DevTools查看组件状态
- 后端日志会显示所有API请求

### 4. Mock数据

当前系统使用Mock数据（因为MongoDB未连接）。Mock数据定义在：
- `backend/src/routes/mock.ts`

如果需要连接真实数据库：
1. 安装并启动MongoDB
2. 修改 `backend/.env` 中的 `MONGODB_URI`
3. 重启后端服务器

## 常见问题

### Q: 端口被占用怎么办？

```bash
# 查看占用端口的进程
lsof -i :3000
lsof -i :3001

# 杀死进程
kill -9 <PID>
```

### Q: 如何清除缓存？

```bash
# 清除Next.js缓存
rm -rf .next

# 清除node_modules重新安装
rm -rf node_modules
npm install
```

### Q: 如何添加新的API接口？

1. 在 `backend/src/routes/` 创建或修改路由文件
2. 在 `backend/src/index.ts` 中注册路由
3. 重启后端服务器

### Q: 如何添加新的页面？

1. 在 `src/app/` 下创建新目录
2. 添加 `page.tsx` 文件
3. Next.js会自动识别路由

## 下一步开发

### 待实现功能

- [ ] 用户认证系统
- [ ] AI功能集成（OpenAI/通义千问）
- [ ] 文件上传功能
- [ ] WebSocket实时通知
- [ ] 数据埋点和分析
- [ ] 单元测试
- [ ] E2E测试
- [ ] 性能优化
- [ ] 移动端适配
- [ ] 生产环境部署

### 推荐开发顺序

1. **用户认证** - 实现登录/注册功能
2. **文件上传** - 支持图片/视频上传
3. **AI集成** - 接入AI服务生成摘要
4. **实时通知** - WebSocket推送
5. **性能优化** - 虚拟滚动、懒加载
6. **测试** - 单元测试和E2E测试
7. **部署** - Vercel/Docker部署

## 技术栈说明

### 前端
- **Next.js 14**: React框架，支持SSR和SSG
- **TypeScript**: 类型安全
- **CSS Modules**: 样式隔离
- **SWR**: 数据获取和缓存
- **Framer Motion**: 动画库

### 后端
- **Express**: Node.js Web框架
- **MongoDB**: NoSQL数据库
- **Mongoose**: MongoDB ODM
- **TypeScript**: 类型安全

## 贡献指南

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 许可证

MIT License
