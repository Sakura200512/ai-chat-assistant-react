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

function createId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createStarterMessages() {
  return [
    {
      id: createId(),
      role: 'assistant',
      content: 'Hello, I am your AI chat assistant. Ask me anything, or paste code and Markdown for help.',
      createdAt: new Date().toISOString(),
    },
  ];
}

function CodeBlock({ inline, className, children, ...props }) {
  const code = String(children).replace(/\n$/, '');
  const language = /language-(\w+)/.exec(className || '')?.[1];
  const highlighted = language && hljs.getLanguage(language)
    ? hljs.highlight(code, { language }).value
    : hljs.highlightAuto(code).value;

  if (inline) {
    return (
      <code className="inline-code" {...props}>
        {children}
      </code>
    );
  }

  return (
    <pre className="code-block">
      <code dangerouslySetInnerHTML={{ __html: highlighted }} />
    </pre>
  );
}

function App() {
  const [messages, setMessages] = useLocalStorage('ai-chat.messages', createStarterMessages());
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
      id: createId(),
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
          id: createId(),
          role: 'assistant',
          content: answer,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setError(err.message || 'Request failed. Check your API settings.');
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
          id: createId(),
          title: messages.find((message) => message.role === 'user')?.content.slice(0, 28) || 'Untitled chat',
          messages,
          savedAt: new Date().toISOString(),
        },
        ...history,
      ]);
    }

    setMessages(createStarterMessages());
    setError('');
  }

  function clearAll() {
    setMessages(createStarterMessages());
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
            <h1>AI Chat Assistant</h1>
            <span>React edition</span>
          </div>
        </div>

        <button className="primary-action" type="button" onClick={startNewChat}>
          <MessageSquarePlus size={18} />
          New chat
        </button>

        <section className="settings-panel">
          <div className="section-title">
            <Settings2 size={16} />
            API settings
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
            <span>API URL</span>
            <input
              value={settings.apiUrl}
              onChange={(event) => setSettings({ ...settings, apiUrl: event.target.value })}
            />
          </label>
          <label>
            <span>Model</span>
            <input
              value={settings.model}
              onChange={(event) => setSettings({ ...settings, model: event.target.value })}
            />
          </label>
        </section>

        <section className="history-panel">
          <div className="section-title">
            <RotateCcw size={16} />
            History
          </div>
          <div className="history-list">
            {history.length === 0 && <p className="empty-text">No saved chats yet</p>}
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
          Clear chat and history
        </button>
      </aside>

      <section className="chat-area">
        <header className="chat-header">
          <div>
            <h2>Current chat</h2>
            <p>{usefulMessages.length} messages saved in this browser</p>
          </div>
          <div className="status-pill">{isSending ? 'Thinking' : 'Ready'}</div>
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
                Generating answer...
              </div>
            </article>
          )}
        </div>

        {error && <div className="error-box">{error}</div>}

        <form className="composer" onSubmit={handleSubmit}>
          <textarea
            ref={inputRef}
            value={input}
            placeholder="Type your question. Shift + Enter for a new line."
            rows={1}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSubmit(event);
              }
            }}
          />
          <button type="submit" disabled={!input.trim() || isSending} title="Send">
            {isSending ? <Loader2 className="spin" size={20} /> : <Send size={20} />}
          </button>
        </form>
      </section>
    </main>
  );
}

export default App;
