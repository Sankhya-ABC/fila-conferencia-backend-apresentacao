import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { SincronizacaoService } from '../sincronizacao/sincronizacao.service';

@Injectable()
export class UsuarioService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
    private sincronizacaoService: SincronizacaoService,
  ) {}

  async getUsuarios(params: any) {
    const { nomeEmail, perfil, status, page = 0, perPage = 5 } = params;

    const where: any = {};

    if (nomeEmail) {
      where.OR = [
        { nome: { contains: nomeEmail, mode: 'insensitive' } },
        { email: { contains: nomeEmail, mode: 'insensitive' } },
      ];
    }

    if (perfil) {
      where.perfil = perfil;
    }

    if (status !== undefined && status !== null && status !== '') {
      where.ativo = status === 'true' || status === true;
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: Number(page) * Number(perPage),
        take: Number(perPage),
        orderBy: { nome: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    const treatedData = data.map((usuario) => {
      let foto: string | null = null;
      if (usuario.foto) {
        foto = Buffer.from(usuario.foto, 'hex').toString('base64');
      }
      return {
        codigo: usuario.codigo,
        nome: usuario.nome,
        email: usuario.email,
        foto: foto,
        perfil: usuario.perfil,
        ativo: usuario.ativo,
        criadoEm: usuario.createdAt,
        atualizadoEm: usuario.updatedAt,
      };
    });

    return {
      data: treatedData,
      total,
    };
  }

  async toogleStatus(codigo: number) {
    const user = await this.prisma.user.findUnique({
      where: { codigo },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    return this.prisma.user.update({
      where: { codigo },
      data: { ativo: !user.ativo },
    });
  }

  async redefinirAtivarLote(emails: string[]) {
    await this.sincronizacaoService.popularUsuarios();

    const existentes: string[] = [];
    const naoExistentes: string[] = [];

    await Promise.all(
      emails.map(async (email) => {
        const user = await this.prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          return naoExistentes.push(email);
        }

        existentes.push(email);

        await this.prisma.user.update({
          where: { codigo: user.codigo },
          data: { ativo: true },
        });

        await this.authService.esqueciMinhaSenha(email);
      }),
    );

    return {
      message: 'Processamento concluído',
      sucesso: existentes,
      erro: naoExistentes,
    };
  }
}
