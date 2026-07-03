import axios from 'axios';

const defaultApiUrl = 'https://api.openai.com/v1/chat/completions';

export async function askAI({ messages, apiKey, apiUrl, model }) {
  const endpoint = apiUrl || import.meta.env.VITE_AI_API_URL || defaultApiUrl;
  const token = apiKey || import.meta.env.VITE_AI_API_KEY;
  const selectedModel = model || import.meta.env.VITE_AI_MODEL || 'gpt-4o-mini';

  if (!token) {
    throw new Error('请先填写 API Key，或在 .env 中配置 VITE_AI_API_KEY。');
  }

  const response = await axios.post(
    endpoint,
    {
      model: selectedModel,
      messages: messages.map(({ role, content }) => ({ role, content })),
      temperature: 0.7,
      stream: false,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );

  const answer = response.data?.choices?.[0]?.message?.content;
  if (!answer) {
    throw new Error('AI API 没有返回可显示的回答。');
  }

  return answer;
}
