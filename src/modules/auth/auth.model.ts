export enum Perfil {
  ADMINISTRADOR,
  SEPARADOR,
}

export interface SessionData {
  token: string;
  nome: string;
  idUsuario: number;
  perfil: Perfil;
}
