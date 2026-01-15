import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class HttpClient {
  protected readonly client: AxiosInstance;

  constructor(config: ConfigService) {
    this.client = axios.create({
      baseURL: config.getOrThrow('SNK_GATEWAY'),
      timeout: 10000,
    });
  }
}
