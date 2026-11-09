# Node Auth API

API REST de autenticação construída com Node.js e Clean Architecture, com suporte a registro, login e rotas protegidas via JWT e controle de acesso baseado em permissões (RBAC).

[![CI](https://github.com/andersonkaiti/node-auth-api/actions/workflows/ci.yml/badge.svg)](https://github.com/andersonkaiti/node-auth-api/actions/workflows/ci.yml)
![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/license-ISC-blue)

## Stack

| Categoria             | Tecnologia              | Versão |
|-----------------------|-------------------------|--------|
| Runtime               | Node.js                 | 22     |
| Linguagem             | TypeScript              | 6      |
| Framework HTTP        | Express                 | 5      |
| ORM                   | Prisma                  | 7      |
| Banco de dados        | PostgreSQL              | 16     |
| Autenticação          | jsonwebtoken + bcryptjs | 9 / 3  |
| Validação             | Zod                     | 4      |
| Testes                | Vitest + Supertest      | 4 / 7  |
| Formatação / Lint     | Biome                   | 2      |
| Gerenciador de pacotes| pnpm                    | latest |
| CI/CD                 | GitHub Actions          | —      |

## Arquitetura

O projeto segue os princípios da **Clean Architecture**, onde as dependências sempre apontam de fora para dentro — a camada de domínio não conhece nenhuma outra.

```mermaid
flowchart TB
  subgraph factories["🏭 Factories (DI)"]
  end

  subgraph infra["🔌 Infra"]
    direction LR
    express["Express"]
    controllers["Controllers"]
    middlewares["Middlewares"]
    prisma["Prisma / PostgreSQL"]
  end

  subgraph app["⚙️ Application"]
    direction LR
    usecases["Use Cases"]
    errors["Errors"]
  end

  subgraph domain["🧠 Domain"]
    direction LR
    entities["Entities"]
    repositories["Repository Interfaces"]
  end

  factories --> infra
  factories --> app
  infra --> app
  app --> domain
```

## Fluxo de Requisição

### Rota autenticada (`GET /leads`)

```mermaid
sequenceDiagram
  participant C as Client
  participant MW as AuthMiddleware
  participant CT as Controller
  participant UC as UseCase
  participant R as Repository
  participant DB as PostgreSQL

  C->>MW: GET /leads<br/>Authorization: Bearer {token}
  MW->>MW: jwt.verify(token) + zod.parse(payload)
  MW->>CT: next() + req.metadata.account { accountId, role }
  CT->>UC: execute(accountId)
  UC->>R: findAll()
  R->>DB: SELECT * FROM accounts
  DB-->>R: rows
  R-->>UC: Account[]
  UC-->>CT: Account[]
  CT-->>C: 200 OK { data }
```

### Rota com autorização por permissão (`POST /leads`)

```mermaid
sequenceDiagram
  participant C as Client
  participant AMW as AuthMiddleware
  participant AZW as AuthorizationMiddleware
  participant UC as GetRolePermissionsUseCase
  participant DB as PostgreSQL
  participant H as Handler

  C->>AMW: POST /leads<br/>Authorization: Bearer {token}
  AMW->>AMW: jwt.verify(token) + zod.parse(payload)
  AMW->>AZW: next() + req.metadata.account { accountId, role: roleId }
  AZW->>UC: execute({ roleId })
  UC->>DB: SELECT permission_code FROM roles_permissions WHERE role_id = ?
  DB-->>UC: permission rows
  UC-->>AZW: { permissionCodes: string[] }
  alt permissionCodes.includes('leads:write')
    AZW->>H: next()
    H-->>C: 201 Created
  else permission denied
    AZW-->>C: 403 Access denied
  end
```

## Modelo de Dados

```mermaid
erDiagram
  accounts {
    UUID   id          PK
    String name
    String email       UK
    String password
    UUID   role_id     FK
  }

  roles {
    UUID   id    PK
    String name
  }

  permissions {
    UUID   id    PK
    String name
    String code  UK
  }

  roles_permissions {
    UUID   role_id         FK
    String permission_code FK
  }

  accounts }o--|| roles : "has"
  roles ||--o{ roles_permissions : "has"
  permissions ||--o{ roles_permissions : "has"
```

## Endpoints

| Método | Rota       | Auth          | Permissão      | Descrição                              |
|--------|------------|---------------|----------------|----------------------------------------|
| POST   | `/sign-up` | —             | —              | Cria uma nova conta                    |
| POST   | `/sign-in` | —             | —              | Autentica e retorna um JWT             |
| GET    | `/leads`   | Bearer token  | `leads:read`   | Lista contas (rota autenticada)        |
| POST   | `/leads`   | Bearer token  | `leads:write`  | Cria um lead (rota restrita)           |

## RBAC (Role-Based Access Control)

A autorização é gerenciada por **permissões granulares** vinculadas a roles via tabela pivô:

- **Roles** definem grupos de acesso (ex.: `ADMIN`, `USER`)
- **Permissions** definem ações específicas com códigos únicos (ex.: `leads:read`, `leads:write`)
- **roles_permissions** vincula quais permissões cada role possui
- O JWT carrega o `roleId`, e o middleware de autorização consulta as permissões da role em tempo de requisição

## Como executar

### Pré-requisitos

- Node.js 22+
- pnpm
- PostgreSQL 16+

### Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/database
JWT_SECRET=sua-chave-secreta
PORT=3000
```

### Instalação

```bash
pnpm install
```

### Banco de dados

```bash
pnpm db:generate   # gera o client Prisma
pnpm db:migrate    # executa as migrations
```

### Desenvolvimento

```bash
pnpm dev
```

### Testes

```bash
pnpm test          # modo watch
pnpm coverage      # com relatório de cobertura
```

### Testes de segurança

Os testes de segurança ficam em `tests/security/` e rodam junto com o restante da suíte. Para rodar só essa pasta:

```bash
pnpm exec vitest run tests/security
```

| Cenário | O que é verificado | Arquivo |
|---------|--------------------|---------|
| Sem token | `GET /leads` sem `Authorization` retorna 401 | `authentication.test.ts` |
| Token adulterado | Trocar o `role` no payload mantendo a assinatura antiga retorna 401 | `authentication.test.ts` |
| `alg: none` | Token sem assinatura (variações de caixa) retorna 401 | `authentication.test.ts` |
| Token expirado | `exp` no passado retorna 401 | `authentication.test.ts` |
| Refresh token | Reutilizar um refresh token já rotacionado retorna 401 | `authentication.test.ts` |
| RBAC | USER (sem `leads:write`) não cria lead: 403 | `authorization.test.ts` |
| Mass assignment | `roleId`/`role` enviados no `/sign-up` são ignorados (conta sempre USER) | `authorization.test.ts` |
| SQL Injection | `' OR '1'='1' --` na senha não autentica; payload SQL no nome de um lead é gravado como texto | `sql-injection.test.ts` |
| Enumeração de usuários | `/sign-in` com e-mail inexistente e com senha errada devolve status e corpo idênticos | `user-enumeration.test.ts` |
| Exposição de dados | A resposta de erro do `/sign-up` não contém senha nem hash bcrypt (`$2a$`/`$2b$`) | `data-exposure.test.ts` |
| Validação de entrada | Tipos errados, texto gigante e nome de lead vazio retornam 400; JSON malformado retorna 400 e body acima de 100kb retorna 413 | `input-validation.test.ts` |
| Força bruta | Após 5 falhas de login por IP e e-mail, o `/sign-in` retorna 429, inclusive com a senha correta | `brute-force.test.ts` |

XSS não é testado, pois a API só devolve JSON (`Content-Type: application/json`) e não renderiza HTML.
