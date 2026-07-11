"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";

interface ClinicActionsProps {
  clinicId: string;
  clinicName: string;
}

export function ClinicActions({ clinicId, clinicName }: ClinicActionsProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [plan, setPlan] = useState("free");
  const [saving, setSaving] = useState(false);

  async function handleUpdatePlan() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/clinics/${clinicId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (res.ok) {
        toast.success(`Plano de "${clinicName}" atualizado para ${plan}`);
        setShowEdit(false);
        // Force page refresh
        window.location.reload();
      } else {
        toast.error("Erro ao atualizar plano");
      }
    } catch {
      toast.error("Erro ao conectar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setShowEdit(true)}
        className="text-xs text-teal-600 hover:text-teal-700 font-medium"
      >
        Editar
      </button>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title={`Editar: ${clinicName}`}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Plano</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="free">Free</option>
              <option value="starter">Starter (R$97)</option>
              <option value="professional">Professional (R$197)</option>
              <option value="enterprise">Enterprise (R$397)</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowEdit(false)}>Cancelar</Button>
            <Button loading={saving} onClick={handleUpdatePlan}>Salvar</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
