"use client";

import type { ProjectBundle } from "@/lib/services/project-service";
import { useEditor } from "@/hooks/use-editor";
import { Field, Input } from "@/components/ui/field";
import { taxService } from "@/lib/market/tax-service";
import { transportService } from "@/lib/market/transport-service";
import { currencyService } from "@/lib/market/currency-service";

export function BudgetSettings({ bundle }: { bundle: ProjectBundle }) {
  const { updateSettings } = useEditor();
  const s = bundle.config.settings;
  const rate = transportService.rateForCountry(bundle.project.countryCode);
  const taxRates = taxService.ratesForCountry(bundle.project.countryCode);
  const transportEstimate = transportService.estimate(bundle.project.countryCode, s.transport);
  const money = (n: number) =>
    currencyService.format({ amount: n, currency: bundle.project.currencyCode }, bundle.project.locale);

  return (
    <div className="space-y-4">
      <h3 className="font-serif text-xl text-ink">Ajustes del presupuesto</h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Impuesto (%)" hint={`Mercado ${bundle.project.countryCode}`}>
          <div className="flex gap-2">
            <Input
              type="number"
              min="0"
              step="0.5"
              value={s.vatRate}
              onChange={(e) => updateSettings({ vatRate: Number(e.target.value) })}
            />
            <select
              value={s.vatRate}
              onChange={(e) => updateSettings({ vatRate: Number(e.target.value) })}
              className="h-10 rounded-xl border border-line-strong bg-surface px-2 text-xs"
            >
              {taxRates.map((t) => (
                <option key={t.category} value={t.rate}>
                  {t.name} ({t.rate}%)
                </option>
              ))}
            </select>
          </div>
        </Field>
        <Field label="Descuento (%)">
          <Input
            type="number"
            min="0"
            step="1"
            value={s.discountPercent}
            onChange={(e) => updateSettings({ discountPercent: Number(e.target.value) })}
          />
        </Field>
      </div>

      <div className="rounded-xl border border-line p-3">
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={s.transport.enabled}
            onChange={(e) => updateSettings({ transport: { ...s.transport, enabled: e.target.checked } })}
            className="h-4 w-4 accent-clay"
          />
          Transporte
        </label>
        {s.transport.enabled && (
          <>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Field label="Distancia (km)">
                <Input
                  type="number"
                  min="0"
                  value={s.transport.distanceKm}
                  onChange={(e) =>
                    updateSettings({ transport: { ...s.transport, distanceKm: Number(e.target.value), manualOverride: null } })
                  }
                />
              </Field>
              <Field label="Volumen (m³)">
                <Input
                  type="number"
                  min="0"
                  value={s.transport.volumeM3}
                  onChange={(e) =>
                    updateSettings({ transport: { ...s.transport, volumeM3: Number(e.target.value), manualOverride: null } })
                  }
                />
              </Field>
              <Field label="Importe manual">
                <Input
                  type="number"
                  min="0"
                  placeholder="auto"
                  value={s.transport.manualOverride ?? ""}
                  onChange={(e) =>
                    updateSettings({
                      transport: {
                        ...s.transport,
                        manualOverride: e.target.value === "" ? null : Number(e.target.value),
                      },
                    })
                  }
                />
              </Field>
            </div>
            <p className="mt-2 text-[11px] text-muted">
              Tarifa {bundle.project.countryCode}: base {money(rate.baseFee)} + {money(rate.perKm)}/km +{" "}
              {money(rate.perM3)}/m³ → <span className="font-medium text-ink">{money(transportEstimate)}</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
