import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, {
  AxiosHeaders,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import { AuthAppService } from 'src/auth-app/auth-app.service';

@Injectable()
export class GatewayClient {
  public readonly client: AxiosInstance;

  constructor(
    config: ConfigService,
    private authAppService: AuthAppService,
  ) {
    this.client = axios.create({
      baseURL: `${config.getOrThrow('SNK_HOST')}/${config.getOrThrow('SNK_GATEWAY')}`,
      timeout: 10000,
    });

    this.client.interceptors.request.use(
      async (req: InternalAxiosRequestConfig) => {
        const token = await this.authAppService.getValidToken();

        if (!req.headers) {
          req.headers = new AxiosHeaders();
        } else if (!(req.headers instanceof AxiosHeaders)) {
          req.headers = new AxiosHeaders(req.headers);
        }

        req.headers.set('Authorization', `Bearer ${token}`);
        req.headers.set('Content-Type', 'application/json');

        return req;
      },
    );
  }
}
