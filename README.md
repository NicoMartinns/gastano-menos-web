# Gastano Menos Web

Interface React/Vite do ambiente financeiro compartilhado. Contas liberadas
acessam as mesmas transações e categorias. Administradores encontram **Usuários**
no menu e em `/admin/users`, com cadastro, edição de perfil e liberação/bloqueio.
As permissões são verificadas pelo backend; o login consulta `/auth/me`.

## Executar localmente

```sh
npm ci
npm run dev
```

A API precisa incluir a migration `000006_add_user_access` e ter um administrador
criado pelo comando `cmd/create-admin` do backend. Consulte
`gastano_menos/docs/administracao.md` no workspace para o procedimento completo.
Esta interface não cria automaticamente o primeiro administrador.

A URL padrão é `/api`. Em produção, o Nginx encaminha `/api/*` para
`http://app:8080/*`, removendo o prefixo. O frontend não incorpora o IP público.
Use o Compose integrado em `../gastano_menos/docker-compose.yml`: o serviço
`app` precisa estar na mesma rede do Nginx. O perfil `web-prod` deste repositório,
isoladamente, não fornece o backend nem sua rede.

Com `npm run dev`, o Vite encaminha `/api` para `http://localhost:8080`.
Para outro backend de desenvolvimento, use `API_PROXY_TARGET=http://host:8080
npm run dev` (variável do processo Node, sem exposição ao navegador).
O Compose de desenvolvimento usa `VITE_API_URL=http://localhost:8080` para
acesso direto pelo navegador ao backend publicado no host; esse modo requer CORS.

`VITE_API_URL` continua disponível como sobrescrita antes do build/dev para
clientes externos. No Docker, use `--build-arg VITE_API_URL=...` somente quando
quiser sobrescrever `/api`. Essa variável é pública; não inclua credenciais.

Consulte [operação, validação e rollback](../gastano_menos/docs/proxy-reverso.md).

## Verificações

```sh
npm run build
npm run lint
```

O frontend trata 401 centralmente, limpa a sessão e verifica perfil antes de
abrir a administração. O backend bloqueia as requisições imediatamente quando
o acesso é revogado. A interface também consulta a sessão ao ganhar foco e a
cada minuto. Erros 403 não são tratados como senha inválida.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
