import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/server/db/prisma";
import { getPlanilla, type Campo } from "@/lib/bpm/planillas";
import { ImprimirButton } from "./ImprimirButton";

const FILAS_EQUIPO = 8;

export default async function ImprimirPlanillaPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const planilla = getPlanilla(codigo);
  if (!planilla) notFound();

  const cookieStore = await cookies();
  const tenantId = cookieStore.get("tenant_activo")?.value;
  const tenant = tenantId
    ? await prisma.tenant.findFirst({
        where: { id: tenantId, estado: { not: "baja" } },
        select: { nombre: true },
      })
    : null;

  const tieneEquipo = planilla.campos.some((campo) => campo.tipo === "equipo");
  const columnasEquipo = planilla.campos.filter((campo) =>
    ["equipo", "limite", "temperatura", "cumple", "accion"].includes(campo.key)
  );
  const camposSueltos = tieneEquipo
    ? planilla.campos.filter((campo) => !columnasEquipo.some((columna) => columna.key === campo.key))
    : planilla.campos;

  return (
    <article className="bg-white text-[#0B1B33] max-w-3xl">
      <ImprimirButton />
      <header className="border-b border-[#0B1B33] pb-3 mb-4">
        <p className="font-mono text-xs tracking-wide">Núcleo 24H · {planilla.codigo}</p>
        <h1 className="text-xl font-bold mt-1">{planilla.nombre}</h1>
        <p className="text-sm mt-2">Local: {tenant?.nombre ?? "________________"}</p>
      </header>

      {camposSueltos.length > 0 && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
          {camposSueltos.map((campo) => (
            <CampoVacio key={campo.key} campo={campo} ancho={campo.tipo === "textarea" ? "col-span-2" : ""} />
          ))}
        </div>
      )}

      {tieneEquipo && (
        <table className="w-full border-collapse text-xs mb-6">
          <thead>
            <tr>
              {columnasEquipo.map((campo) => (
                <th key={campo.key} className="border border-[#0B1B33] px-2 py-1 text-left font-semibold">
                  {campo.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: FILAS_EQUIPO }, (_, fila) => (
              <tr key={fila}>
                {columnasEquipo.map((campo) => (
                  <td key={campo.key} className="border border-[#0B1B33] h-8" />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {planilla.items && planilla.items.length > 0 && (
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="border border-[#0B1B33] px-2 py-1 text-left font-semibold">Ítem</th>
              <th className="border border-[#0B1B33] px-2 py-1 w-16 font-semibold">Cumple</th>
              <th className="border border-[#0B1B33] px-2 py-1 w-20 font-semibold">No cumple</th>
              <th className="border border-[#0B1B33] px-2 py-1 font-semibold">Observación</th>
            </tr>
          </thead>
          <tbody>
            {planilla.items.map((item) => (
              <tr key={item}>
                <td className="border border-[#0B1B33] px-2 py-2">{item}</td>
                <td className="border border-[#0B1B33]" />
                <td className="border border-[#0B1B33]" />
                <td className="border border-[#0B1B33]" />
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </article>
  );
}

function CampoVacio({ campo, ancho }: { campo: Campo; ancho: string }) {
  const opciones = campo.tipo === "select" ? campo.opciones : null;
  return (
    <div className={ancho}>
      <p className="text-xs font-semibold mb-1">{campo.label}</p>
      {opciones ? (
        <p className="text-sm">
          {opciones.map((opcion) => `☐ ${opcion.label}`).join("    ")}
        </p>
      ) : (
        <div className={`border-b border-[#0B1B33] ${campo.tipo === "textarea" ? "h-16" : "h-7"}`} />
      )}
    </div>
  );
}
