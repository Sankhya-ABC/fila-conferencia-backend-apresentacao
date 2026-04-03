# Fila de Conferência — Backend

API REST desenvolvida com **NestJS** que serve como intermediária entre o frontend da Fila de Conferência e o ERP **Sankhya**, expondo dados de notas fiscais, parceiros, separações e etiquetas.

---

## 🛠️ Tecnologias

- **Node.js** + **NestJS 11**
- **TypeScript 5**
- **Fastify** (plataforma HTTP)
- **Axios** (comunicação com APIs Sankhya)
- **Puppeteer + Handlebars** (geração de etiquetas em PDF)
- **Pino** (logging estruturado)
- **Joi** (validação de variáveis de ambiente)

---

## 📋 Pré-requisitos

- Node.js 20+
- Acesso ao Sankhya (credenciais de API Gateway)

---

## ⚙️ Configuração

Copie o arquivo `.env.example` (se existir) ou crie um `.env` na raiz com as variáveis abaixo:

```env
NODE_ENV=dev           # dev | hml | prod
APP_PORT=3000

# Autenticação Sankhya
SNK_X_TOKEN=
SNK_CLIENT_ID=
SNK_CLIENT_SECRET=

# Endpoints Sankhya
SNK_HOST=              # URL base do Sankhya (ex: https://api.sankhya.com.br)
SNK_GATEWAY=           # URL do gateway de integração
```

---

## 🚀 Instalação e execução

```bash
npm install

# Desenvolvimento (hot-reload)
npm run start:dev

# Produção
npm run build
npm run start:prod
```

---

## 📦 Módulos

| Módulo | Responsabilidade |
|---|---|
| `auth` | Login via Sankhya e geração de sessão |
| `conferencia` | Listagem da fila de conferência com filtros |
| `separacao` | Dados de separação por número único (NUNOTA) |
| `parceiro` | Busca de parceiros no Sankhya |
| `empresa` | Listagem de empresas |
| `dominio` | Domínios e opções de campos (TDDOPC) |

## 🔐 Segurança

Todas as rotas (exceto as marcadas com `@NoAuthApp()`) são protegidas pelo guard `AuthAppGuard`, que valida o token de aplicação via header.

---

## 📄 Documentação da API

Com a aplicação rodando, acesse o Swagger em:

```
http://localhost:3000/api
```
