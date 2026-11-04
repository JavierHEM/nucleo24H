"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Dialogo } from "@/components/ui/Dialogo";
import { ArchivosAdjuntos, type ArchivoSubido } from "@/components/ui/ArchivosAdjuntos";
import { CasillaDeclaracion } from "@/components/declaraciones/CasillaDeclaracion";

const CAMPO = "w-full min-h-12 rounded-xl border border-[#DDE3EA] px-3";

export function CrearProveedorButton() {
  const [abierto, setAbierto] = useState(false);
  const [razon, setRazon] = useState("");
  const [rut, setRut] = useState("");
  const [contacto, setContacto] = useState("");
  const [servicio, setServicio] = useState("Control de plagas");
  const [entidad, setEntidad] = useState("");
  const [numero, setNumero] = useState("");
  const [vigencia, setVigencia] = useState("");
  const [alcance, setAlcance] = useState("");
  const [archivos, setArchivos] = useState<ArchivoSubido[]>([]);
  const [aceptaB, setAceptaB] = useState(false);
  const router = useRouter();
  const crear = trpc.proveedores.crear.useMutation({
    onSuccess: (proveedor) => {
      setAbierto(false);
      reset();
      router.push(`/proveedores/${proveedor.id}`);
      router.refresh();
    },
  });

  function reset() {
    setRazon("");
    setRut("");
    setContacto("");
    setServicio("Control de plagas");
    setEntidad("");
    setNumero("");
    setVigencia("");
    setAlcance("");
    setArchivos([]);
    setAceptaB(false);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (archivos.length > 0 && !aceptaB) return;
    crear.mutate({
      razon_social: razon,
      rut,
      contacto: contacto.trim() || undefined,
      tipo_servicio: servicio,
      autorizacion_entidad: entidad || undefined,
      autorizacion_numero: numero || undefined,
      vigencia: vigencia ? new Date(`${vigencia}T12:00:00`).toISOString() : undefined,
      alcance: alcance.trim() || undefined,
      documentos: archivos.length > 0 ? archivos.map((archivo) => archivo.ruta) : undefined,
      acepta_declaracion_b: archivos.length > 0 ? true : undefined,
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="min-h-12 px-4 rounded-lg bg-[#2F6B2A] text-white text-sm font-medium"
      >
        Registrar proveedor
      </button>
      <Dialogo abierto={abierto} titulo="Nuevo proveedor" onCerrar={() => setAbierto(false)} ancho="lg">
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input required minLength={2} value={razon} onChange={(e) => setRazon(e.target.value)} placeholder="Razón social" className={CAMPO} />
            <input required minLength={3} value={rut} onChange={(e) => setRut(e.target.value)} placeholder="RUT" className={CAMPO} />
            <input value={contacto} onChange={(e) => setContacto(e.target.value)} placeholder="Contacto (opcional)" className={CAMPO} />
            <input required value={servicio} onChange={(e) => setServicio(e.target.value)} placeholder="Tipo de servicio" className={CAMPO} />
            <input value={entidad} onChange={(e) => setEntidad(e.target.value)} placeholder="Entidad que autoriza" className={CAMPO} />
            <input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="N° de autorización" className={CAMPO} />
            <input type="date" value={vigencia} onChange={(e) => setVigencia(e.target.value)} className={CAMPO} aria-label="Vigencia" />
            <input value={alcance} onChange={(e) => setAlcance(e.target.value)} placeholder="Alcance autorizado (opcional)" className={CAMPO} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-[#0B1B33]">Autorización o informe</p>
            <ArchivosAdjuntos
              bucket="documentos"
              valor={archivos}
              onCambio={setArchivos}
              maximo={8}
              etiqueta="Adjuntar PDF o imagen"
            />
          </div>
          {archivos.length > 0 && <CasillaDeclaracion tipo="B" checked={aceptaB} onChange={setAceptaB} />}
          {crear.error && <p className="text-sm text-[#B42318]">{crear.error.message}</p>}
          <button
            type="submit"
            disabled={crear.isPending || (archivos.length > 0 && !aceptaB)}
            className="w-full min-h-12 rounded-lg bg-[#2F6B2A] text-white disabled:opacity-50"
          >
            {crear.isPending ? "Guardando..." : "Guardar"}
          </button>
        </form>
      </Dialogo>
    </>
  );
}
