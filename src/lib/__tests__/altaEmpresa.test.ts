import { describe, expect, it } from "vitest";
import { construirAltaEmpresa, construirAltaSucursal, rutsASincronizar } from "@/lib/locales/altaEmpresa";
import { altaEmpresaSchema, altaSucursalSchema } from "@/lib/locales/ficha";

const empresaBase = {
  razon_social: "Alimentos del Sur SpA",
  rut: "76.111.111-1",
  giro: "Restaurantes",
  domicilio_legal: "",
  telefono: "+56 9 1111 1111",
  email: "",
  representante_legal_nombre: "Ana Pérez",
  representante_legal_rut: "11.111.111-1",
  representante_legal_telefono: "",
  notas_internas: "Cliente Osorno",
};

const localBase = {
  nombre: "Cocinería Plaza",
  direccion: "Freire 100",
  ciudad: "Osorno",
  telefono: "+56 9 2222 2222",
  tipo_local: "cocineria" as const,
  encargado_nombre: "",
  encargado_telefono: "",
};

describe("alta de empresa", () => {
  it("crea casa matriz pendiente con RUT normalizado y domicilio copiado", () => {
    const parsed = altaEmpresaSchema.parse({
      empresa: empresaBase,
      local: localBase,
      plan: "calidad",
      email_admin: "",
    });
    const alta = construirAltaEmpresa(parsed);

    expect(alta.empresa.rut).toBe("76111111-1");
    expect(alta.empresa.domicilio_legal).toBe("Freire 100");
    expect(alta.tenant.estado).toBe("pendiente");
    expect(alta.tenant.rut).toBe(alta.empresa.rut);
    expect(alta.emailAdmin).toBeUndefined();
  });

  it("guarda el email del dueño solo si viene", () => {
    const parsed = altaEmpresaSchema.parse({
      empresa: { ...empresaBase, email: "contacto@local.cl" },
      local: localBase,
      plan: "integral",
      email_admin: "  Dueno@local.cl ",
    });
    const alta = construirAltaEmpresa(parsed);
    expect(alta.emailAdmin).toBe("dueno@local.cl");
    expect(alta.plan).toBe("integral");
    expect(alta.empresa.email).toBe("contacto@local.cl");
  });
});

describe("alta de sucursal", () => {
  it("copia empresa_id y RUT y nace pendiente", () => {
    const parsed = altaSucursalSchema.parse({
      casa_central_id: "550e8400-e29b-41d4-a716-446655440000",
      ...localBase,
      nombre: "Sucursal Puerto Montt",
      plan: "calidad",
      email_admin: "",
    });
    const alta = construirAltaSucursal({ id: "emp-1", rut: "76111111-1" }, parsed);

    expect(alta.tenant.empresa_id).toBe("emp-1");
    expect(alta.tenant.rut).toBe("76111111-1");
    expect(alta.tenant.estado).toBe("pendiente");
    expect(alta.emailAdmin).toBeUndefined();
  });
});

describe("sync de RUT", () => {
  it("normaliza el RUT de todos los locales de la empresa", () => {
    expect(rutsASincronizar("76.111.111-1", ["a", "b"])).toEqual([
      { id: "a", rut: "76111111-1" },
      { id: "b", rut: "76111111-1" },
    ]);
  });
});
