/**
 * src/utils/gistClient.ts
 * Low-level GitHub REST API Client for Gist Creation, Retrieval & Update
 */

export function sanitizeToken(token?: string | null): string {
  if (!token) return '';
  return token
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim();
}

export function maskToken(token?: string | null): string {
  const sanitized = sanitizeToken(token);
  if (!sanitized) return '';
  if (sanitized.length <= 8) return '****';
  const prefix = sanitized.slice(0, 4);
  const suffix = sanitized.slice(-4);
  return `${prefix}****${suffix}`;
}

export interface ValidatePatResult {
  valid: boolean;
  username?: string;
  error?: string;
}

export async function validatePat(pat?: string | null): Promise<ValidatePatResult> {
  const token = sanitizeToken(pat);
  if (!token) {
    return { valid: false, error: 'Kein GitHub Personal Access Token (PAT) angegeben.' };
  }

  try {
    const response = await fetch('https://api.github.com/user', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (response.status === 200) {
      const data = await response.json();
      return { valid: true, username: data.login };
    }

    if (response.status === 401) {
      return { valid: false, error: 'Ungültiger GitHub Token (401 Unauthorized).' };
    }

    if (response.status === 403) {
      const data = await response.json().catch(() => ({}));
      const msg = data.message || 'API Rate Limit überschritten';
      return { valid: false, error: `GitHub API Rate Limit erreicht (403): ${msg}` };
    }

    return { valid: false, error: `GitHub Fehler (${response.status}): ${response.statusText}` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { valid: false, error: `Netzwerkfehler: ${msg}` };
  }
}

export interface GistResponse {
  id: string;
  htmlUrl: string;
  content?: string;
  files?: Record<string, { filename: string; content: string }>;
  owner?: { login: string };
  updatedAt?: string;
  raw?: any;
}

export async function createGist(
  pat: string,
  filename: string,
  content: string,
  description = 'NachhilfeTest Sync Backup',
  isPublic = false
): Promise<GistResponse> {
  const token = sanitizeToken(pat);
  if (!token) throw new Error('Kein Token angegeben');

  const response = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({
      description,
      public: isPublic,
      files: {
        [filename]: {
          content,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`GitHub Fehler (${response.status}): ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  const fileObj = data.files?.[filename] || Object.values(data.files || {})[0];

  return {
    id: data.id,
    htmlUrl: data.html_url,
    content: (fileObj as any)?.content,
    files: data.files,
    owner: data.owner,
    updatedAt: data.updated_at,
    raw: data,
  };
}

export async function getGist(pat: string, gistId: string): Promise<GistResponse> {
  const token = sanitizeToken(pat);
  const cleanId = gistId.trim();
  if (!token) throw new Error('Kein Token angegeben');
  if (!cleanId) throw new Error('Keine Gist-ID angegeben');

  const response = await fetch(`https://api.github.com/gists/${cleanId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`GitHub Fehler (${response.status}): ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  const fileObj = Object.values(data.files || {})[0] as { content?: string } | undefined;

  return {
    id: data.id,
    htmlUrl: data.html_url,
    content: fileObj?.content,
    files: data.files,
    owner: data.owner,
    updatedAt: data.updated_at,
    raw: data,
  };
}

export async function updateGist(
  pat: string,
  gistId: string,
  filename: string,
  content: string,
  description?: string
): Promise<GistResponse> {
  const token = sanitizeToken(pat);
  const cleanId = gistId.trim();
  if (!token) throw new Error('Kein Token angegeben');
  if (!cleanId) throw new Error('Keine Gist-ID angegeben');

  const bodyObj: Record<string, unknown> = {
    files: {
      [filename]: {
        content,
      },
    },
  };
  if (description) {
    bodyObj.description = description;
  }

  const response = await fetch(`https://api.github.com/gists/${cleanId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify(bodyObj),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`GitHub Fehler (${response.status}): ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  const fileObj = data.files?.[filename] || Object.values(data.files || {})[0];

  return {
    id: data.id,
    htmlUrl: data.html_url,
    content: (fileObj as any)?.content,
    files: data.files,
    owner: data.owner,
    updatedAt: data.updated_at,
    raw: data,
  };
}
