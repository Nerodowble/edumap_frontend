"use client";

import { useState } from "react";
import type { TaxonomiaNode } from "@/lib/types";
import { pctColor, pctIcon } from "@/lib/constants";

function TreeNodeView({
  node,
  depth = 0,
  defaultOpen,
}: {
  node: TaxonomiaNode;
  depth?: number;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hasChildren = node.filhos && node.filhos.length > 0;
  const color = pctColor(node.percentual);
  const indentPx = depth * 16;

  // Linha principal do nó
  const row = (
    <div
      className={`flex items-center gap-2 py-2 rounded transition-colors ${
        hasChildren ? "cursor-pointer hover:bg-gray-50" : ""
      }`}
      style={{ paddingLeft: `${indentPx + 8}px` }}
      onClick={() => hasChildren && setOpen(!open)}
    >
      <span className="text-gray-400 text-xs w-3 flex-shrink-0">
        {hasChildren ? (open ? "▼" : "▶") : ""}
      </span>
      <span className="text-sm flex-shrink-0">{pctIcon(node.percentual)}</span>
      <span
        className={`flex-1 text-sm truncate ${
          depth === 0 ? "font-bold text-gray-900" : "text-gray-700"
        }`}
      >
        {node.label}
      </span>
      <span className="text-sm font-bold tabular-nums" style={{ color }}>
        {node.percentual}%
      </span>
      <span className="text-xs text-gray-400 tabular-nums w-14 text-right">
        {node.acertos}/{node.total}
      </span>
    </div>
  );

  return (
    <div>
      {row}
      {open && hasChildren && (
        <div>
          {node.filhos.map((child) => (
            <TreeNodeView
              key={child.codigo}
              node={child}
              depth={depth + 1}
              defaultOpen={depth < 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TaxonomiaTab({ tree }: { tree: TaxonomiaNode[] }) {
  if (!tree || tree.length === 0) {
    return (
      <div className="card text-center py-12 text-gray-500">
        <p className="mb-2">Nenhuma classificação taxonômica disponível para esta prova.</p>
        <p className="text-xs">
          Provas enviadas antes da nova classificação (ou sem matéria identificada)
          não terão dados aqui. Reenvie a prova selecionando a matéria para gerar o diagnóstico.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
        <div>
          Expanda cada nó para ver onde a turma tem mais dificuldade.
        </div>
        <div className="flex items-center gap-3">
          <span>🔴 &lt;50%</span>
          <span>🟡 50-69%</span>
          <span>🟢 ≥70%</span>
        </div>
      </div>
      <div className="border border-gray-100 rounded-lg divide-y divide-gray-50">
        {tree.map((root) => (
          <TreeNodeView key={root.codigo} node={root} depth={0} defaultOpen={true} />
        ))}
      </div>
    </div>
  );
}
