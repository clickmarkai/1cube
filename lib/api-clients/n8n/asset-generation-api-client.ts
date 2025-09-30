export interface GenerationResponse {
  url: string;
}

export interface AssetGenerationConfig {
  baseUrl?: string;
}

export class AssetGenerationApiClient {
  private baseUrl: string;

  constructor(config?: AssetGenerationConfig) {
    this.baseUrl = config?.baseUrl || 'https://primary-production-b68a.up.railway.app';
  }

  private async postJson<T>(endpoint: string, body: Record<string, any>): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Asset generation request failed: ${resp.status} ${resp.statusText} - ${text}`);
    }

    const data = await resp.json();
    return data as T;
  }

  async imageEdit(params: { imageUrl: string; prompt: string }): Promise<GenerationResponse> {
    return this.postJson<GenerationResponse>(
      '/webhook-test/image/edit',
      { imageUrl: params.imageUrl, prompt: params.prompt }
    );
  }

  async imageCreate(params: { prompt: string }): Promise<GenerationResponse> {
    return this.postJson<GenerationResponse>(
      '/webhook-test/image/create',
      { prompt: params.prompt }
    );
  }

  async videoCreate(params: { prompt: string; imageUrl: string }): Promise<GenerationResponse> {
    return this.postJson<GenerationResponse>(
      '/webhook-test/video/create',
      { prompt: params.prompt, imageUrl: params.imageUrl }
    );
  }
}


