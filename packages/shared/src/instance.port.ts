export type InstanceConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected';

export interface ChannelInstanceView {
  id: string;
  name: string;
  phone: string | null;
  instanceName: string;
  status: string;
  createdAt: Date;
}

export interface CreateInstanceInput {
  /** Friendly, admin-facing name, e.g. "Vendas" or "Suporte". */
  name: string;
}

export interface QrCodeResult {
  /** Base64-encoded QR image (or raw connect code) to render in the UI. */
  base64: string;
}

/**
 * Channel instance lifecycle. Owns the UAZAPI integration and credential
 * persistence (instance token stored encrypted at rest). Conversations are
 * linked to the instance they originated from.
 */
export interface InstancePort {
  create(input: CreateInstanceInput): Promise<ChannelInstanceView>;
  findAll(): Promise<ChannelInstanceView[]>;
  findById(id: string): Promise<ChannelInstanceView | null>;
  remove(id: string): Promise<void>;
  getQrCode(id: string): Promise<QrCodeResult>;
  getStatus(id: string): Promise<InstanceConnectionStatus>;
  registerWebhook(id: string): Promise<void>;
}
