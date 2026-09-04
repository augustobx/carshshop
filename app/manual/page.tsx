import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, BookOpen, CheckCircle2, Lightbulb } from 'lucide-react';
import { getLoggedUser } from '@/lib/user-auth';
import { helpSections, helpTopics } from '@/lib/help-content';

export default async function ManualPage() {
  const user = await getLoggedUser();
  if (!user) redirect('/login');

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0"><BookOpen className="w-4 h-4" /></div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.18em] font-black text-blue-600">OnlyCars</p>
              <h1 className="text-base md:text-lg font-black truncate">Manual de usuario</h1>
            </div>
          </div>
          <Link href="/" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Volver al sistema</span>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 grid lg:grid-cols-[280px_minmax(0,1fr)] gap-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl bg-white border border-slate-200 p-4 shadow-sm max-h-[calc(100vh-7rem)] overflow-y-auto">
            <p className="text-[10px] uppercase tracking-[0.18em] font-black text-slate-400 px-2 mb-3">Índice</p>
            <div className="space-y-4">
              {helpSections.map((section) => (
                <div key={section}>
                  <p className="text-xs font-black text-slate-900 px-2 mb-1.5">{section}</p>
                  <div className="space-y-0.5">
                    {helpTopics.filter((topic) => topic.section === section).map((topic) => (
                      <a key={topic.key} href={`#${topic.key}`} className="block px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                        {topic.title}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <section className="rounded-2xl bg-slate-950 text-white p-6 md:p-8 mb-8 shadow-xl">
            <p className="text-xs uppercase tracking-[0.2em] font-black text-blue-400">Guía completa</p>
            <h2 className="text-2xl md:text-3xl font-black mt-2">Cómo usar OnlyCars</h2>
            <p className="text-slate-300 mt-3 max-w-3xl leading-7 text-sm md:text-base">
              Este manual explica para qué sirve cada módulo y el flujo recomendado para utilizarlo. En las pantallas del sistema también vas a encontrar el botón de ayuda <strong className="text-white">?</strong>, que abre directamente la explicación del módulo en el que estás trabajando.
            </p>
          </section>

          <div className="space-y-10">
            {helpSections.map((section) => (
              <section key={section}>
                <div className="mb-4">
                  <p className="text-xs uppercase tracking-[0.18em] font-black text-blue-600">{section}</p>
                </div>
                <div className="space-y-5">
                  {helpTopics.filter((topic) => topic.section === section).map((topic) => (
                    <article key={topic.key} id={topic.key} className="scroll-mt-24 rounded-2xl bg-white border border-slate-200 p-5 md:p-6 shadow-sm">
                      <div className="border-b border-slate-100 pb-4 mb-5">
                        <h3 className="text-xl font-black text-slate-900">{topic.title}</h3>
                        <p className="text-sm text-slate-600 leading-6 mt-2">{topic.summary}</p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-black text-slate-900 mb-3">¿Para qué sirve?</h4>
                          <div className="space-y-2.5">
                            {topic.purpose.map((item) => (
                              <div key={item} className="flex gap-2.5 text-sm text-slate-600">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-black text-slate-900 mb-3">¿Cómo se usa?</h4>
                          <ol className="space-y-3">
                            {topic.steps.map((step, index) => (
                              <li key={step} className="flex gap-3 text-sm text-slate-600">
                                <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center text-xs font-black shrink-0">{index + 1}</span>
                                <span className="pt-0.5">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>

                      {topic.tips?.length ? (
                        <div className="mt-6 rounded-xl bg-amber-50 border border-amber-100 p-4">
                          <div className="flex items-center gap-2 text-amber-800 font-black text-sm mb-2"><Lightbulb className="w-4 h-4" />Consejo</div>
                          <div className="space-y-1.5 text-sm text-amber-900/80">
                            {topic.tips.map((tip) => <p key={tip}>{tip}</p>)}
                          </div>
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
