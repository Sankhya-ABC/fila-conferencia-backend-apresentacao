import * as nodemailer from 'nodemailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: this.config.get<string>('APP_EMAIL'),
        pass: this.config.get<string>('APP_EMAIL_PASSWORD'),
      },
    });
  }

  async enviarEmailRecuperacao(email: string, link: string) {
    await this.transporter.sendMail({
      from: `"Fila de Conferência" <${this.config.get<string>('APP_EMAIL')}>`,
      to: email,
      subject: 'Recuperação de Senha',
      html: `
        <div style="font-family: Arial;">
          <p>Você ou seu administrador solicitou a redefinição de senha.</p>
          <p>Clique no link abaixo para redefinir:</p>
          <a href="${link}">${link}</a>
          <p>Se não foi você, ignore este email.</p>
        </div>
      `,
    });
  }
}
