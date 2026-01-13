"use client";

import { useFormContext } from "react-hook-form";
import { AssessmentInput } from "@lib/schemas/noduleInput";
import { Input } from "@components/ui/input";

interface Props {
  clinicalContext: "incidental" | "screening";
}

export default function NoduleStep({ clinicalContext }: Props) {
  const { register, watch } = useFormContext<AssessmentInput>();
  const type = watch("nodule.type");
  const isMultiple = watch("nodule.isMultiple");
  const diameter = watch("nodule.diameterMm");
  const solidComponent = watch("nodule.solidComponentMm");
  const solidExceeds =
    type === "part-solid" &&
    solidComponent !== undefined &&
    diameter !== undefined &&
    !Number.isNaN(solidComponent) &&
    !Number.isNaN(diameter) &&
    solidComponent > diameter;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-300">Tipo de nódulo</label>
          <select
            className="mt-1 w-full rounded-md border border-slate-600 bg-transparent px-3 py-2 text-slate-100"
            aria-label="Tipo de nódulo"
            {...register("nodule.type")}
          >
            <option value="solid" className="bg-surface">Sólido</option>
            <option value="ground-glass" className="bg-surface">Ground-glass</option>
            <option value="part-solid" className="bg-surface">Part-solid</option>
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
          <input type="checkbox" aria-label="Perifisural" {...register("nodule.isPerifissural")} className="text-primary rounded focus:ring-primary" /> Perifisural
        </label>
        <label className="flex items-center gap-2 text-white">
          <input type="checkbox" aria-label="Juxta-pleural o airway" {...register("nodule.isJuxtapleural")} className="text-primary rounded focus:ring-primary" /> Juxta-pleural / airway
        </label>
        {clinicalContext === "screening" && (
          <label className="flex items-center gap-2 text-white">
            <input type="checkbox" aria-label="Nódulo nuevo en follow-up" {...register("nodule.isNew")} className="text-primary rounded focus:ring-primary" /> Nódulo nuevo en follow-up
          </label>
        )}
      </div>

      {isMultiple && (
        <p className="text-sm text-slate-400">Para múltiples nódulos, ingresa el nódulo dominante o más sospechoso.</p>
      )}
    </div>
  );
}
