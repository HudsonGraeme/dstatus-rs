export interface Config {
  client_id: string;
  details: string;
  state: string;
  large_image: string;
  large_text: string;
  small_image: string;
  small_text: string;
  party_size: number;
  max_party_size: number;
  buttons?: Button[];
}

export interface Button {
  label: string;
  url: string;
}

export interface Template {
  name: string;
  description: string;
  config: Config;
}
