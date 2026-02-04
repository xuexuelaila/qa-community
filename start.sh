#!/bin/bash

echo "🚀 启动百问百答社区系统"
echo ""

# 使用脚本所在目录作为项目根目录
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 检查是否已经有进程在运行
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  前端服务器已在运行 (端口 3000)"
else
    echo "📦 启动前端服务器..."
    cd "$ROOT_DIR"
    npm run dev > /tmp/nextjs-dev.log 2>&1 &
    echo "✅ 前端服务器已启动: http://localhost:3000"
fi

if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  后端服务器已在运行 (端口 3001)"
else
    echo "📦 启动后端服务器..."
    cd "$ROOT_DIR/backend"
    npm run dev > /tmp/backend-dev.log 2>&1 &
    echo "✅ 后端服务器已启动: http://localhost:3001"
fi

echo ""
echo "🎉 系统启动完成！"
echo ""
echo "📍 访问地址："
echo "   - 航海日志: http://localhost:3000"
echo "   - 求助站: http://localhost:3000/community"
echo "   - API文档: http://localhost:3001/health"
echo ""
echo "📝 查看日志："
echo "   - 前端: tail -f /tmp/nextjs-dev.log"
echo "   - 后端: tail -f /tmp/backend-dev.log"
