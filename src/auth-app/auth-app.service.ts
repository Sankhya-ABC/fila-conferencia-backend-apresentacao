import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import * as https from 'https';

@Injectable()
export class AuthAppService {
  private token: string | null = null;
  private tokenExpiresAt: number | null = null;

  async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getValidToken();

    return { Authorization: `Bearer ${token}` };
  }

  private async getValidToken(): Promise<string> {
    if (this.token && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
      return this.token;
    }

    return this.authenticate();
  }

  private async authenticate(): Promise<string> {
    try {
      const form = new URLSearchParams();
      form.append('grant_type', 'client_credentials');
      form.append('client_id', process.env.SNK_CLIENT_ID!);
      form.append('client_secret', process.env.SNK_CLIENT_SECRET!);

      const response = await axios.post(
        `${process.env.SNK_HOST}/authenticate`,
        form.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Token': process.env.SNK_X_TOKEN!,
            Accept: 'application/json',
          },
        },
      );

      const data = response.data;

      if (!data?.access_token) {
        throw new Error('Token de acesso não retornado pela API Sankhya');
      }

      const expiresIn = data.expires_in ?? 3600;

      this.token = data.access_token;
      this.tokenExpiresAt = Date.now() + expiresIn * 1000;

      return this.token!;
    } catch (error: any) {
      console.error(
        'Erro ao autenticar Sankhya:',
        error?.response?.data || error.message,
      );

      throw new InternalServerErrorException(
        'Falha ao autenticar na API Sankhya',
      );
    }
  }
}
