import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header */}
      <header className="border-b border-orange-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-xl font-bold text-white">
              P
            </div>
            <span className="text-xl font-bold text-gray-900">PedeFacil</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Painel Admin
            </Link>
            <Link
              href="/superadmin"
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600"
            >
              Super Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="mb-4 inline-block rounded-full bg-orange-100 px-4 py-1.5 text-sm font-medium text-orange-700">
            Plataforma para Restaurantes
          </span>
          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight text-gray-900 sm:text-6xl">
            Receba pedidos diretos.{" "}
            <span className="text-orange-500">Sem depender do iFood.</span>
          </h1>
          <p className="mb-10 text-lg text-gray-600">
            Crie seu e-commerce completo em minutos. Seu restaurante ganha um site
            proprio com cardapio digital, pedidos online, pagamento via Pix e muito
            mais. Sem mensalidade &mdash; apenas 7% por pedido.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/superadmin/restaurants/new"
              className="rounded-xl bg-orange-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-600 hover:shadow-xl"
            >
              Criar Meu Restaurante
            </Link>
            <a
              href="http://pizzariadojose.localhost:3000"
              className="rounded-xl border-2 border-gray-200 px-8 py-4 text-lg font-semibold text-gray-700 transition hover:border-orange-300 hover:bg-orange-50"
            >
              Ver Demo
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-2xl">
              🍕
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Cardapio Digital
            </h3>
            <p className="text-gray-600">
              Cardapio completo com fotos, categorias, tamanhos e adicionais.
              Atualizado em tempo real.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl">
              💰
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Pix Instantaneo
            </h3>
            <p className="text-gray-600">
              Pagamento via Pix com QR Code automatico. Integracao com Mercado
              Pago. Receba na hora.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl">
              📱
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              WhatsApp Automatico
            </h3>
            <p className="text-gray-600">
              Notificacoes automaticas por WhatsApp para voce e seus clientes.
              Campanhas de marketing integradas.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-2xl">
              📊
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Dashboard Completo
            </h3>
            <p className="text-gray-600">
              Acompanhe vendas, pedidos, clientes e metricas em tempo real.
              Tudo em um painel intuitivo.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 text-2xl">
              ⭐
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Programa de Fidelidade
            </h3>
            <p className="text-gray-600">
              Fideleze seus clientes com pontos e recompensas. Aumente a
              recorrencia de pedidos.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-2xl">
              🎯
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Marketing Inteligente
            </h3>
            <p className="text-gray-600">
              Campanhas automaticas de reativacao, aniversario e promocoes.
              Recupere clientes inativos.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
          Como Funciona
        </h2>
        <div className="grid gap-8 md:grid-cols-4">
          {[
            { step: "1", title: "Cadastre-se", desc: "Crie sua conta em 2 minutos" },
            { step: "2", title: "Monte o Cardapio", desc: "Adicione seus itens com fotos e precos" },
            { step: "3", title: "Compartilhe", desc: "Divulgue seu link para os clientes" },
            { step: "4", title: "Receba Pedidos", desc: "Gerencie tudo pelo painel admin" },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-xl font-bold text-white">
                {item.step}
              </div>
              <h3 className="mb-1 text-lg font-semibold text-gray-900">{item.title}</h3>
              <p className="text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-3xl bg-gray-900 p-12 text-center text-white">
          <h2 className="mb-4 text-3xl font-bold">Sem mensalidade. Simples assim.</h2>
          <p className="mb-8 text-lg text-gray-400">
            Voce so paga quando vende. Comissao de apenas 7% por pedido processado.
          </p>
          <div className="mb-8 inline-block rounded-2xl bg-gray-800 px-12 py-8">
            <div className="text-5xl font-bold text-orange-400">7%</div>
            <div className="mt-2 text-gray-400">por pedido</div>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
            <span>&#10003; Sem taxa de adesao</span>
            <span>&#10003; Sem mensalidade</span>
            <span>&#10003; Sem fidelidade</span>
            <span>&#10003; Cancele quando quiser</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-gray-500">
          <p>&copy; 2024 PedeFacil. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
