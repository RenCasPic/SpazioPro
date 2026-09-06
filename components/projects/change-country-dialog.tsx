"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { ProjectBundle } from "@/lib/services/project-service";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CountrySelect } from "@/components/countries/country-select";
import { useEditor } from "@/hooks/use-editor";
import { countryByCode } from "@/lib/market/data/countries";

export function ChangeCountryDialog({
  open,
  onClose,
  bundle,
}: {
  open: boolean;
  onClose: () => void;
  bundle: ProjectBundle;
}) {
  const changeCountry = useEditor((s) => s.changeCountry);
  const [target, setTarget] = useState(bundle.project.countryCode);
  const [working, setWorking] = useState(false);
  const country = countryByCode(target);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Cambiar país del proyecto"
      description="Cambiar el país puede modificar la moneda, impuestos, materiales, proveedores, precios, mano de obra y transporte utilizados en este proyecto."
    >
      <div className="space-y-4">
        <CountrySelect value={target} onChange={setTarget} />
        {country && target !== bundle.project.countryCode && (
          <p className="flex items-start gap-2 rounded-xl bg-clay-tint/60 px-3 py-2.5 text-xs text-clay-dark">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Se recalcularán los precios de {bundle.items.length} elemento(s) y las tarifas de mano de
            obra con el mercado de {country.name} ({country.currencyCode}). Los presupuestos ya
            generados no cambian.
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={working}>
            Cancelar
          </Button>
          <Button
            disabled={working || target === bundle.project.countryCode}
            onClick={async () => {
              setWorking(true);
              await changeCountry(target);
              setWorking(false);
              onClose();
            }}
          >
            {working ? "Recalculando…" : "Cambiar y recalcular"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
