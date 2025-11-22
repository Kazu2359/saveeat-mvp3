// src/types/post.ts
export type MediaItem = {
  type: "image" | "video";
  url: string;
  thumb_url?: string;
};

export type Post = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  ingredients: string[];
  media: MediaItem[];
  created_at: string;
  profiles?: {
    name?: string | null;
    avatar_url?: string | null;
  } | null;
  like_count?: number;
  comment_count?: number;
  is_liked?: boolean;
  likers?: string[];
};
