import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function AppHeader({ cta = true }: { cta?: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo href="/dashboard" />
        <nav className="flex items-center gap-1 sm:gap-2">
          <ButtonLink href="/dashboard" variant="ghost" size="sm">
            Proyectos
          </ButtonLink>
          {cta && (
            <ButtonLink href="/projects/new" size="sm">
              <Plus className="h-4 w-4" />
              Nuevo proyecto
            </ButtonLink>
          )}
        </nav>
      </div>
    </header>
  );
}
