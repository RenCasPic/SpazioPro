import { Logo } from "@/components/brand/logo";
import { APP_TAGLINE } from "@/lib/constants";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Logo href="/" />
          <div className="mt-10">{children}</div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <div className="absolute inset-0 opacity-90 [background:radial-gradient(circle_at_30%_20%,#3a2b22,transparent_55%),radial-gradient(circle_at_75%_75%,#2a3a2f,transparent_50%),#1c1917]" />
        <div className="relative flex h-full flex-col justify-end p-12 text-white">
          <p className="font-serif text-4xl leading-tight">{APP_TAGLINE}</p>
          <p className="mt-3 max-w-md text-sm text-white/70">
            La plataforma donde una fotografía de un espacio se convierte en una propuesta de
            diseño y en un presupuesto profesional.
          </p>
        </div>
      </div>
    </div>
  );
}
