import { Injectable } from '@nestjs/common';

type SessionData = {
  token: string;
  nome: string;
};

@Injectable()
export class AuthUserService {
  private readonly HOURS = 0.125;
  private readonly TTL = 60 * 60 * this.HOURS;
  private sessions = new Map<string, SessionData>();

  async set(idUsuario: string, data: SessionData) {
    this.sessions.set(idUsuario, data);

    setTimeout(() => {
      this.sessions.delete(idUsuario);
    }, this.TTL * 1000);
  }

  async getByUser(idUsuario: string) {
    return this.sessions.get(idUsuario);
  }

  async getByToken(token: string) {
    for (const session of this.sessions.values()) {
      if (session.token === token) return session;
    }
    return null;
  }

  async delete(idUsuario: string) {
    this.sessions.delete(idUsuario);
  }
}
