#!/bin/bash

echo "🛑 停止百问百答社区系统"
echo ""

# 停止前端服务器
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "停止前端服务器..."
    kill $(lsof -t -i:3000)
    echo "✅ 前端服务器已停止"
else
    echo "⚠️  前端服务器未运行"
fi

# 停止后端服务器
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "停止后端服务器..."
    kill $(lsof -t -i:3001)
    echo "✅ 后端服务器已停止"
else
    echo "⚠️  后端服务器未运行"
fi

echo ""
echo "✅ 系统已停止"
