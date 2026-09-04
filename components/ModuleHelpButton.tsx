'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CircleHelp, X, BookOpen, Lightbulb, CheckCircle2 } from 'lucide-react';
import { resolveHelpTopic } from '@/lib/help-content';

export default function ModuleHelpButton({ variant = 'topbar' }: { variant?: 'topbar' | 'floating' }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const topic = resolveHelpTopic(pathname || '/');

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`Ayuda: ${topic.title}`}
        aria-label={`Ayuda del módulo ${topic.title}`}
        className={variant === 'floating'
          ? 'absolute top-4 right-4 z-40 w-10 h-10 rounded-full bg-white/95 text-slate-700 border border-slate-200 shadow-lg flex items-center justify-center hover:bg-white'
          : 'p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700'}
      >
        <CircleHelp className={variant === 'floating' ? 'w-5 h-5' : 'w-4 h-4'} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[120] bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="module-help-title"
            className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-200 px-5 py-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] font-black text-blue-600">Ayuda del módulo</p>
                <h2 id="module-help-title" className="text-xl font-black text-slate-900 mt-1">{topic.title}</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Cerrar ayuda">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              <p className="text-sm leading-6 text-slate-600">{topic.summary}</p>

              <section>
                <h3 className="text-sm font-black text-slate-900 mb-3">¿Para qué sirve?</h3>
                <div className="space-y-2">
                  {topic.purpose.map((item) => (
                    <div key={item} className="flex gap-2.5 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-black text-slate-900 mb-3">¿Cómo se usa?</h3>
                <ol className="space-y-3">
                  {topic.steps.map((step, index) => (
                    <li key={step} className="flex gap-3 text-sm text-slate-600">
                      <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center text-xs font-black shrink-0">{index + 1}</span>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </section>

              {topic.tips?.length ? (
                <section className="rounded-xl bg-amber-50 border border-amber-100 p-4">
                  <div className="flex items-center gap-2 text-amber-800 font-black text-sm mb-2"><Lightbulb className="w-4 h-4" />Consejo</div>
                  <div className="space-y-1.5 text-sm text-amber-900/80">
                    {topic.tips.map((tip) => <p key={tip}>{tip}</p>)}
                  </div>
                </section>
              ) : null}

              <Link
                href={`/manual#${topic.key}`}
                onClick={() => setOpen(false)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-3 text-sm font-black hover:bg-slate-800"
              >
                <BookOpen className="w-4 h-4" />
                Ver manual completo
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
