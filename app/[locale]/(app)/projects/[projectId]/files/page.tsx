"use client";

import { use, useRef, useState } from "react";
import { FileText, FileSpreadsheet, FileImage, File as FileIcon, Upload, Trash2 } from "lucide-react";
import type { ProjectFile, ProjectFileKind } from "@/types";
import { ProjectShell } from "@/components/projects/project-shell";
import type { ProjectBundle } from "@/lib/services/project-service";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { useT } from "@/components/localization/i18n-provider";
import { useToasts } from "@/lib/toast";
import { fileService } from "@/lib/services/file-service";

const ICON: Record<ProjectFileKind, typeof FileText> = {
  pdf: FileText,
  docx: FileText,
  xlsx: FileSpreadsheet,
  csv: FileSpreadsheet,
  image: FileImage,
  other: FileIcon,
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilesPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  return (
    <ProjectShell projectId={projectId}>
      {(bundle, reload) => <Files bundle={bundle} reload={reload} />}
    </ProjectShell>
  );
}

function Files({ bundle, reload }: { bundle: ProjectBundle; reload: () => Promise<void> }) {
  const t = useT();
  const push = useToasts((s) => s.push);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        await fileService.upload(bundle.project.id, file);
      }
      await reload();
    } catch (e) {
      push(e instanceof Error ? e.message : t("projects.files.upload_failed"), "error");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove(id: string) {
    await fileService.remove(id);
    push(t("projects.files.removed"), "success");
    await reload();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="display text-[22px] text-ink">{t("projects.files.title")}</h2>
          <p className="mt-1 max-w-xl text-[13px] text-ink-soft">{t("projects.files.subtitle")}</p>
        </div>
        <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
          <Upload className="h-4 w-4" /> {uploading ? t("projects.files.uploading") : t("projects.files.upload")}
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.webp"
          hidden
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </div>

      {bundle.files.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title={t("projects.files.empty_title")}
          description={t("projects.files.empty_description")}
          action={
            <Button onClick={() => inputRef.current?.click()}>
              <Upload className="h-4 w-4" /> {t("projects.files.upload")}
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          {bundle.files.map((f) => (
            <Row key={f.id} file={f} onRemove={() => remove(f.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ file, onRemove }: { file: ProjectFile; onRemove: () => void }) {
  const Icon = ICON[file.kind];
  return (
    <a
      href={file.url}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center gap-3 border-b border-line px-4 py-3 last:border-0 hover:bg-canvas"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-canvas text-ink-soft">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-ink">{file.name}</span>
        <span className="block text-[11px] text-muted">{formatBytes(file.sizeBytes)}</span>
      </span>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        className="shrink-0 rounded-lg p-1.5 text-muted opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </a>
  );
}
