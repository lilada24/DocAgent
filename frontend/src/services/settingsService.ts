export interface ApiSettings {
  apiKey: string;
  baseUrl: string;
  model: string;
}

const STORAGE_KEY = 'docagent_api_settings';

export const settingsService = {
  /** 获取保存的 API 设置 */
  getApiSettings: (): ApiSettings => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return {
      apiKey: '',
      baseUrl: '',
      model: 'deepseek-chat',
    };
  },

  /** 保存 API 设置 */
  saveApiSettings: (settings: ApiSettings): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  },

  /** 清除 API 设置 */
  clearApiSettings: (): void => {
    localStorage.removeItem(STORAGE_KEY);
  },

  /** 获取请求时使用的 headers（包含 API Key） */
  getRequestHeaders: (): Record<string, string> => {
    const settings = settingsService.getApiSettings();
    const headers: Record<string, string> = {};
    if (settings.apiKey) {
      headers['X-API-Key'] = settings.apiKey;
    }
    if (settings.baseUrl) {
      headers['X-API-Base-Url'] = settings.baseUrl;
    }
    if (settings.model) {
      headers['X-Model'] = settings.model;
    }
    return headers;
  },
};
