"use client";

import { useRef, useState } from "react";
import { Upload, Camera, ImageIcon, Loader2 } from "lucide-react";
import { fileToDataUrl } from "@/lib/image";
import { cn } from "@/lib/utils";

export function PhotoUploader({
  onReady,
}: {
  onReady: (dataUrl: string) => void;
}) {
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);

  async function handle(file?: File | null) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onReady(await fileToDataUrl(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar la imagen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void handle(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors",
          drag ? "border-clay bg-clay-tint/50" : "border-line-strong bg-surface",
        )}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-clay-tint text-clay-dark">
          {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImageIcon className="h-6 w-6" />}
        </div>
        <h3 className="mt-4 font-serif text-lg text-ink">
          Sube una foto del espacio que quieres transformar
        </h3>
        <p className="mt-1 text-sm text-ink-soft">
          Arrastra una imagen aquí o selecciónala. JPG, PNG o WebP.
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-medium text-white hover:bg-ink/90"
          >
            <Upload className="h-4 w-4" /> Elegir imagen
          </button>
          <button
            type="button"
            onClick={() => cameraInput.current?.click()}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-line-strong bg-surface px-4 text-sm font-medium text-ink hover:border-ink/30"
          >
            <Camera className="h-4 w-4" /> Usar cámara
          </button>
        </div>

        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => void handle(e.target.files?.[0])}
        />
        <input
          ref={cameraInput}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => void handle(e.target.files?.[0])}
        />
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
