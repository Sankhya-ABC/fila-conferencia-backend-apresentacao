import { SetMetadata } from '@nestjs/common';

export const NO_AUTH_APP_KEY = 'noAuthApp';
export const NoAuthApp = () => SetMetadata(NO_AUTH_APP_KEY, true);
