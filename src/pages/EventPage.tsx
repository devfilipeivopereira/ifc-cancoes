import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { SetList } from "./ServicesPage";
import { eventById } from "../lib/data";
import { formatDate, tipoHint } from "../lib/format";

export function EventPage() {
  const { id } = useParams();
  const event = id ? eventById.get(id) : undefined;

  useEffect(() => {
    document.title = event ? `${event.evento} · Repertório IFC` : "Culto não encontrado · Repertório IFC";
  }, [event]);

  if (!event) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-3xl font-extrabold">Não encontramos esse culto</h1>
        <Link className="btn btn-primary mt-6" to="/cultos">
          Voltar aos cultos
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/cultos" className="text-sm font-bold text-primary hover:underline">
        ← Todos os cultos
      </Link>
      <header className="mt-3">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">{event.data ? formatDate(event.data) : "Sem data registrada"}</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">{event.evento}</h1>
        <p className="mt-2 text-muted">
          {event.tipo} · {tipoHint(event.fonte_tipo)}
        </p>
      </header>
      <div className="card mt-6">
        <SetList event={event} />
      </div>
    </div>
  );
}
