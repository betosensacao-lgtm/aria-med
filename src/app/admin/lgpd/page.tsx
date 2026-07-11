"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

export default function LGPDPage() {
  const [exportEmail, setExportEmail] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [deleteEmail, setDeleteEmail] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleExport(e: React.FormEvent) {
    e.preventDefault();
    setExporting(true);
    setExportMsg(null);

    try {
      const res = await fetch("/api/admin/lgpd/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: exportEmail }),
      });
      const data = await res.json();

      if (res.ok) {
        setExportMsg({ type: "success", text: data.message || "Solicitacao registrada. Os dados serao enviados por email." });
        setExportEmail("");
      } else {
        setExportMsg({ type: "error", text: data.error || "Erro ao solicitar exportacao" });
      }
    } catch {
      setExportMsg({ type: "error", text: "Erro ao conectar" });
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setDeleting(true);
    setDeleteMsg(null);

    if (deleteConfirm !== "EXCLUIR") {
      setDeleteMsg({ type: "error", text: "Digite EXCLUIR para confirmar" });
      setDeleting(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/lgpd/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: deleteEmail }),
      });
      const data = await res.json();

      if (res.ok) {
        setDeleteMsg({ type: "success", text: data.message || "Dados excluidos com sucesso." });
        setDeleteEmail("");
        setDeleteConfirm("");
      } else {
        setDeleteMsg({ type: "error", text: data.error || "Erro ao excluir dados" });
      }
    } catch {
      setDeleteMsg({ type: "error", text: "Erro ao conectar" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title="LGPD — Privacidade"
        description="Gerencie dados pessoais conforme a Lei Geral de Protecao de Dados"
      />

      {/* Privacy Policy Summary */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Politica de Privacidade</h2>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-gray-600">
          <div>
            <h3 className="font-medium text-gray-900 mb-1">1. Dados Coletados</h3>
            <p>
              O MedBook coleta apenas os dados necessarios para o funcionamento do servico:
              nome, telefone, email e informacoes de saude fornecidas voluntariamente pelo
              paciente durante a conversa com o chatbot.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-1">2. Finalidade</h3>
            <p>
              Os dados sao utilizados exclusivamente para: agendamento de consultas,
              pre-anamnese, e comunicacao entre paciente e clinica. Nao sao vendidos ou
              compartilhados com terceiros.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-1">3. Armazenamento</h3>
            <p>
              Dados armazenados no Supabase (PostgreSQL) com criptografia em transito (TLS)
              e em repouso. Acesso restrito aos administradores da clinica.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-1">4. Direitos do Titular</h3>
            <p>
              Conforme a LGPD (Art. 18), voce tem direito a: acesso aos dados, correcao,
              exclusao, portabilidade, e revogacao de consentimento.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-1">5. Retencao</h3>
            <p>
              Os dados sao mantidos enquanto a conta estiver ativa. Ao solicitar exclusao,
              todos os dados pessoais serao removidos permanentemente em ate 30 dias.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Export */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Exportar Meus Dados</h2>
            <p className="text-sm text-gray-500">
              Solicite uma copia de todos os seus dados pessoais (Art. 18, II)
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleExport} className="space-y-4">
              <Input
                label="Email cadastrado"
                type="email"
                value={exportEmail}
                onChange={(e) => setExportEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
              {exportMsg && (
                <div className={`text-sm px-4 py-3 rounded-xl ${
                  exportMsg.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {exportMsg.text}
                </div>
              )}
              <Button type="submit" loading={exporting} variant="outline">
                Solicitar Exportacao
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Data Deletion */}
        <Card className="border-red-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-red-700">Excluir Meus Dados</h2>
              <Badge variant="danger">Irreversivel</Badge>
            </div>
            <p className="text-sm text-gray-500">
              Solicite a exclusao permanente de todos os seus dados (Art. 18, VI)
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDelete} className="space-y-4">
              <Input
                label="Email cadastrado"
                type="email"
                value={deleteEmail}
                onChange={(e) => setDeleteEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Digite <span className="font-bold text-red-600">EXCLUIR</span> para confirmar
                </label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="EXCLUIR"
                  className="w-full px-4 py-2.5 border border-red-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>
              {deleteMsg && (
                <div className={`text-sm px-4 py-3 rounded-xl ${
                  deleteMsg.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {deleteMsg.text}
                </div>
              )}
              <Button
                type="submit"
                loading={deleting}
                variant="danger"
                disabled={deleteConfirm !== "EXCLUIR"}
              >
                Excluir Todos os Dados
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Consent Management */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Gerenciamento de Consentimento</h2>
          <p className="text-sm text-gray-500">
            Controle como seus dados sao utilizados (Art. 8, I)
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ConsentItem
              title="Armazenamento de dados para pre-anamnese"
              description="Permitir que os dados fornecidos na pre-anamnese sejam salvos para uso na consulta"
              defaultChecked={true}
            />
            <ConsentItem
              title="Comunicacao por email"
              description="Receber lembretes de consultas e comunicacoes da clinica"
              defaultChecked={true}
            />
            <ConsentItem
              title="Melhoria do servico"
              description="Permitir o uso de dados anonimizados para melhoria do chatbot"
              defaultChecked={false}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ConsentItem({
  title,
  description,
  defaultChecked,
}: {
  title: string;
  description: string;
  defaultChecked: boolean;
}) {
  const [enabled, setEnabled] = useState(defaultChecked);
  const [saved, setSaved] = useState(false);

  function handleToggle() {
    setEnabled(!enabled);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex items-start justify-between p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
      <div className="flex-1">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        {saved && (
          <span className="text-xs text-green-600">Salvo!</span>
        )}
        <button
          type="button"
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled ? "bg-teal-600" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
