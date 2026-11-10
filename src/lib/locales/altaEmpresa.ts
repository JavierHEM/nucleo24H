import { claveRut } from "@/lib/empresas";
import { emailOpcional, textoOpcional } from "@/lib/locales/ficha";
import { normalizarPlan, type PlanId, type TipoLocal } from "@/lib/planes";
import type { AltaEmpresaInput, AltaSucursalInput, EmpresaFichaInput } from "@/lib/locales/ficha";

export function domicilioLegalEmpresa(
  ficha: Pick<EmpresaFichaInput, "domicilio_legal">,
  direccionLocal: string
) {
  return textoOpcional(ficha.domicilio_legal) || direccionLocal.trim();
}

export function construirAltaEmpresa(input: AltaEmpresaInput) {
  const rut = claveRut(input.empresa.rut);
  const plan = normalizarPlan(input.plan);
  const direccion = input.local.direccion.trim();

  return {
    empresa: {
      razon_social: input.empresa.razon_social.trim(),
      rut,
      giro: textoOpcional(input.empresa.giro),
      domicilio_legal: domicilioLegalEmpresa(input.empresa, direccion),
      telefono: input.empresa.telefono.trim(),
      email: emailOpcional(input.empresa.email),
      representante_legal_nombre: input.empresa.representante_legal_nombre.trim(),
      representante_legal_rut: claveRut(input.empresa.representante_legal_rut),
      representante_legal_telefono: textoOpcional(input.empresa.representante_legal_telefono),
      notas_internas: textoOpcional(input.empresa.notas_internas),
    },
    tenant: {
      nombre: input.local.nombre.trim(),
      rut,
      direccion,
      ciudad: input.local.ciudad.trim(),
      telefono: input.local.telefono.trim(),
      encargado_nombre: textoOpcional(input.local.encargado_nombre),
      encargado_telefono: textoOpcional(input.local.encargado_telefono),
      resolucion_sanitaria_presentada: input.local.resolucion_sanitaria_presentada,
      patente_comercial_al_dia: input.local.patente_comercial_al_dia,
      plan,
      tipo_local: input.local.tipo_local as TipoLocal,
      estado: "pendiente" as const,
    },
    plan: plan as PlanId,
    emailAdmin: emailOpcional(input.email_admin),
  };
}

export function construirAltaSucursal(
  empresa: { id: string; rut: string },
  input: Omit<AltaSucursalInput, "casa_central_id">
) {
  const plan = normalizarPlan(input.plan);
  return {
    tenant: {
      empresa_id: empresa.id,
      nombre: input.nombre.trim(),
      rut: empresa.rut,
      direccion: input.direccion.trim(),
      ciudad: input.ciudad.trim(),
      telefono: input.telefono.trim(),
      encargado_nombre: textoOpcional(input.encargado_nombre),
      encargado_telefono: textoOpcional(input.encargado_telefono),
      resolucion_sanitaria_presentada: input.resolucion_sanitaria_presentada,
      patente_comercial_al_dia: input.patente_comercial_al_dia,
      plan,
      tipo_local: input.tipo_local as TipoLocal,
      estado: "pendiente" as const,
    },
    plan: plan as PlanId,
    emailAdmin: emailOpcional(input.email_admin),
  };
}

export function rutsASincronizar(rutNuevo: string, tenantIds: readonly string[]) {
  const rut = claveRut(rutNuevo);
  return tenantIds.map((id) => ({ id, rut }));
}
