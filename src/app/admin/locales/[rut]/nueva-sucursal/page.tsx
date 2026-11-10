import { notFound } from "next/navigation";
import { getCaller } from "@/lib/trpc/server";
import { NuevaSucursalForm } from "../../NuevaSucursalForm";

export default async function NuevaSucursalPage({
  params,
}: {
  params: Promise<{ rut: string }>;
}) {
  const { rut } = await params;
  const caller = await getCaller();
  const ficha = await caller.empresas.porRut({ rut }).catch(() => null);
  if (!ficha || ficha.locales.length === 0) notFound();

  const casa = ficha.locales[0];

  return (
    <NuevaSucursalForm
      casaCentralId={casa.id}
      rut={ficha.empresa.rut}
      razonSocial={ficha.empresa.razon_social}
      representante={ficha.empresa.representante_legal_nombre}
      planActual={casa.plan}
      tipoLocalActual={casa.tipo_local}
      ciudadActual={casa.ciudad}
    />
  );
}
