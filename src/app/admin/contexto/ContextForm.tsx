"use client";

import { useState } from "react";
import { upsertContextEntry } from "./actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const PRESET_KEYS = [
  "horarios_de_funcionamento",
  "convenios_aceitos",
  "servicos_oferecidos",
  "localizacao",
  "regras_e_politicas",
  "informacoes_gerais",
];

const KEY_LABELS: Record<string, string> = {
  horarios_de_funcionamento: "Horarios de Funcionamento",
  convenios_aceitos: "Convenios Aceitos",
  servicos_oferecidos: "Servicos Oferecidos",
  localizacao: "Localizacao e Contato",
  regras_e_politicas: "Regras e Politicas",
  informacoes_gerais: "Informacoes Gerais",
};

interface Props {
  clinicId: string;
}

export function ContextForm({ clinicId }: Props) {
  const [key, setKey] = useState("");
  const [content, setContent] = useState("");
  const [customKey, setCustomKey] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const finalKey = useCustom ? customKey.trim() : key;
    if (!finalKey || !content.trim()) {
      setMessage({ type: "error", text: "Preencha todos os campos." });
      setSaving(false);
      return;
    }

    try {
      await upsertContextEntry(clinicId, finalKey, content.trim());
      setMessage({ type: "success", text: "Informacao salva com sucesso!" });
      setContent("");
      setCustomKey("");
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Erro ao salvar.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Tipo de Informacao
        </label>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setUseCustom(false)}
            className={`px-4 py-1.5 text-sm rounded-xl border transition-colors ${
              !useCustom
                ? "bg-teal-50 border-teal-300 text-teal-700"
                : "border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
          >
            Predefinido
          </button>
          <button
            type="button"
            onClick={() => setUseCustom(true)}
            className={`px-4 py-1.5 text-sm rounded-xl border transition-colors ${
              useCustom
                ? "bg-teal-50 border-teal-300 text-teal-700"
                : "border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
          >
            Personalizado
          </button>
        </div>

        {useCustom ? (
          <Input
            value={customKey}
            onChange={(e) => setCustomKey(e.target.value)}
            placeholder="Ex: promocoes, avisos_importantes"
          />
        ) : (
          <select
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          >
            <option value="">Selecione...</option>
            {PRESET_KEYS.map((k) => (
              <option key={k} value={k}>
                {KEY_LABELS[k]}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Conteudo
        </label>
        <p className="text-xs text-gray-400 mb-2">
          Escreva em texto livre. A IA usara estas informacoes para responder aos pacientes.
        </p>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          placeholder="Ex: Atendemos de segunda a sexta das 8h as 18h e sabado das 8h as 12h..."
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-y transition-all"
        />
      </div>

      {message && (
        <div
          className={`px-4 py-3 rounded-xl text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <Button type="submit" loading={saving} disabled={!content.trim()}>
        Salvar
      </Button>
    </form>
  );
}
