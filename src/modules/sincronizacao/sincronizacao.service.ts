import { BadRequestException, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from 'prisma/prisma.service';
import { SankhyaDBExplorerSPClient } from 'src/http-client/db-explorer-sp/db-explorer-sp.client';

@Injectable()
export class SincronizacaoService {
  constructor(
    private prisma: PrismaService,
    private readonly dbExplorerClient: SankhyaDBExplorerSPClient,
  ) {}

  @Cron('*/10 * * * *')
  async popularUsuarios() {
    try {
      console.log('INÍCIO: SINCRONIZAÇÃO - USUÁRIOS');

      let usuarios: any = await this.dbExplorerClient.executeQuery(`
      SELECT 
        USU.CODUSU AS codigo,
        USU.NOMEUSU AS nome,
        USU.EMAIL AS email,
        USU.FOTO AS foto,
        USU.CODGRUPO AS codGrupo,
        GRU.NOMEGRUPO AS nomeGrupo
      FROM TSIUSU USU
      LEFT JOIN TSIGRU GRU ON GRU.CODGRUPO = USU.CODGRUPO
      WHERE USU.EMAIL IS NOT NULL
      `);

      usuarios = usuarios.map((data) => ({
        codigo: data.codigo,
        nome: data.nome.trim() || '',
        email: data.email,
        foto: data.foto,
        perfil:
          data.nomeGrupo?.trim() === 'ADMINISTRADOR'
            ? 'ADMINISTRADOR'
            : 'SEPARADOR',
      }));

      await Promise.all(
        usuarios.map((usuario) =>
          this.prisma.user.upsert({
            where: { codigo: usuario.codigo },
            update: {
              nome: usuario.nome,
              email: usuario.email,
              foto: usuario.foto,
              perfil: usuario.perfil,
            },
            create: usuario,
          }),
        ),
      );

      console.log('FIM: SINCRONIZAÇÃO - USUÁRIOS');
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Erro ao sincronizar usuários');
    }
  }
}
