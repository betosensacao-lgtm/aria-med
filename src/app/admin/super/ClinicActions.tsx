"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  slug: string;
  priceMonthly: number;
  maxProfessionals: number | null;
  maxConversationsMonthly: number | null;
  features: string[];
  highlighted: boolean;
}

interface Clinic {
  id: string;
  name: string;
  planId: string | null;
  planName: string | null;
  planSlug: string | null;
  planPrice: number | null;
  planMaxProfs: number | null;
  planMaxConversations: number | null;
  planFeatures: string[] | null;
  billingCycle: string | null;
  trialEndsAt: string | null;
  conversationsUsedMonthly: number;
  isVerified: boolean;
  city: string | null;
  state: string | null;
  phone: string;
  email: string;
  slug: string;
}

interface ClinicActionsProps {
  clinic: Clinic;
  onUpdated: () => void;
}

function formatPrice(cents: number) {
  return `R$ ${(cents / 100).toFixed(0)}`;
}

export function ClinicActions({ clinic, onUpdated }: ClinicActionsProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planId, setPlanId] = useState(clinic.planId || "");
  const [billingCycle, setBillingCycle] = useState(clinic.billingCycle || "monthly");
  const [isVerified, setIsVerified] = useState(clinic.isVerified);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (showEdit) {
      fetch("/api/admin/plans")
        .then((r) => r.json())
        .then(setPlans)
        .catch(() => toast.error("Erro ao carregar planos"));
    }
  }, [showEdit]);

  async function handleUpdate() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/clinics/${clinic.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: planId || null,
          billingCycle,
          isVerified,
        }),
      });

      if (res.ok) {
        toast.success(`"${clinic.name}" atualizada`);
        setShowEdit(false);
        onUpdated();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao atualizar");
      }
    } catch {
      toast.error("Erro ao conectar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/clinics/${clinic.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(`"${clinic.name}" excluida`);
        setShowDelete(false);
        onUpdated();
      } else {
        toast.error("Erro ao excluir");
      }
    } catch {
      toast.error("Erro ao conectar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => setShowEdit(true)}
          className="text-xs text-teal-600 hover:text-teal-700 font-medium"
        >
          Editar
        </button>
        <button
          onClick={() => setShowDelete(true)}
          className="text-xs text-red-500 hover:text-red-600 font-medium"
        >
          Excluir
        </button>
      </div>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title={`Editar: ${clinic.name}`}>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Plano</label>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Sem plano (free)</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatPrice(p.priceMonthly)}/mes
                  {p.maxProfessionals ? ` (ate ${p.maxProfessionals} profs)` : " (profs ilimitados)"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ciclo de Cobranca</label>
            <select
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="monthly">Mensal</option>
              <option value="yearly">Anual</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="verified"
              checked={isVerified}
              onChange={(e) => setIsVerified(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="verified" className="text-sm text-gray-700">Clinica verificada</label>
          </div>

          {clinic.planFeatures && clinic.planFeatures.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Funcionalidades do plano atual</p>
              <ul className="space-y-1">
                {clinic.planFeatures.map((f, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-400 mt-2">
                {clinic.planMaxConversations
                  ? `${clinic.conversationsUsedMonthly}/${clinic.planMaxConversations} conversas usadas este mes`
                  : "Conversoes ilimitadas"}
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowEdit(false)}>Cancelar</Button>
            <Button loading={saving} onClick={handleUpdate}>Salvar</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showDelete} onClose={() => setShowDelete(false)} title={`Excluir ${clinic.name}?`}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Tem certeza? Esta acao nao pode ser desfeita. Todos os dados da clinica serao removidos.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowDelete(false)}>Cancelar</Button>
            <Button variant="danger" loading={saving} onClick={handleDelete}>Excluir</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
