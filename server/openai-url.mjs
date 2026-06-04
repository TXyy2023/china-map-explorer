export const DEFAULT_OPENAI_API_BASE_URL = 'https://api.openai.com/v1';

const knownEndpointSuffixes = [
  ['audio', 'speech'],
  ['audio', 'transcriptions'],
  ['audio', 'translations'],
  ['chat', 'completions'],
  ['images', 'edits'],
  ['images', 'generations'],
  ['realtime', 'sessions'],
  ['responses'],
  ['completions'],
  ['embeddings'],
  ['models'],
];

function withProtocol(rawUrl) {
  return /^[a-z][a-z\d+\-.]*:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
}

function trimKnownEndpointSuffix(pathname) {
  let segments = pathname.split('/').filter(Boolean);
  const matchedSuffix = knownEndpointSuffixes.find((suffix) => {
    if (segments.length < suffix.length) return false;
    return suffix.every((part, index) => segments[segments.length - suffix.length + index] === part);
  });

  if (matchedSuffix) {
    segments = segments.slice(0, -matchedSuffix.length);
  }

  return segments.length ? `/${segments.join('/')}` : '/v1';
}

export function normalizeOpenAiApiBaseUrl(value) {
  const rawUrl = String(value || DEFAULT_OPENAI_API_BASE_URL).trim();
  let url;

  try {
    url = new URL(withProtocol(rawUrl));
  } catch {
    throw new Error(`OPENAI_BASE_URL 无法解析：${rawUrl}`);
  }

  if (url.protocol === 'ws:') {
    url.protocol = 'http:';
  } else if (url.protocol === 'wss:') {
    url.protocol = 'https:';
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`OPENAI_BASE_URL 只支持 HTTP API 地址，当前协议是 ${url.protocol}`);
  }

  url.pathname = trimKnownEndpointSuffix(url.pathname);
  url.search = '';
  url.hash = '';

  return url.toString().replace(/\/+$/, '');
}

export function getOpenAiApiBaseUrl() {
  return normalizeOpenAiApiBaseUrl(process.env.OPENAI_BASE_URL || process.env.OPENAI_API_BASE);
}
