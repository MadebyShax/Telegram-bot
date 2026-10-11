export interface ProductMetadata {
  product_name_uz: string;
  product_name_ru: string;
  category: string;
  primary_colors: string[];
  materials: string[];
  shape_and_form: string;
  key_features: string[];
  target_audience: string;
  suggested_price_uzs: number;
  uzum_title_uz: string;
  uzum_title_ru: string;
  wildberries_title_ru: string;
  bullet_points_uz: string[];
  bullet_points_ru: string[];
  seo_tags_uz: string[];
  seo_tags_ru: string[];
  infographic_badges: string[];
}

export interface StudioCard {
  id: string;
  index: number;
  styleName: string;
  badge: string;
  imageUrl: string;
  aspectRatio: string;
  description: string;
}

export interface TelegramMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  timestamp: string;
  type: 'text' | 'photo' | 'invoice' | 'media_group' | 'status_progress' | 'ask_infographics';
  text?: string;
  imageUrl?: string;
  mediaGroup?: StudioCard[];
  productMetadata?: ProductMetadata;
  pendingProductData?: any;
  withInfographics?: boolean;
  invoiceData?: {
    title: string;
    description: string;
    amountUzs: number;
    cardsCount: number;
    provider: 'CLICK' | 'PAYME';
  };
  progressStep?: {
    current: number;
    total: number;
    title: string;
    subtitle: string;
  };
}

export interface DbUser {
  telegram_id: number;
  username: string;
  full_name: string;
  credits: number;
  created_at: string;
}

export interface DbTransaction {
  id: string;
  user_id: number;
  amount_uzs: number;
  provider: 'CLICK' | 'PAYME';
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  created_at: string;
}

export interface DbCardGeneration {
  id: string;
  user_id: number;
  product_name: string;
  cards_count: number;
  cost_usd: number;
  created_at: string;
}
