"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconUserPlus, IconX, IconLoader2, IconCircleCheck } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InvitarMiembroButton() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState<"trabajador_local" | "admin_local">("trabajador_local");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: true; msg: string } | { ok: false; msg: string } | null>(null);
  const router = useRouter();

  function handleClose() {
    setOpen(false);
    setEmail("");
    setNombre("");
    setRol("trabajador_local");
    setResult(null);
  }

  async function handleSubmit() {
    if (!email || loading) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/local/invitar-trabajador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nombre: nombre || undefined, rol }),
      });
      const data: { message?: string; error?: unknown } = await res.json();

      if (!res.ok) {
        const errMsg =
          typeof data.error === "string"
            ? data.error
            : typeof data.error === "object" && data.error !== null
              ? JSON.stringify(data.error)
              : "Error desconocido";
        setResult({ ok: false, msg: errMsg });
      } else {
        setResult({ ok: true, msg: data.message ?? "Invitación enviada." });
        router.refresh();
      }
    } catch {
      setResult({ ok: false, msg: "Error de red. Intenta de nuevo." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-[#3D7A35] hover:bg-[#2D5A27] text-white gap-2"
        size="sm"
      >
        <IconUserPlus size={16} />
        Invitar miembro
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <IconUserPlus size={18} className="text-[#3D7A35]" />
                <p className="font-semibold text-[#0D1F3C] text-sm">Invitar miembro</p>
              </div>
              <button onClick={handleClose} className="text-[#64748B]">
                <IconX size={20} />
              </button>
            </div>

            {result?.ok ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-[#EAF3E0] flex items-center justify-center mx-auto mb-3">
                  <IconCircleCheck size={24} className="text-[#16A34A]" />
                </div>
                <p className="text-sm font-semibold text-[#0D1F3C]">{result.msg}</p>
                <Button
                  className="mt-5 bg-[#3D7A35] hover:bg-[#2D5A27] text-white"
                  size="sm"
                  onClick={handleClose}
                >
                  Listo
                </Button>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <div>
                  <Label htmlFor="email-inv" className="block mb-1.5">
                    Correo electrónico *
                  </Label>
                  <Input
                    id="email-inv"
                    type="email"
                    placeholder="colaborador@ejemplo.cl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="nombre-inv" className="block mb-1.5">
                    Nombre (opcional)
                  </Label>
                  <Input
                    id="nombre-inv"
                    placeholder="María González"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>

                <div>
                  <Label className="block mb-1.5">Rol</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { value: "trabajador_local", label: "Trabajador", desc: "Solo registros y tareas" },
                        { value: "admin_local", label: "Admin local", desc: "Gestión completa del local" },
                      ] as const
                    ).map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRol(r.value)}
                        className={`rounded-xl border-2 p-3 text-left transition-colors ${
                          rol === r.value
                            ? "border-[#3D7A35] bg-[#EAF3E0]"
                            : "border-[#E2E8F0] hover:border-[#3D7A35]/50"
                        }`}
                      >
                        <p className={`text-sm font-medium ${rol === r.value ? "text-[#2D5A27]" : "text-[#0D1F3C]"}`}>
                          {r.label}
                        </p>
                        <p className="text-xs text-[#64748B] mt-0.5">{r.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {result && !result.ok && (
                  <p className="text-sm text-[#DC2626] bg-red-50 rounded-xl px-3 py-2">
                    {result.msg}
                  </p>
                )}

                <div className="flex gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleClose}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    disabled={!email || loading}
                    onClick={handleSubmit}
                    className="flex-1 bg-[#3D7A35] hover:bg-[#2D5A27] text-white gap-2"
                  >
                    {loading ? (
                      <IconLoader2 size={16} className="animate-spin" />
                    ) : (
                      <IconUserPlus size={16} />
                    )}
                    {loading ? "Enviando..." : "Invitar"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
