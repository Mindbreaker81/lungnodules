"use client";

import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { AssessmentInput } from "@lib/schemas/noduleInput";
import { Input } from "@components/ui/input";

interface Props {
  clinicalContext: "incidental" | "screening";
}

const NODULE_TYPE_TOOLTIP =
  "Sólido: opacidad que oculta vasos/bronquios. " +
  "Vidrio esmerilado (GGN/no sólido): aumento de atenuación sin ocultar estructuras. " +
  "Parte-sólido (sub-sólido): combina vidrio esmerilado y componente sólido.";

export default function NoduleStep({ clinicalContext }: Props) {
  const { register, watch, setValue } = useFormContext<AssessmentInput>();
  const type = watch("nodule.type");
  const isMultiple = watch("nodule.isMultiple");
  const isAirway = watch("nodule.isAirway");
  const isInflammatory = watch("nodule.isInflammatory");
  const isAtypicalCyst = watch("nodule.isAtypicalCyst");
  const hasPet = watch("nodule.hasPet");
  const diameter = watch("nodule.diameterMm");
  const solidComponent = watch("nodule.solidComponentMm");
  const isScreening = clinicalContext === "screening";
  const solidExceeds =
    type === "part-solid" &&
    solidComponent !== undefined &&
    diameter !== undefined &&
    !Number.isNaN(solidComponent) &&
    !Number.isNaN(diameter) &&
    solidComponent > diameter;

  useEffect(() => {
    if (!hasPet) {
      setValue("nodule.petUptake", undefined);
    }
  }, [hasPet, setValue]);

  useEffect(() => {
    if (!isMultiple) {
      setValue("nodule.noduleCount", undefined);
    }
  }, [isMultiple, setValue]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <span>Tipo de nódulo</span>
            <span className="text-xs text-slate-400" title={NODULE_TYPE_TOOLTIP} aria-label="Ayuda sobre tipos de nódulo">
              (?)
            </span>
          </label>
          <select
            className="mt-1 w-full rounded-md border border-slate-600 bg-transparent px-3 py-2 text-slate-100"
            aria-label="Tipo de nódulo"
            {...register("nodule.type")}
          >
            <option value="solid" className="bg-surface">Sólido</option>
            <option value="ground-glass" className="bg-surface">Vidrio esmerilado (GGN / no sólido)</option>
            <option value="part-solid" className="bg-surface">Parte-sólido (sub-sólido)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">Diámetro medio (mm)</label>
          <Input
            type="number"
            min={1}
            max={100}
            step="0.1"
            aria-label="Diámetro medio en milímetros"
            className="mt-1"
            {...register("nodule.diameterMm", { valueAsNumber: true })}
          />
        </div>
      </div>

      {type === "part-solid" && (
        <div>
          <label className="block text-sm font-medium text-slate-300">Componente sólido (mm)</label>
          <Input
            type="number"
            min={0}
            max={100}
            step="0.1"
            aria-label="Componente sólido en milímetros"
            className="mt-1"
            {...register("nodule.solidComponentMm", { valueAsNumber: true })}
          />
          {solidExceeds && (
            <p className="mt-1 text-sm text-amber-400">
              El componente sólido no puede ser mayor que el diámetro total.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-white">
          <input type="checkbox" aria-label="Múltiples nódulos" {...register("nodule.isMultiple")} className="text-primary rounded focus:ring-primary" /> Múltiples
          nódulos (ingresa el dominante)
        </label>
        <label className="flex items-center gap-2 text-white">
          <input type="checkbox" aria-label="Espiculación" {...register("nodule.hasSpiculation")} className="text-primary rounded focus:ring-primary" /> Espiculación
        </label>
        <label className="flex items-center gap-2 text-white">
          <input type="checkbox" aria-label="Lóbulo superior" {...register("nodule.isUpperLobe")} className="text-primary rounded focus:ring-primary" /> Lóbulo superior
        </label>
        <label className="flex items-center gap-2 text-white">
          <input type="checkbox" aria-label="Perifisural" {...register("nodule.isPerifissural")} className="text-primary rounded focus:ring-primary" /> Perifisural
          {isScreening && <span className="text-xs text-slate-400">benigno (≤10mm)</span>}
        </label>
        <label className="flex items-center gap-2 text-white">
          <input type="checkbox" aria-label="Juxta-pleural" {...register("nodule.isJuxtapleural")} className="text-primary rounded focus:ring-primary" /> Yuxtapleural
          {isScreening && <span className="text-xs text-slate-400">benigno (≤10mm)</span>}
        </label>
        {isScreening && (
          <label className="flex items-center gap-2 text-white">
            <input type="checkbox" aria-label="Nódulo nuevo en follow-up" {...register("nodule.isNew")} className="text-primary rounded focus:ring-primary" /> Nódulo nuevo en follow-up
          </label>
        )}
      </div>

      <div className="space-y-3 rounded-lg border border-slate-700/60 bg-slate-900/40 p-3">
        <p className="text-sm font-medium text-slate-300">Factores para modelos predictivos (opcional)</p>
        {isMultiple && (
          <div>
            <label className="block text-sm font-medium text-slate-300">Número de nódulos</label>
            <Input
              type="number"
              min={1}
              max={50}
              aria-label="Número de nódulos"
              className="mt-1"
              {...register("nodule.noduleCount", {
                setValueAs: (value) => (value === "" ? undefined : Number(value)),
              })}
            />
          </div>
        )}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-white">
            <input type="checkbox" aria-label="PET-CT disponible" {...register("nodule.hasPet")} className="text-primary rounded focus:ring-primary" /> PET-CT disponible
          </label>
          {hasPet && (
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-300">Captación FDG</label>
              <select
                className="mt-1 w-full rounded-md border border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-100"
                aria-label="Captación FDG en PET"
                defaultValue=""
                {...register("nodule.petUptake", { setValueAs: (value) => value || undefined })}
              >
                <option value="" className="bg-surface">Selecciona una opción</option>
                <option value="absent" className="bg-surface">Ausente</option>
                <option value="faint" className="bg-surface">Leve</option>
                <option value="moderate" className="bg-surface">Moderada</option>
                <option value="intense" className="bg-surface">Intensa</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {isScreening && (
        <div className="space-y-3 rounded-lg border border-slate-700/60 bg-slate-900/40 p-3">
          <p className="text-sm font-medium text-slate-300">Reglas especiales Lung-RADS v2022</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-white">
              <input type="checkbox" aria-label="Benigno definitivo o sin nódulos" {...register("nodule.isBenign")} className="text-primary rounded focus:ring-primary" /> Sin nódulos o benigno definitivo (Cat 1)
            </label>
            <label className="flex items-center gap-2 text-white">
              <input type="checkbox" aria-label="Hallazgo significativo" {...register("nodule.hasSignificantFinding")} className="text-primary rounded focus:ring-primary" /> Hallazgo significativo (Cat S)
            </label>
            <label className="flex items-center gap-2 text-white">
              <input type="checkbox" aria-label="Hallazgo inflamatorio" {...register("nodule.isInflammatory")} className="text-primary rounded focus:ring-primary" /> Hallazgo inflamatorio/infeccioso
            </label>
            <label className="flex items-center gap-2 text-white">
              <input type="checkbox" aria-label="Nódulo de vía aérea" {...register("nodule.isAirway")} className="text-primary rounded focus:ring-primary" /> Nódulo de vía aérea
            </label>
            <label className="flex items-center gap-2 text-white">
              <input type="checkbox" aria-label="Quiste pulmonar atípico" {...register("nodule.isAtypicalCyst")} className="text-primary rounded focus:ring-primary" /> Quiste pulmonar atípico
            </label>
          </div>

          {isInflammatory && (
            <div>
              <label className="block text-sm font-medium text-slate-300">Categoría inflamatoria</label>
              <select
                className="mt-1 w-full rounded-md border border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-100"
                aria-label="Categoría inflamatoria"
                defaultValue=""
                {...register("nodule.inflammatoryCategory", { setValueAs: (value) => value || undefined })}
              >
                <option value="" className="bg-surface">Selecciona una categoría</option>
                <option value="category0" className="bg-surface">Categoría 0 (incompleto, control 1-3m)</option>
                <option value="category2" className="bg-surface">Categoría 2 (probable inflamatorio)</option>
              </select>
            </div>
          )}

          {isAirway && (
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium text-slate-300">Localización vía aérea</label>
                <select
                  className="mt-1 w-full rounded-md border border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-100"
                  aria-label="Localización del nódulo de vía aérea"
                  defaultValue=""
                  {...register("nodule.airwayLocation", { setValueAs: (value) => value || undefined })}
                >
                  <option value="" className="bg-surface">Selecciona una opción</option>
                  <option value="subsegmental" className="bg-surface">Subsegmentario o benigno (Cat 2)</option>
                  <option value="segmental-proximal" className="bg-surface">Segmentario o proximal (Cat 4A)</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-white">
                <input type="checkbox" aria-label="Persistente en control" {...register("nodule.airwayPersistent")} className="text-primary rounded focus:ring-primary" /> Persistente en control 3 meses (Cat 4B)
              </label>
            </div>
          )}

          {isAtypicalCyst && (
            <div>
              <label className="block text-sm font-medium text-slate-300">Categoría de quiste atípico</label>
              <select
                className="mt-1 w-full rounded-md border border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-100"
                aria-label="Categoría de quiste pulmonar atípico"
                defaultValue=""
                {...register("nodule.atypicalCystCategory", { setValueAs: (value) => value || undefined })}
              >
                <option value="" className="bg-surface">Selecciona una categoría</option>
                <option value="category3" className="bg-surface">Categoría 3 (quiste estable con crecimiento quístico)</option>
                <option value="category4A" className="bg-surface">Categoría 4A (pared gruesa/multilocular)</option>
                <option value="category4B" className="bg-surface">Categoría 4B (crecimiento o nodularidad)</option>
              </select>
            </div>
          )}
        </div>
      )}

      {isMultiple && (
        <p className="text-sm text-slate-400">Para múltiples nódulos, ingresa el nódulo dominante o más sospechoso.</p>
      )}
    </div>
  );
}
