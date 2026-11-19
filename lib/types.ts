import type { StylePrefs } from "./stylePrefs";

export type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  style_prefs?: StylePrefs | null;
};

export type Post = {
  id: string;
  user_id: string;
  caption: string | null;
  image_url: string | null;
  created_at: string;
  profiles: Profile;
  likes: { count: number }[];
  comments: { count: number }[];
  user_has_liked?: boolean;
};

export type Like = {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
};

export type Comment = {
  id: string;
  user_id: string;
  post_id: string;
  body: string;
  created_at: string;
  profiles: Profile;
};

export type Follow = {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
};

export type Notification = {
  id: string;
  recipient_id: string;
  actor_id: string;
  type: "like" | "comment" | "follow";
  post_id: string | null;
  read: boolean;
  created_at: string;
  actor: Profile;
  post?: Pick<Post, "id" | "image_url">;
};
