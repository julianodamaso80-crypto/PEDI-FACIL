# PedeFácil 🍕

Plataforma SaaS para restaurantes receberem pedidos diretos, sem depender do iFood.

## Sobre

PedeFácil cria automaticamente e-commerces completos para restaurantes. Cada restaurante ganha seu próprio subdomínio (ex: pizzariadojose.pedefacil.com.br) e pode receber pedidos com pagamento via Pix, cartão ou dinheiro.

**Modelo de negócio:** Sem mensalidade. Comissão de 7% por pedido.

## Stack Tecnológica

- **Frontend:** Next.js 14+ (App Router) + TypeScript
- **Estilização:** Tailwind CSS + shadcn/ui
- **Backend:** Next.js API Routes + Server Actions
- **Banco de dados:** PostgreSQL + Prisma ORM
- **Autenticação:** NextAuth.js (em desenvolvimento)
- **Pagamentos:** Mercado Pago (Pix + Cartão)
- **Notificações:** WhatsApp Business API
- **Filas:** BullMQ + Redis
- **Deploy:** Vercel (frontend) + Railway/Render (banco + Redis)

## Pré-requisitos

- Node.js 18+
- Docker e Docker Compose (para banco e Redis local)
- npm

## Como Rodar

### 1. Clone e instale dependências

```bash
git clone <repo-url>
cd pedefacil
npm install
```

### 2. Suba os serviços com Docker

```bash
docker-compose up -d
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações.

### 4. Rode as migrations e seed

```bash
npx prisma migrate dev
npx prisma db seed
```

### 5. Inicie o servidor

```bash
npm run dev
```

### 6. Acesse

- Landing/Admin: http://localhost:3000
- Loja de exemplo: http://pizzariadojose.localhost:3000
- Painel admin: http://localhost:3000/admin
- Super admin: http://localhost:3000/superadmin

## Estrutura do Projeto

```
src/
├── app/
│   ├── admin/          # Painel do restaurante
│   ├── api/            # API Routes
│   ├── store/[slug]/   # E-commerce do restaurante
│   └── superadmin/     # Painel do dono da plataforma
├── components/
│   ├── admin/          # Componentes do painel admin
│   ├── store/          # Componentes da loja
│   └── ui/             # shadcn/ui components
├── contexts/           # React contexts (cart, restaurant)
├── lib/                # Utilitários e serviços
├── types/              # TypeScript types
└── generated/          # Prisma generated client
```

## Funcionalidades

- [x] E-commerce completo por restaurante (subdomínio)
- [x] Cardápio com categorias, tamanhos e extras
- [x] Carrinho de compras persistente
- [x] Checkout com múltiplos métodos de pagamento
- [x] Tracking de pedidos em tempo real
- [x] Painel admin para gestão de pedidos
- [x] CRUD completo do cardápio
- [x] Dashboard com métricas de vendas
- [x] Gestão de clientes com segmentação
- [x] Campanhas de marketing (WhatsApp)
- [x] Programa de fidelidade
- [x] Integração Mercado Pago (Pix)
- [x] Notificações WhatsApp (mock mode)
- [x] Super admin para gestão da plataforma
- [x] Relatório de comissões

## Subdomínios

No desenvolvimento local, use o header Host para simular subdomínios:

```
http://pizzariadojose.localhost:3000
```

## Licença

Projeto privado.
