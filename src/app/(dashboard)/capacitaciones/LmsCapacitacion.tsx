"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";

type Pregunta = { enunciado: string; alternativas: string[]; correcta: number };

export function LmsCapacitacion() {
  const router = useRouter();
  const contenidos = trpc.capacitacionesLms.contenidos.useQuery();
  const historial = trpc.capacitacionesLms.historial.useQuery();
  const evaluar = trpc.capacitacionesLms.evaluar.useMutation({
    onSuccess: () => {
      void historial.refetch();
      router.refresh();
    },
  });
  const [respuestas, setRespuestas] = useState<Record<string, number[]>>({});

  const lista = contenidos.data ?? [];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-[#0B1B33]">Capacitación autogestionada</h2>
        <p className="text-sm text-[#5B6980]">
          Contenido validado por Núcleo 24H. La constancia es interna y no constituye certificación oficial.
        </p>
      </div>
      {lista.map((c) => {
        const preguntas = Array.isArray(c.preguntas) ? (c.preguntas as Pregunta[]) : [];
        const actuales = respuestas[c.id] ?? preguntas.map(() => -1);
        return (
          <div key={c.id} className="bg-white rounded-xl border border-[#DDE3EA] p-4 space-y-3">
            <p className="font-semibold">{c.titulo}</p>
            <p className="text-sm text-[#5B6980]">{c.descripcion}</p>
            <a href={c.url_recurso} target="_blank" rel="noopener noreferrer" className="text-sm text-[#2F6B2A] underline">
              Ver material
            </a>
            {preguntas.map((pregunta, i) => (
              <fieldset key={`${c.id}-${i}`} className="text-sm">
                <legend className="font-medium mb-1">{pregunta.enunciado}</legend>
                {pregunta.alternativas.map((alt, j) => (
                  <label key={alt} className="flex items-center gap-2 min-h-10">
                    <input
                      type="radio"
                      name={`${c.id}-${i}`}
                      checked={actuales[i] === j}
                      onChange={() => {
                        const next = [...actuales];
                        next[i] = j;
                        setRespuestas((prev) => ({ ...prev, [c.id]: next }));
                      }}
                    />
                    {alt}
                  </label>
                ))}
              </fieldset>
            ))}
            <button
              type="button"
              disabled={evaluar.isPending || actuales.some((n) => n < 0)}
              onClick={() => evaluar.mutate({ contenido_id: c.id, respuestas: actuales })}
              className="min-h-12 px-4 rounded-lg bg-[#2F6B2A] text-white text-sm disabled:opacity-60"
            >
              Enviar evaluación
            </button>
            {evaluar.data && evaluar.variables?.contenido_id === c.id && (
              <p className="text-sm">
                Puntaje {evaluar.data.puntaje}. {evaluar.data.aprobado ? "Aprobada. Constancia interna registrada." : "No alcanzó el 70%."}
              </p>
            )}
          </div>
        );
      })}
      {(historial.data ?? []).length > 0 && (
        <div className="text-xs text-[#5B6980] space-y-1">
          <p className="font-semibold text-[#0B1B33]">Historial</p>
          {historial.data?.map((h) => (
            <p key={h.id}>
              {h.contenido.titulo} · {h.puntaje}% · {h.aprobado ? "Aprobado" : "Reprobado"}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
