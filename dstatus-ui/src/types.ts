export interface Config {
  name: string;
  description: string;
  client_id: string;
  details: string;
  state: string;
  large_image: string;
  large_text: string;
  small_image: string;
  small_text: string;
  party_size: number;
  max_party_size: number;
  buttons: Array<{ label: string; url: string }> | null;
  start_timestamp?: number;
  end_timestamp?: number;
  party_max?: number;
  match_secret?: string;
  join_secret?: string;
  spectate_secret?: string;
  instance?: boolean;
}

export type Button = {
  label: string;
  url: string;
};

export type UpdateInfo = {
  shouldUpdate: boolean;
  manifest?: {
    version: string;
  };
};

export type Template = {
  name: string;
  description: string;
  config: Config;
};

export interface UserTemplate {
  id: string;
  name: string;
  description: string;
  config: Config;
  created_at: string;
  last_used: string;
}
