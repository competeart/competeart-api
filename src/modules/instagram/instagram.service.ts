interface InstagramMediaApi {
  id: string;
  media_type: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
}

interface InstagramApiResponse {
  data?: InstagramMediaApi[];
  error?: {
    message?: string;
  };
}

export interface InstagramPost {
  id: string;
  mediaType: string;
  imageUrl: string;
  permalink: string;
  caption?: string;
  timestamp: string;
  likeCount: number;
  commentsCount: number;
}

interface InstagramFeed {
  connected: boolean;
  username: string;
  items: InstagramPost[];
}

const TEMPO_CACHE_MS = 30 * 60 * 1000;

let cache: { feed: InstagramFeed; expiraEm: number } | null = null;

export class InstagramService {
  async listarUltimasPublicacoes(): Promise<InstagramFeed> {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    const username = process.env.INSTAGRAM_USERNAME || "competeartfestival";

    if (!token) {
      return { connected: false, username, items: [] };
    }

    if (cache && cache.expiraEm > Date.now()) {
      return cache.feed;
    }

    try {
      const versao = process.env.INSTAGRAM_API_VERSION || "v25.0";
      const usuario = process.env.INSTAGRAM_USER_ID || "me";
      const apiBaseUrl =
        process.env.INSTAGRAM_API_BASE_URL || "https://graph.facebook.com";
      const campos = [
        "id",
        "media_type",
        "media_url",
        "thumbnail_url",
        "permalink",
        "caption",
        "timestamp",
        "like_count",
        "comments_count",
      ].join(",");
      const url = new URL(
        `${apiBaseUrl.replace(/\/$/, "")}/${versao}/${usuario}/media`,
      );
      url.searchParams.set("fields", campos);
      url.searchParams.set("limit", "10");

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(8000),
      });
      const payload = (await response.json()) as InstagramApiResponse;

      if (!response.ok) {
        throw new Error(payload.error?.message || "INSTAGRAM_API_ERROR");
      }

      const items = (payload.data || [])
        .map((media): InstagramPost | null => {
          const imageUrl = media.thumbnail_url || media.media_url;

          if (!imageUrl || !media.permalink) {
            return null;
          }

          return {
            id: media.id,
            mediaType: media.media_type,
            imageUrl,
            permalink: media.permalink,
            caption: media.caption,
            timestamp: media.timestamp,
            likeCount: media.like_count || 0,
            commentsCount: media.comments_count || 0,
          };
        })
        .filter((item): item is InstagramPost => item !== null)
        .slice(0, 10);

      const feed = { connected: true, username, items };
      cache = { feed, expiraEm: Date.now() + TEMPO_CACHE_MS };

      return feed;
    } catch (error) {
      if (cache) {
        return cache.feed;
      }

      throw error;
    }
  }
}
