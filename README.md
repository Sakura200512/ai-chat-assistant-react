# AI智能问答助手（React版）

一个类似 ChatGPT 的 AI 聊天项目，适合作为 React 练手项目或 GitHub 作品集项目。

## 功能

- 类 ChatGPT 聊天界面
- 用户输入后通过 Axios 调用 AI API
- 对话记录保存到 LocalStorage
- Markdown 渲染，支持表格、列表、链接
- 代码块高亮
- 新建对话、恢复历史记录、清空对话和历史
- 支持自定义 API 地址、API Key 和模型名称

## 技术栈

- React Hooks：`useState`、`useMemo`、自定义 `useLocalStorage`
- Vite
- Axios
- react-markdown
- remark-gfm
- highlight.js
- lucide-react

## 本地运行

Windows 上也可以直接运行：

```bash
run-dev.cmd
```

如果已经安装 Node.js 和 pnpm，也可以使用：

```bash
pnpm install
pnpm dev
```

打开终端输出的本地地址即可访问。

## API 配置

方式一：在页面左侧直接填写 API Key、API 地址和模型名。配置会保存在浏览器 LocalStorage 中。

方式二：复制 `.env.example` 为 `.env`，然后填写：

```bash
VITE_AI_API_URL=https://api.openai.com/v1/chat/completions
VITE_AI_API_KEY=your_api_key_here
VITE_AI_MODEL=gpt-4o-mini
```

如果使用 DeepSeek 的 OpenAI 兼容接口，可以改成：

```bash
VITE_AI_API_URL=https://api.deepseek.com/chat/completions
VITE_AI_MODEL=deepseek-chat
```

注意：纯前端项目中的 API Key 会暴露在浏览器里。正式上线时建议改成后端代理接口。

## 构建

Windows 上也可以直接运行：

```bash
build.cmd
```

或使用：

```bash
pnpm build
```

构建产物会生成在 `dist` 目录。

## 上传到 GitHub

```bash
git init
git add .
git commit -m "feat: add AI chat assistant"
git branch -M main
git remote add origin https://github.com/Sakura200512/ai-chat-assistant-react.git
git push -u origin main
```
