# Queen of Beauty

Catálogo interativo de tranças com personalização guiada, contato direto pelo
WhatsApp e painel administrativo.

## O que está pronto

- catálogo responsivo com categorias;
- fluxo de seleção de serviços sem carrinho;
- adicionais por grupo (escolha única ou múltipla);
- cálculo do valor estimado;
- mensagem formatada para o WhatsApp `55 31 97153-6509`;
- painel em `/admin`;
- cadastro, edição, publicação, ocultação e exclusão de serviços;
- cadastro e edição de adicionais;
- upload de imagens;
- persistência em D1 e arquivos em R2.

## Executar localmente

Requisitos: Node.js 22.13 ou superior.

```bash
npm install
npm run dev
```

O site abre na rota `/` e o painel na rota `/admin`.

## Configuração

O ambiente hospedado precisa das seguintes vinculações:

- `DB`: banco D1;
- `BUCKET`: armazenamento R2;
- `ADMIN_KEY`: senha secreta do painel.

As vinculações D1 e R2 já estão declaradas em `.openai/hosting.json`. Nunca
grave a senha real no repositório.

Para desenvolvimento local, crie `.env` a partir de `.env.example` e use uma
senha própria. O arquivo `.env` não deve ser versionado.

## Banco

O schema fica em `db/schema.ts`. Para gerar uma nova migração:

```bash
npm run db:generate
```

As migrações geradas ficam em `drizzle/`.

## Estrutura principal

- `app/storefront.tsx`: catálogo e fluxo de personalização do serviço;
- `app/admin/`: painel da proprietária;
- `app/api/catalog/`: leitura pública e dados iniciais;
- `app/api/admin/`: operações administrativas;
- `app/api/upload/`: envio e leitura das imagens;
- `app/globals.css`: identidade visual e responsividade.

## Segurança

O painel envia a senha somente no cabeçalho das requisições e a mantém em
`sessionStorage`, sendo apagada ao fechar a aba. As operações administrativas
são validadas no servidor. Troque a `ADMIN_KEY` se houver qualquer suspeita de
exposição.
