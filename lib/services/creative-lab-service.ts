import { appLogger } from "@/lib/logger";
import { CreativeLabRepository, type CreativeLabSession, type CreativeLabAsset } from "@/lib/repositories";
import { AssetGenerationApiClient } from "@/lib/api-clients/n8n/asset-generation-api-client";
import { UploadService } from "@/lib/services";

export class CreativeLabService {
  private repo: CreativeLabRepository;
  private log = appLogger;
  private generator = new AssetGenerationApiClient();

  constructor(repository?: CreativeLabRepository) {
    this.repo = repository || new CreativeLabRepository();
  }

  /**
   * Create a creative lab session and upload a single asset in one call
   */
  async createSessionAndAddAsset(
    userId: string,
    asset: { asset: string; asset_type: string; prompt?: string | null }
  ): Promise<{ session: CreativeLabSession; asset: CreativeLabAsset } | null> {
    try {
      const session = await this.repo.createSession(userId);
      if (!session) return null;

      const createdAsset = await this.repo.addAsset(session.id, asset);
      if (!createdAsset) return null;

      return { session, asset: createdAsset };
    } catch (err) {
      this.log.error('Failed to create session and add asset', err);
      return null;
    }
  }

  /**
   * Create a creative lab session only
   */
  async createSession(userId: string): Promise<CreativeLabSession | null> {
    try {
      return await this.repo.createSession(userId);
    } catch (err) {
      this.log.error('Failed to create session', err);
      return null;
    }
  }

  /**
   * Add a single asset to an existing creative lab session
   */
  async addAsset(
    sessionId: string,
    asset: { asset: string; asset_type: string; prompt?: string | null }
  ): Promise<CreativeLabAsset | null> {
    try {
      return await this.repo.addAsset(sessionId, asset);
    } catch (err) {
      this.log.error('Failed to add asset to session', err);
      return null;
    }
  }

  /**
   * Generate an image from prompt and attach it to an existing session
   */
  async generateImageInSession(
    sessionId: string,
    prompt: string
  ): Promise<CreativeLabAsset | null> {
    try {
      const result = await this.generator.imageCreate({ prompt });
      if (!result?.url) return null;

      return await this.repo.addAsset(sessionId, {
        asset: result.url,
        asset_type: 'image',
        prompt,
      });
    } catch (err) {
      this.log.error('Failed to generate image in session', err);
      return null;
    }
  }

  /**
   * Edit the latest image in the session using a prompt, then store the result as a new image asset
   */
  async editLatestImageInSession(
    sessionId: string,
    prompt: string
  ): Promise<CreativeLabAsset | null> {
    try {
      const latest = await this.repo.getLatestImageAsset(sessionId);
      if (!latest?.asset) return null;

      const result = await this.generator.imageEdit({ imageUrl: latest.asset, prompt });
      if (!result?.url) return null;

      return await this.repo.addAsset(sessionId, {
        asset: result.url,
        asset_type: 'image',
        prompt,
      });
    } catch (err) {
      this.log.error('Failed to edit latest image in session', err);
      return null;
    }
  }

  /**
   * Upload a raw image file to storage and attach it to the session
   */
  async uploadImageToSession(
    sessionId: string,
    file: File,
    options?: { userId?: string; channel?: string }
  ): Promise<CreativeLabAsset | null> {
    try {
      const upload = await UploadService.upload([file], {
        channel: options?.channel || 'creative-lab',
        userId: options?.userId,
      });

      const first = (upload.files || []).find(f => f.fileUrl && !f.error);
      if (!upload.success || !first?.fileUrl) return null;

      return await this.repo.addAsset(sessionId, {
        asset: first.fileUrl,
        asset_type: 'image',
        prompt: null,
      });
    } catch (err) {
      this.log.error('Failed to upload image to session', err);
      return null;
    }
  }
}


