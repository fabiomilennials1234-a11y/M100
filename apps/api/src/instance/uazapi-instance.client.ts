import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

/**
 * Thin HTTP boundary over the UAZAPI instance-lifecycle API. All UAZAPI
 * endpoint paths and auth-header conventions live HERE and nowhere else, so a
 * provider change (or a correction to the paths below) is a single-file edit.
 *
 * ⚠️ VERIFY before go-live: the paths/headers below follow uazapiGO v2's
 * documented shape (admintoken for server-level ops, token per instance), but
 * the UAZAPI docs are JS-rendered and could not be auto-scraped. Confirm
 * against the live panel / Postman collection of the account.
 */
const ENDPOINTS = {
  init: '/instance/init', // POST, header admintoken, body { name }
  connect: '/instance/connect', // POST, header token → { instance: { qrcode } }
  status: '/instance/status', // GET, header token → { instance: { status } }
  webhook: '/instance/updateWebhook', // POST, header token, body { url, ... }
  delete: '/instance', // DELETE, header token
} as const;

export interface UazapiCreatedInstance {
  instanceName: string;
  token: string;
}

@Injectable()
export class UazapiInstanceClient {
  private readonly logger = new Logger(UazapiInstanceClient.name);

  async init(
    serverUrl: string,
    adminToken: string,
    name: string,
  ): Promise<UazapiCreatedInstance> {
    const { data } = await axios.post(
      `${serverUrl}${ENDPOINTS.init}`,
      { name },
      { headers: { admintoken: adminToken } },
    );
    const inst = data.instance ?? data;
    return { instanceName: inst.name ?? inst.instanceName, token: inst.token };
  }

  async connect(serverUrl: string, token: string): Promise<{ qrcode: string }> {
    const { data } = await axios.post(
      `${serverUrl}${ENDPOINTS.connect}`,
      {},
      { headers: { token } },
    );
    const inst = data.instance ?? data;
    return { qrcode: inst.qrcode ?? '' };
  }

  async status(serverUrl: string, token: string): Promise<string> {
    const { data } = await axios.get(`${serverUrl}${ENDPOINTS.status}`, {
      headers: { token },
    });
    const inst = data.instance ?? data;
    return inst.status ?? 'disconnected';
  }

  async setWebhook(
    serverUrl: string,
    token: string,
    webhookUrl: string,
  ): Promise<void> {
    await axios.post(
      `${serverUrl}${ENDPOINTS.webhook}`,
      { url: webhookUrl, enabled: true },
      { headers: { token } },
    );
  }

  async delete(serverUrl: string, token: string): Promise<void> {
    await axios.delete(`${serverUrl}${ENDPOINTS.delete}`, {
      headers: { token },
    });
  }
}
