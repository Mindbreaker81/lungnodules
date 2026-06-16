"use client";

import { useFormContext } from "react-hook-form";
import { AssessmentInput } from "@lib/schemas/noduleInput";
import { FormField, FormItem, FormControl } from "@components/ui/form";
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group";

export default function ContextStep() {
  const { control, watch } = useFormContext<AssessmentInput>();
  const context = watch("clinicalContext");

  return (
    <fieldset className="space-y-4" aria-label="Contexto clínico">
      <legend className="text-base font-semibold text-foreground">
        Selecciona el contexto clínico para aplicar la guía correcta.
      </legend>
      <FormField
        control={control}
        name="clinicalContext"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
              >
                <FormItem>
                  <FormControl>
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 shadow-sm transition-all ${
                        context === "incidental"
                          ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                          : "border-border bg-card hover:border-muted-foreground/50"
                      }`}
                    >
                      <RadioGroupItem value="incidental" className="mt-1" />
                      <div>
                        <div className="font-semibold text-foreground">Incidental (Fleischner 2017)</div>
                        <p className="text-sm text-muted-foreground">
                          Pacientes ≥35 años, hallazgo casual. Requiere riesgo bajo/alto.
                        </p>
                      </div>
                    </label>
                  </FormControl>
                </FormItem>

                <FormItem>
                  <FormControl>
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 shadow-sm transition-all ${
                        context === "screening"
                          ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                          : "border-border bg-card hover:border-muted-foreground/50"
                      }`}
                    >
                      <RadioGroupItem value="screening" className="mt-1" />
                      <div>
                        <div className="font-semibold text-foreground">Screening (Lung-RADS v2022)</div>
                        <p className="text-sm text-muted-foreground">
                          Programas de cribado de alto riesgo; requiere tipo de scan baseline/follow-up.
                        </p>
                      </div>
                    </label>
                  </FormControl>
                </FormItem>
              </RadioGroup>
            </FormControl>
          </FormItem>
        )}
      />
    </fieldset>
  );
}
