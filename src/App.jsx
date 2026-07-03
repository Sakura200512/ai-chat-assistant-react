import { useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import hljs from 'highlight.js';
import {
  Bot,
  KeyRound,
  Loader2,
  MessageSquarePlus,
  RotateCcw,
  Send,
  Settings2,
  Trash2,
  UserRound,
} from 'lucide-react';
import { askAI } from './api/aiClient';
import { useLocalStorage } from './hooks/useLocalStorage';

const starterMessages = [
  {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: '你好，我是 AI 智能问答助手。你可以问我问题，也可以让我帮你写代码、总结文章或整理思路。',
    createdAt: new Date().toISOString(),
  },
];

function CodeBlock({ inline, className, children, ...props }) {
  const code = String(children).replace(/\n$/, '');
  const language = /language-(\w+)/.exec(className || '')?.[1];
  const highlighted = language && hljs.getLanguage(language)
    ? hljs.highlight(code, { language }).value
    : hljs.highlightAuto(code).value;

  if (inline) {
    return <code className="inline-code" {...props}>{children}</code>;
  }

  return (
    <pre className="code-block">
      <code dangerouslySetInnerHTML={{ __html: highlighted }} />
    </pre>
  );
}

function App() {
  const [messages, setMessages] = useLocalStorage('ai-chat.messages', starterMessages);
  const [history, setHistory] = useLocalStorage('ai-chat.history', []);
  const [settings, setSettings] = useLocalStorage('ai-chat.settings', {
    apiKey: '',
    apiUrl: import.meta.env.VITE_AI_API_URL || 'https://api.openai.com/v1/chat/completions',
    model: import.meta.env.VITE_AI_MODEL || 'gpt-4o-mini',
  });
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const usefulMessages = useMemo(
    () => messages.filter((message) => message.role !== 'system'),
    [messages],
  );

  async function handleSubmit(event) {
    event.preventDefault();
    const content = input.trim();
    if (!content || isSending) return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setError('');
    setIsSending(true);

    try {
      const answer = await askAI({
        messages: nextMessages,
        apiKey: settings.apiKey,
        apiUrl: settings.apiUrl,
        model: settings.model,
      });

      setMessages([
        ...nextMessages,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: answer,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setError(err.message || '请求失败，请检查 API 配置。');
      setMessages(nextMessages);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }

  function startNewChat() {
    if (messages.length > 1) {
      setHistory([
        {
          id: crypto.randomUUID(),
          title: messages.find((message) => message.role === 'user')?.content.slice(0, 28) || '未命名对话',
          messages,
          savedAt: new Date().toISOString(),
        },
        ...history,
      ]);
    }

    setMessages(starterMessages);
    setError('');
  }

  function clearAll() {
    setMessages(starterMessages);
    setHistory([]);
    setError('');
  }

  function restoreChat(chat) {
    setMessages(chat.messages);
    setError('');
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Bot size={22} /></div>
          <div>
            <h1>AI智能问答助手</h1>
            <span>React版</span>
          </div>
        </div>

        <button className="primary-action" type="button" onClick={startNewChat}>
          <MessageSquarePlus size={18} />
          新对话
        </button>

        <section className="settings-panel">
          <div className="section-title">
            <Settings2 size={16} />
            API配置
          </div>
          <label>
            <span>API Key</span>
            <div className="input-with-icon">
              <KeyRound size={16} />
              <input
                type="password"
                value={settings.apiKey}
                placeholder="sk-..."
                onChange={(event) => setSettings({ ...settings, apiKey: event.target.value })}
              />
            </div>
          </label>
          <label>
            <span>API地址</span>
            <input
              value={settings.apiUrl}
              onChange={(event) => setSettings({ ...settings, apiUrl: event.target.value })}
            />
          </label>
          <label>
            <span>模型</span>
            <input
              value={settings.model}
              onChange={(event) => setSettings({ ...settings, model: event.target.value })}
            />
          </label>
        </section>

        <section className="history-panel">
          <div className="section-title">
            <RotateCcw size={16} />
            历史记录
          </div>
          <div className="history-list">
            {history.length === 0 && <p className="empty-text">暂无历史对话</p>}
            {history.map((chat) => (
              <button key={chat.id} type="button" onClick={() => restoreChat(chat)}>
                <span>{chat.title}</span>
                <small>{new Date(chat.savedAt).toLocaleString()}</small>
              </button>
            ))}
          </div>
        </section>

        <button className="danger-action" type="button" onClick={clearAll}>
          <Trash2 size={17} />
          清空对话 / 历史
        </button>
      </aside>

      <section className="chat-area">
        <header className="chat-header">
          <div>
            <h2>当前对话</h2>
            <p>{usefulMessages.length} 条消息保存在本地浏览器</p>
          </div>
          <div className="status-pill">{isSending ? 'AI思考中' : '就绪'}</div>
        </header>

        <div className="messages">
          {messages.map((message) => (
            <article className={`message ${message.role}`} key={message.id}>
              <div className="avatar">
                {message.role === 'user' ? <UserRound size={18} /> : <Bot size={18} />}
              </div>
              <div className="bubble">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{ code: CodeBlock }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </article>
          ))}
          {isSending && (
            <article className="message assistant">
              <div className="avatar"><Bot size={18} /></div>
              <div className="bubble loading">
                <Loader2 size={18} />
                正在生成回答...
              </div>
            </article>
          )}
        </div>

        {error && <div className="error-box">{error}</div>}

        <form className="composer" onSubmit={handleSubmit}>
          <textarea
            ref={inputRef}
            value={input}
            placeholder="输入你的问题，Shift + Enter 换行"
            rows={1}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSubmit(event);
              }
            }}
          />
          <button type="submit" disabled={!input.trim() || isSending} title="发送">
            {isSending ? <Loader2 className="spin" size={20} /> : <Send size={20} />}
          </button>
        </form>
      </section>
    </main>
  );
}

export default App;
