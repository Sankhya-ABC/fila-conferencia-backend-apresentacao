import axios, { AxiosInstance } from 'axios';

export class HttpClient {
  protected client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.SNK_HOST,
      timeout: 5000,
    });
  }
}
