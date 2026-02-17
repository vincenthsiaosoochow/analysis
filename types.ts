
export enum AppTab {
  HOME = 'home',
  DISCOVER = 'discover',
  ANALYSIS = 'analysis',
  PROFILE = 'profile',
  ADMIN = 'admin',
  EXHIBITIONS = 'exhibitions'
}

export interface ArtworkAnalysis {
  id: number;  // 数据库 ID，与后端一致
  title: string;
  artist: string;
  artistGender?: string;
  style: string;
  period: string;
  origin: string;
  palette: string[];
  composition: string;
  interpretation: string;
  imageUrl: string;
  authorName?: string;
  authorAvatar?: string;
  isSaved?: boolean;
  likes?: number;

  // New Expert Modules
  coreAnalysis?: {
    styleAndSchool: string;
    colorUsage: string;
    brushworkTexture: string;
    compositionLayout: string;
    themeAndMood: string;
    artisticValue: string;
  };
  artistInfo?: {
    basics: string;
    marketPosition: string;
    representativeWorks: string | string[];
    styleEvolution: string;
  };
  investmentAnalysis?: {
    rating: 'S' | 'A' | 'B' | 'C' | 'D';
    ratingReason: string;
    marketTrends: string;
    collectionAdvice: string | Record<string, string>;
    riskAlert: string | Record<string, string>;
    alternatives: string | string[];
  };
}

export interface GalleryItem {
  id: number;
  imageUrl: string;
  tag: string;
  authorName: string;
  authorAvatar: string;
  likes: string;
  title?: string;
}
// 展览状态枚举（值与后端保持一致）
export enum ExhibitionStatus {
  UPCOMING = "upcoming",
  ONGOING = "ongoing",
  ENDED = "ended"
}

// 展览状态中文显示标签
export const ExhibitionStatusLabel: Record<ExhibitionStatus, string> = {
  [ExhibitionStatus.UPCOMING]: "即将开始",
  [ExhibitionStatus.ONGOING]: "进行中",
  [ExhibitionStatus.ENDED]: "已结束",
};

// 展览数据结构
export interface Exhibition {
  id: number;
  title: string;
  cover_image: string;
  venue: string;
  start_date: string;
  end_date: string;
  address?: string;
  city?: string;
  country?: string;
  continent?: string;
  ticket_info?: string;
  description?: string;
  official_link?: string;
  status: ExhibitionStatus;
  is_favorited?: boolean;
  created_at?: string;
}

export interface ExhibitionFilterState {
  status?: string;
  city?: string;
  keyword?: string;
  skip?: number;
  limit?: number;
}

export interface FeaturedItem {
  id: number;
  title: string;
  artist: string;
  tag: string;
  imageUrl: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  avatar: string;
  is_admin?: boolean;
}
