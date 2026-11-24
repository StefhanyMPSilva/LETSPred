import { useEffect, useMemo, useRef } from "react";
import type { ApplicabilityLimitsProps } from "./types";
import { useCSVModels } from "@hooks/useCSVModels";
import { AsyncState } from "@components/AsyncState";

interface ApplicabilityTableProps {
   selectedId: number | null;
   onSelect: (id: number) => void;
   limits: ApplicabilityLimitsProps | null;
   pointsUrl: string;
}

type TableRow = { id: number; } & Record<string, number | string>;

const EXCLUDED_COLUMNS = new Set([
    "PLP.Chemscore.Hbond",
    "PLP.part.buried",
    "PLP.part.repulsive",
    "energies_residues.GLN198.PLP.S(buried)",
    "energies_residues.GLN198.PLP.total",
    "energies_residues.GLU263.PLP.S(buried)",
    "energies_residues.GLU263.PLP.total",
    "energies_residues.ILE365.PLP.total",
    "energies_residues.MET261.PLP.S(buried)",
    "energies_residues.MET261.PLP.S(nonpolar)",
    "energies_residues.PHE367.PLP.S(buried)",
    "energies_residues.TYR260.PLP.total",
    "energies_residues.TYR366.PLP.S(buried)",
    "energies_residues.ARG263.PLP.S(buried)",
    "energies_residues.ASP264.PLP.S(buried)",
    "energies_residues.ILE265.PLP.S(buried)",
    "energies_residues.PHE51.PLP.S(buried)",
  ]);

/**
 * Parseia o CSV para o formato TableRow
 * Filtra apenas as colunas permitidas e converte valores numéricos
 */
function parseApplicabilityRows(csvText: string): TableRow[] {
  const lines = csvText.trim().split("\n");
  const header = lines[0].split(",");

  const allowedColumns = header.filter(
    (col) => !EXCLUDED_COLUMNS.has(col)
  );

  return lines.slice(1).map((line, index) => {
    const values = line.split(",");
    const row: TableRow = { id: index };

    allowedColumns.forEach((col) => {
      const idx = header.indexOf(col);
      const raw = values[idx];
      const num = Number(raw);
      row[col] = isNaN(num) ? raw : num;
    });

    return row;
  });
}

/**
 * Componente de tabela detalhada dos compostos
 * 
 * Funcionalidades:
 * - Carrega dados do CSV com useCSVModels
 * - Rolagem suave até o composto selecionado
 * - Destaque visual para compostos fora do domínio
 * - Sincronização com o gráfico de dispersão
 */
export function ApplicabilityDomainTable({selectedId, onSelect, limits, pointsUrl} : ApplicabilityTableProps) {
      // Referências para as linhas da tabela (para scroll)
      const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map());

      const { data: rows, loadState, error } = useCSVModels<TableRow>({
         url: pointsUrl,
         parser: parseApplicabilityRows,
      });

      // Uso do memo nas colunas para evitar recálculos desnecessários
      const columns = useMemo(() => {
         if (rows.length === 0) return [];
         return Object.keys(rows[0]).filter((key) => key !== "id");
      }, [rows]);

      // Efeito para rolar até o composto selecionado
      useEffect(() => {
         if (selectedId == null) return;

         const row = rowRefs.current.get(selectedId);
         row?.scrollIntoView({
            behavior: "smooth",
            block: "center",
         });
      }, [selectedId]);

       return (
         <AsyncState
            isLoading={loadState === "loading"}
            error={loadState === "error" ? error : null}
            isEmpty={loadState === "success" && rows.length === 0}
         >
               
            <div className="h-[420px] overflow-auto rounded-xl bg-white shadow-md mt-8">
               <table className="min-w-full text-sm border-separate border-spacing-0">
               <thead className="bg-slate-50">
                  <tr>
                     {columns.map((col) => (
                     <th
                        key={col}
                        className="px-3 py-2 text-left font-medium text-indigo-700 border-b bg-slate-50 sticky top-0 z-10"
                     >
                        {col}
                     </th>
                     ))}
                  </tr>
               </thead>

               {/* Corpo da tabela */}
               <tbody className="bg-white">
                  {rows.map((row) => {
                     // Extrai distâncias para verificar se está fora do domínio
                     const euclid = Number(row["dist_euclidiana"]);
                     const maha = Number(row["dist_mahalanobis"]);

                     const outOfDomain = limits && (euclid > limits.euclidean || maha > limits.mahalanobis);
                     const isSelected = selectedId === row.id;

                     return (
                        <tr
                           key={row.id}
                           ref={(el) => {
                              if (el) rowRefs.current.set(row.id, el);
                           }}
                           onClick={() => onSelect(row.id)}
                           className={`cursor-pointer transition-colors
                              ${outOfDomain ? "bg-red-100" : ""}
                              ${isSelected ? "text-emerald-700 bg-emerald-50 font-semibold" : ""}
                              ${!outOfDomain && !isSelected
                                 ? "odd:bg-white even:bg-gray-100/70 text-gray-500"
                                 : ""}
                           `}
                        >
                           {columns.map((col) => (
                              <td key={col} className="px-3 py-2">
                                 {typeof row[col] === "number" ? row[col].toFixed(2) : row[col]}
                              </td>
                           ))}
                           
                        </tr>
                     );
                  })}
               </tbody>
               </table>
            </div>
         </AsyncState>
      );
   }