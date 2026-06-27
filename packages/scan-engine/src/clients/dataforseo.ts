import {
  DFS_GBP_POSTS_POLL_INTERVAL_MS,
  DFS_GBP_POSTS_POLL_TIMEOUT_MS,
  DFS_REVIEWS_POLL_INTERVAL_MS,
  DFS_REVIEWS_POLL_TIMEOUT_MS,
} from '../constants.js';

const DFS_BASE = 'https://api.dataforseo.com/v3';

export class DataForSeoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataForSeoError';
  }
}

const REVIEWS_PENDING = new Set([40100, 40101, 40601, 40602]);
const REVIEWS_TERMINAL = new Set([40400, 40401, 40500, 50000]);

export interface DfsTaskResponse {
  tasks?: Array<{
    id?: string;
    status_code?: number;
    status_message?: string;
    result?: unknown;
    cost?: number;
  }>;
  cost?: number;
}

export interface DataForSeoClient {
  postLive(endpoint: string, payload: unknown[]): Promise<DfsTaskResponse>;
  taskPost(endpoint: string, payload: unknown[]): Promise<string>;
  taskGet(endpoint: string, taskId: string): Promise<DfsTaskResponse>;
  pollReviews(taskId: string): Promise<DfsTaskResponse | null>;
  pollGbpPosts(taskId: string): Promise<DfsTaskResponse | null>;
}

function authHeader(login: string, password: string): string {
  return `Basic ${Buffer.from(`${login}:${password}`).toString('base64')}`;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function createDataForSeoClient(
  login: string,
  password: string,
  fetchFn: typeof fetch = fetch,
): DataForSeoClient {
  const headers = {
    Authorization: authHeader(login, password),
    'Content-Type': 'application/json',
  };

  return {
    async postLive(endpoint: string, payload: unknown[]): Promise<DfsTaskResponse> {
      const r = await fetchFn(`${DFS_BASE}/${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const data = (await r.json()) as DfsTaskResponse;
      if (!r.ok) {
        throw new DataForSeoError(`DFS HTTP ${r.status} (${endpoint})`);
      }
      const firstTask = data.tasks?.[0];
      if (firstTask?.status_code !== undefined && firstTask.status_code >= 40000) {
        throw new DataForSeoError(
          `DFS task error ${firstTask.status_code}: ${firstTask.status_message ?? ''} (${endpoint})`,
        );
      }
      return data;
    },

    async taskPost(endpoint: string, payload: unknown[]): Promise<string> {
      const r = await fetchFn(`${DFS_BASE}/${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const data = (await r.json()) as DfsTaskResponse;
      const taskId = data.tasks?.[0]?.id;
      if (!taskId) {
        throw new Error(`DFS task_post failed: no task id (${endpoint})`);
      }
      return taskId;
    },

    async taskGet(endpoint: string, taskId: string): Promise<DfsTaskResponse> {
      const r = await fetchFn(`${DFS_BASE}/${endpoint}/${taskId}`, { headers });
      return r.json() as Promise<DfsTaskResponse>;
    },

    async pollReviews(taskId: string): Promise<DfsTaskResponse | null> {
      const start = Date.now();
      while (true) {
        await sleep(DFS_REVIEWS_POLL_INTERVAL_MS);
        if (Date.now() - start > DFS_REVIEWS_POLL_TIMEOUT_MS) {
          return null;
        }
        const poll = await this.taskGet('business_data/google/reviews/task_get', taskId);
        const task = poll.tasks?.[0];
        const sc = task?.status_code;
        if (sc === 20000 && task?.result) {
          return poll;
        }
        if (sc !== undefined && REVIEWS_PENDING.has(sc)) {
          continue;
        }
        if (sc !== undefined && REVIEWS_TERMINAL.has(sc)) {
          return null;
        }
      }
    },

    async pollGbpPosts(taskId: string): Promise<DfsTaskResponse | null> {
      const start = Date.now();
      while (true) {
        await sleep(DFS_GBP_POSTS_POLL_INTERVAL_MS);
        const poll = await this.taskGet('business_data/google/my_business_updates/task_get', taskId);
        const task = poll.tasks?.[0];
        const sc = task?.status_code;
        if (sc === 20000) {
          return poll;
        }
        if (sc === 40102) {
          return null;
        }
        if (sc !== undefined && sc >= 40000 && sc !== 40602) {
          return null;
        }
        if (Date.now() - start > DFS_GBP_POSTS_POLL_TIMEOUT_MS) {
          return null;
        }
      }
    },
  };
}
