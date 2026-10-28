import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="mono text-[11px] uppercase tracking-[0.2em] text-muted-2">помилка 404</p>
      <h1 className="mt-4 font-display text-[clamp(48px,10vw,120px)] font-semibold leading-none tracking-[-0.06em]">
        4<span className="text-accent">0</span>4
      </h1>
      <p className="mt-4 max-w-md text-[13.5px] leading-relaxed text-muted">
        Такої сторінки немає. Можливо, закупівлю видалено з першоджерела або посилання
        застаріло.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-2">
        <Link href="/" className="btn btn-primary">
          <ArrowLeft className="h-4 w-4" /> На головну
        </Link>
        <Link href="/tenders" className="btn btn-ghost">
          <Search className="h-4 w-4" /> До закупівель
        </Link>
      </div>
    </div>
  );
}
