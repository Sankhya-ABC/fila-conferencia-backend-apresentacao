import { Inject, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import * as path from 'path';
import type { Logger } from 'pino';
import * as puppeteer from 'puppeteer';
import { SankhyaDBExplorerSPClient } from 'src/http-client/db-explorer-sp/db-explorer-sp.client';
import { NumeroConferenciaFilter } from '../dto/model';

@Injectable()
export class ArquivoService {
  constructor(
    private readonly dbExplorerClient: SankhyaDBExplorerSPClient,
    @Inject('LOGGER') private readonly logger: Logger,
  ) {}

  async downloadEtiqueta({
    numeroConferencia,
  }: NumeroConferenciaFilter): Promise<Buffer | null> {
    const sql = `
    SELECT 
    CAB.TIPMOV AS codigoTipoMovimento, 
    TPO.DESCROPER AS descricaoTipoOperacao 

    FROM TGFCAB CAB 

    LEFT JOIN TGFTOP TPO 
    ON TPO.CODTIPOPER = CAB.CODTIPOPER 
    AND TPO.DHALTER = CAB.DHTIPOPER 

    WHERE CAB.NUCONFATUAL = ${numeroConferencia} 
  `;
    const response = await this.dbExplorerClient.executeQuery(sql);

    const { codigoTipoMovimento, descricaoTipoOperacao } = response?.[0] || {};

    const isCubagemNaoDetalhada =
      codigoTipoMovimento === 'P' &&
      descricaoTipoOperacao === 'CUBAGEM DE PEDIDO';

    let rowsSql;
    if (isCubagemNaoDetalhada) {
      // não detalhado
      rowsSql = `
      SELECT
        CUB.SEQVOL AS seqVol,

        CAB.NUNOTA AS numeroUnico,
        CAB.NUMNOTA AS notaFiscal,
        CAB.UFADQUIRENTE AS uf,

        PAR.RAZAOSOCIAL AS cliente

      FROM AD_CUBAGEM CUB

      JOIN TGFCON2 CON
        ON CON.NUCONF = CUB.NUCONF

      JOIN TGFCAB CAB
        ON CAB.NUNOTA = CON.NUNOTAORIG

      JOIN TGFPAR PAR
        ON PAR.CODPARC = CAB.CODPARC

      WHERE CUB.NUCONF = ${numeroConferencia}
        AND CUB.ALTURA IS NOT NULL
        AND CUB.LARGURA IS NOT NULL
        AND CUB.COMPRIMENTO IS NOT NULL
        AND CUB.PESO IS NOT NULL

      ORDER BY CUB.SEQVOL ASC
      `;
    } else {
      // detalhado
      rowsSql = `
      SELECT DISTINCT
        IVC.SEQVOL AS seqVol,

        CAB.NUNOTA AS numeroUnico,
        CAB.NUMNOTA AS notaFiscal,
        CAB.UFADQUIRENTE AS uf,

        PAR.RAZAOSOCIAL AS cliente

      FROM TGFIVC IVC

      JOIN TGFCON2 CON
        ON CON.NUCONF = IVC.NUCONF

      JOIN TGFCAB CAB
        ON CAB.NUNOTA = CON.NUNOTAORIG

      JOIN TGFPAR PAR
        ON PAR.CODPARC = CAB.CODPARC

      WHERE IVC.NUCONF = ${numeroConferencia}
        AND IVC.QTD > 0

      ORDER BY IVC.SEQVOL ASC
    `;
    }

    const rows = await this.dbExplorerClient.executeQuery(rowsSql);

    if (!rows?.length) {
      return null;
    }

    const filePath = path.join(
      process.cwd(),
      'src/templates/template-etiqueta.html',
    );

    const html = fs.readFileSync(filePath, 'utf-8');

    const template = Handlebars.compile(html);

    const logoPath = path.join(process.cwd(), 'src/templates/modial-logo.png');

    const logoBase64 = `data:image/png;base64,${fs
      .readFileSync(logoPath)
      .toString('base64')}`;

    const totalVolumes = rows.length;
    const totalVol = String(totalVolumes).padStart(2, '0');

    const volumes = rows.map((row, index) => {
      let seqVol;
      if (isCubagemNaoDetalhada) {
        seqVol = String(index + 1).padStart(2, '0');
      } else {
        seqVol = String(row.seqVol).padStart(2, '0');
      }

      return {
        cliente: row.cliente,
        numeroUnico: row.numeroUnico,
        notaFiscal: String(row.notaFiscal),
        uf: row.uf ?? '',

        seqVol,
        totalVol,

        notaFiscalDigitos: String(row.notaFiscal).split(''),
        seqVolDigitos: seqVol.split(''),
        totalVolDigitos: totalVol.split(''),

        logoBase64,
      };
    });

    const finalHtml = template({ volumes });

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(finalHtml, {
      waitUntil: 'load',
    });

    const pdfUint8 = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    await browser.close();

    return Buffer.from(pdfUint8);
  }
}
