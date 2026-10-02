"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { CountUp, Drawer } from "@/components/ui";
import {
  DESTINATION_LABELS,
  POSTER_STATUSES,
  STATUS_LABELS,
  type DestinationType,
  type PosterStatus,
  type QrItem,
} from "@/lib/qr-store";

const DESTINATIONS = Object.entries(DESTINATION_LABELS) as [DestinationType, string][];

function destinationLabel(type?: string) {
  return DESTINATION_LABELS[(type as DestinationType) || "otro"] ?? "Otro enlace";
}

type Account = { id: string; name: string; email: string; role: "admin" | "reseller" };
type Reseller = { id: string; name: string; email: string; active: boolean };

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function publicSlug(item: QrItem) {
  return item.token || item.uniqueCode || item.id;
}

function QrPreview({ id, size = 160 }: { id: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(`${window.location.origin}/r/${id}`, { width: 220, margin: 1 }).then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);
  if (!src) return null;
  return (
    <img src={src} alt={`QR ${id}`} width={size} height={size} style={{ background: "#fff", borderRadius: 12, padding: 8, maxWidth: "100%", height: "auto" }} />
  );
}

async function downloadPng(id: string) {
  const dataUrl = await QRCode.toDataURL(`${window.location.origin}/r/${id}`, { width: 512, margin: 2 });
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `cartel-${id}.png`;
  a.click();
}

const PAGE_SIZES = [10, 25, 50, 100];

type Summary = { total: number; disponible: number; asignados: number; enUso: number; comercios: number };

const EMPTY_SUMMARY: Summary = { total: 0, disponible: 0, asignados: 0, enUso: 0, comercios: 0 };

function toast(message: string, tone: "ok" | "danger" | "warn" = "ok") {
  window.dispatchEvent(new CustomEvent("nfs-toast", { detail: { message, tone } }));
}

export function QrBoard({ ownerId }: { ownerId?: string }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [items, setItems] = useState<QrItem[]>([]);
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [urlFilter, setUrlFilter] = useState<string>("todos");
  const [count, setCount] = useState(10);
  const [selected, setSelected] = useState<string[]>([]);
  const [resellerId, setResellerId] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState("newest");
  const [resellerFilter, setResellerFilter] = useState("");
  const [commerce, setCommerce] = useState("");
  const [codeLookup, setCodeLookup] = useState("");
  const [total, setTotal] = useState(0);
  const [availableCount, setAvailableCount] = useState(0);
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY);
  const [creating, setCreating] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<PosterStatus>("asignado");
  const [reload, setReload] = useState(0);

  async function load() {
    const meRes = await fetch("/api/me");
    if (!meRes.ok) throw new Error("No se pudieron cargar los carteles");
    const me = (await meRes.json()) as Account;
    setAccount(me);
    if (me.role === "admin") {
      const usersRes = await fetch("/api/resellers");
      if (usersRes.ok) setResellers((await usersRes.json()) as Reseller[]);
    }
    if (me.role === "admin" && !ownerId) {
      setReload((value) => value + 1);
      return;
    }
    const qrRes = await fetch(ownerId ? `/api/qrs?ownerId=${encodeURIComponent(ownerId)}` : "/api/qrs");
    if (!qrRes.ok) throw new Error("No se pudieron cargar los carteles");
    setItems((await qrRes.json()) as QrItem[]);
  }

  useEffect(() => {
    load()
      .catch((e: Error) => setError(e.message))
      .finally(() => setReady(true));
  }, [ownerId]);

  useEffect(() => {
    if (!ready || account?.role !== "admin" || ownerId) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const params = new URLSearchParams({
        view: "page",
        page: String(page),
        pageSize: String(pageSize),
        q: query,
        group: statusFilter,
        sort,
        reseller: resellerFilter,
        commerce,
        code: codeLookup,
      });
      fetch(`/api/qrs?${params}`, { signal: controller.signal })
        .then(async (res) => {
          if (!res.ok) throw new Error("No se pudieron cargar los carteles");
          return (await res.json()) as {
            items: QrItem[];
            total: number;
            page: number;
            availableCount: number;
            summary?: Summary;
          };
        })
        .then((data) => {
          setItems(data.items);
          setTotal(data.total);
          setAvailableCount(data.availableCount);
          if (data.summary) setSummary(data.summary);
          if (data.page !== page) setPage(data.page);
        })
        .catch((e: Error) => {
          if (e.name !== "AbortError") setError(e.message);
        });
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [ready, account?.role, ownerId, page, pageSize, query, statusFilter, sort, resellerFilter, commerce, codeLookup, reload]);

  useEffect(() => {
    if (error) toast(error, "danger");
  }, [error]);

  useEffect(() => {
    const pending = window.sessionStorage.getItem("nfs-q");
    if (!pending || ownerId) return;
    window.sessionStorage.removeItem("nfs-q");
    setQuery(pending);
    setPage(1);
  }, [ownerId]);

  useEffect(() => {
    if (!ready) return;
    const id = window.location.hash.replace("#", "");
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, [ready, items.length]);

  useEffect(() => {
    function onSearch(event: Event) {
      const value = String((event as CustomEvent<string>).detail ?? "");
      setCodeLookup("");
      setQuery(value);
      setPage(1);
    }
    window.addEventListener("nfs-search", onSearch);
    return () => window.removeEventListener("nfs-search", onSearch);
  }, []);

  const admin = account?.role === "admin";
  const inventory = Boolean(admin && !ownerId);
  const visible = items.filter((item) => {
    const text = `${item.cartelId || ""} ${item.uniqueCode || item.id} ${item.title} ${item.ownerName || ""}`.toLowerCase();
    if (query.trim() && !text.includes(query.trim().toLowerCase())) return false;
    if (statusFilter !== "todos" && item.status !== statusFilter) return false;
    if (urlFilter === "con" && !item.url) return false;
    if (urlFilter === "sin" && item.url) return false;
    if (ownerId && item.ownerId !== ownerId) return false;
    return true;
  });

  async function patch(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/qrs/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) {
      setError(data?.error ?? "No se pudo guardar");
      return;
    }
    setError(null);
    toast("Cambios guardados");
    await load();
  }

  if (!ready) {
    return (
      <div className="stack" aria-busy="true" aria-label="Cargando carteles">
        <div className="skeleton" style={{ width: "12rem", height: "1.8rem" }} />
        <div className="stat-grid">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="skeleton lg" />
          ))}
        </div>
        <div className="skeleton lg" />
      </div>
    );
  }

  const boardSummary: Summary = inventory
    ? summary
    : {
        total: items.length,
        disponible: items.filter((item) => item.status === "disponible").length,
        asignados: items.filter((item) => ["asignado", "enviado", "recibido"].includes(item.status || "")).length,
        enUso: items.filter((item) => ["configurando", "vendido", "activo"].includes(item.status || "")).length,
        comercios: new Set(items.map((item) => item.title.trim()).filter(Boolean)).size,
      };
  const openItem = items.find((item) => item.id === openId) ?? null;

  return (
    <div className="stack" style={{ gap: "1.5rem" }}>
      <div>
        <h1 className="page-title">{admin && !ownerId ? "Panel" : admin ? "Carteles del revendedor" : `Hola, ${account?.name}`}</h1>
        <p className="page-lead muted">
          {admin
            ? "Cada cartel tiene un QR permanente. Asignalo a un revendedor; el destino se configura después."
            : "Configurá el destino de los carteles que te asignaron. El QR impreso no cambia."}
        </p>
      </div>
      <Stats summary={boardSummary} resellers={inventory ? resellers.length : undefined} />

      {admin && !ownerId ? (
        <form
          id="crear"
          className="card-panel stack"
          onSubmit={async (e) => {
            e.preventDefault();
            setCreating(true);
            const res = await fetch("/api/qrs", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ count }),
            });
            const data = (await res.json().catch(() => null)) as { error?: string } | null;
            setCreating(false);
            if (!res.ok) {
              setError(data?.error ?? "No se pudieron crear");
              return;
            }
            setError(null);
            toast("Carteles creados correctamente");
            await load();
          }}
        >
          <h2 style={{ marginTop: 0 }}>Crear carteles</h2>
          <label className="label">
            Cantidad
            <input className="input" type="number" min={1} max={100} value={count} onChange={(e) => setCount(Number(e.target.value))} />
          </label>
          <button className="btn" type="submit" disabled={creating} aria-busy={creating}>
            Crear cartel
          </button>
        </form>
      ) : null}

      {inventory ? (
        <AdminInventory
          items={items}
          resellers={resellers}
          query={query}
          setQuery={(value) => {
            setQuery(value);
            setPage(1);
          }}
          statusFilter={statusFilter}
          setStatusFilter={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
          sort={sort}
          setSort={(value) => {
            setSort(value);
            setPage(1);
          }}
          resellerFilter={resellerFilter}
          setResellerFilter={(value) => {
            setResellerFilter(value);
            setPage(1);
          }}
          commerce={commerce}
          setCommerce={(value) => {
            setCommerce(value);
            setPage(1);
          }}
          page={page}
          setPage={setPage}
          pageSize={pageSize}
          setPageSize={(value) => {
            setPageSize(value);
            setPage(1);
          }}
          total={total}
          availableCount={availableCount}
          selected={selected}
          setSelected={setSelected}
          resellerId={resellerId}
          setResellerId={setResellerId}
          bulkStatus={bulkStatus}
          setBulkStatus={setBulkStatus}
          openId={openId}
          setOpenId={setOpenId}
          codeLookup={codeLookup}
          setCodeLookup={(value) => {
            setCodeLookup(value);
            setPage(1);
          }}
          onAssign={async () => {
            const res = await fetch("/api/qrs/assign", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ resellerId, ids: selected }),
            });
            const data = (await res.json().catch(() => null)) as { error?: string; assigned?: number } | null;
            if (!res.ok) {
              setError(data?.error ?? "No se pudo asignar");
              return;
            }
            if (!data?.assigned) {
              setError("Solo se asignan carteles en estado Disponible.");
              return;
            }
            setSelected([]);
            if (data.assigned < selected.length) {
              setError(`Se asignaron ${data.assigned} de ${selected.length}. Solo entran los que están disponibles.`);
            } else {
              setError(null);
              toast("QR asignado correctamente");
            }
            await load();
          }}
          onBulkStatus={async () => {
            for (const id of selected) {
              const res = await fetch(`/api/qrs/${id}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ status: bulkStatus }),
              });
              if (!res.ok) {
                setError("No se pudo cambiar el estado");
                return;
              }
            }
            setSelected([]);
            setError(null);
            toast("Estado actualizado");
            await load();
          }}
          onBulkDelete={async () => {
            if (!window.confirm(`¿Seguro que querés eliminar ${selected.length} cartel${selected.length === 1 ? "" : "es"}? Los QR dejarán de funcionar.`)) return;
            for (const id of selected) {
              const res = await fetch(`/api/qrs/${id}`, { method: "DELETE" });
              if (!res.ok) {
                setError("No se pudo eliminar");
                return;
              }
            }
            setSelected([]);
            setError(null);
            toast("Carteles eliminados");
            await load();
          }}
          onDelete={async (item: QrItem) => {
            const label = item.cartelId || item.uniqueCode || item.id;
            if (!window.confirm(`¿Seguro que querés eliminar ${label}? El QR dejará de funcionar.`)) return;
            const res = await fetch(`/api/qrs/${item.id}`, { method: "DELETE" });
            const data = (await res.json().catch(() => null)) as { error?: string } | null;
            if (!res.ok) {
              setError(data?.error ?? "No se pudo eliminar");
              return;
            }
            setSelected((current) => current.filter((id) => id !== item.id));
            setError(null);
            toast("Cartel eliminado");
            await load();
          }}
          onSave={(id, body) => patch(id, body)}
        />
      ) : null}

      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}

      {!inventory ? (
      <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
        <label className="label">
          Buscar
          <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Código, comercio o revendedor" />
        </label>
        {admin ? (
          <label className="label">
            Estado
            <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="todos">Todos</option>
              {POSTER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {admin ? (
          <label className="label">
            Destino
            <select className="input" value={urlFilter} onChange={(e) => setUrlFilter(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="con">Con URL</option>
              <option value="sin">Sin URL</option>
            </select>
          </label>
        ) : null}
      </div>

      <div className="stack">
        {visible.length === 0 ? <p className="muted">No hay carteles para mostrar.</p> : null}
        {visible.map((item) => {
          const code = item.uniqueCode || item.id;
          const slug = publicSlug(item);
          const editing = openId === item.id;
          return (
            <article key={item.id} className="card-panel" style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <QrPreview id={slug} />
              <div className="stack" style={{ flex: "1 1 240px" }}>
                <div>
                  <strong>{item.cartelId || item.id}</strong>
                  <p className="muted" style={{ margin: "0.25rem 0 0" }}>
                    {code} · {STATUS_LABELS[item.status || "disponible"]}
                    {item.ownerName ? ` · ${item.ownerName}` : ""}
                    {item.title ? ` · ${item.title}` : ""}
                  </p>
                  <p className="muted" style={{ margin: "0.25rem 0 0" }}>
                    Destino: {item.url || "sin configurar"}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {item.url ? (
                    <a className="btn secondary" href={`/r/${slug}`} target="_blank" rel="noreferrer">
                      Probar
                    </a>
                  ) : null}
                  <button className="btn" type="button" onClick={() => downloadPng(slug)}>
                    Descargar PNG
                  </button>
                  <button className="btn secondary" type="button" onClick={() => setOpenId(editing ? null : item.id)}>
                    {editing ? "Cerrar" : "Configurar"}
                  </button>
                  {admin ? (
                    <button
                      className="btn secondary"
                      type="button"
                      onClick={async () => {
                        const label = item.cartelId || code;
                        if (!window.confirm(`¿Seguro que querés eliminar ${label}? El QR dejará de funcionar.`)) return;
                        const res = await fetch(`/api/qrs/${item.id}`, { method: "DELETE" });
                        const data = (await res.json().catch(() => null)) as { error?: string } | null;
                        if (!res.ok) {
                          setError(data?.error ?? "No se pudo eliminar");
                          return;
                        }
                        setSelected((current) => current.filter((id) => id !== item.id));
                        setError(null);
                        toast("Cartel eliminado");
                        await load();
                      }}
                    >
                      Eliminar
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      </>
      ) : null}
      {!inventory && openItem ? (
        <Drawer open title={openItem.cartelId || openItem.uniqueCode || "Cartel"} onClose={() => setOpenId(null)}>
          <PosterForm key={openItem.updatedAt || openItem.id} item={openItem} admin={Boolean(admin)} onSave={(body) => patch(openItem.id, body)} />
        </Drawer>
      ) : null}
    </div>
  );
}

function formatCreated(value?: string) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return date.toLocaleDateString("es-AR");
}

function AdminInventory({
  items,
  resellers,
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  sort,
  setSort,
  resellerFilter,
  setResellerFilter,
  commerce,
  setCommerce,
  page,
  setPage,
  pageSize,
  setPageSize,
  total,
  availableCount,
  selected,
  setSelected,
  resellerId,
  setResellerId,
  bulkStatus,
  setBulkStatus,
  openId,
  setOpenId,
  codeLookup,
  setCodeLookup,
  onAssign,
  onBulkStatus,
  onBulkDelete,
  onDelete,
  onSave,
}: {
  items: QrItem[];
  resellers: Reseller[];
  query: string;
  setQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  sort: string;
  setSort: (value: string) => void;
  resellerFilter: string;
  setResellerFilter: (value: string) => void;
  commerce: string;
  setCommerce: (value: string) => void;
  page: number;
  setPage: (value: number) => void;
  pageSize: number;
  setPageSize: (value: number) => void;
  total: number;
  availableCount: number;
  selected: string[];
  setSelected: (value: string[] | ((current: string[]) => string[])) => void;
  resellerId: string;
  setResellerId: (value: string) => void;
  bulkStatus: PosterStatus;
  setBulkStatus: (value: PosterStatus) => void;
  openId: string | null;
  setOpenId: (value: string | null) => void;
  codeLookup: string;
  setCodeLookup: (value: string) => void;
  onAssign: () => Promise<void>;
  onBulkStatus: () => Promise<void>;
  onBulkDelete: () => Promise<void>;
  onDelete: (item: QrItem) => Promise<void>;
  onSave: (id: string, body: Record<string, unknown>) => Promise<void>;
}) {
  const [codeDraft, setCodeDraft] = useState(codeLookup);
  const [working, setWorking] = useState(false);
  const pageIds = items.map((item) => item.id);
  const editingItem = items.find((item) => item.id === openId) ?? null;
  async function run(task: () => Promise<void>) {
    setWorking(true);
    try {
      await task();
    } finally {
      setWorking(false);
    }
  }
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <div id="asignar" className="card-panel stack">
        <h2 style={{ marginTop: 0 }}>Asignar stock</h2>
        {availableCount === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            No hay carteles disponibles para asignar.
          </p>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            Hay {availableCount.toLocaleString("es-AR")} disponibles. Elegilos en la cuadrícula y asignalos a un revendedor.
          </p>
        )}
        <label className="label">
          Revendedor
          <select className="input" value={resellerId} onChange={(e) => setResellerId(e.target.value)}>
            <option value="">Elegir</option>
            {resellers
              .filter((user) => user.active)
              .map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} · {user.email}
                </option>
              ))}
          </select>
        </label>
        <button className="btn" type="button" disabled={working || selected.length === 0 || !resellerId} aria-busy={working} onClick={() => void run(onAssign)}>
          Asignar {selected.length} cartel{selected.length === 1 ? "" : "es"}
        </button>
      </div>

      <form
        className="card-panel"
        style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "end" }}
        onSubmit={(e) => {
          e.preventDefault();
          setQuery("");
          setCodeLookup(codeDraft.trim());
        }}
      >
        <label className="label" style={{ flex: "1 1 220px", margin: 0 }}>
          Buscar QR por código
          <input
            className="input"
            value={codeDraft}
            onChange={(e) => setCodeDraft(e.target.value)}
            placeholder="CARTEL-000582 o el código único"
          />
        </label>
        <button className="btn" type="submit">
          Abrir
        </button>
        {codeLookup ? (
          <button
            className="btn secondary"
            type="button"
            onClick={() => {
              setCodeDraft("");
              setCodeLookup("");
            }}
          >
            Ver todos
          </button>
        ) : null}
      </form>

      <div id="filtros" className="filters">
        <label className="label">
          Buscar
          <input
            className="input"
            value={query}
            onChange={(e) => {
              setCodeLookup("");
              setCodeDraft("");
              setQuery(e.target.value);
            }}
            placeholder="ID, código, comercio, revendedor o URL"
          />
        </label>
        <label className="label">
          Estado
          <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="disponibles">Disponibles</option>
            <option value="asignados">Asignados</option>
            <option value="en-uso">En uso</option>
            <option value="sin-asignar">Sin asignar</option>
            {POSTER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
        <label className="label">
          Revendedor
          <select className="input" value={resellerFilter} onChange={(e) => setResellerFilter(e.target.value)}>
            <option value="">Todos</option>
            {resellers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </label>
        <label className="label">
          Comercio
          <input className="input" value={commerce} onChange={(e) => setCommerce(e.target.value)} placeholder="Nombre del comercio" />
        </label>
        <label className="label">
          Orden
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Más nuevos</option>
            <option value="oldest">Más antiguos</option>
            <option value="id-asc">ID ascendente</option>
            <option value="id-desc">ID descendente</option>
            <option value="disponible-first">Disponibles primero</option>
            <option value="asignado-first">Asignados primero</option>
          </select>
        </label>
        <label className="label">
          Por página
          <select className="input" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <button
          className="btn secondary"
          type="button"
          onClick={() => setSelected((current) => [...new Set([...current, ...pageIds])])}
        >
          Seleccionar todos los de esta página
        </button>
        <button className="btn secondary" type="button" onClick={() => setSelected([])}>
          Deseleccionar todos
        </button>
        <span className="muted">{selected.length} seleccionados</span>
      </div>

      {selected.length > 0 ? (
        <div className="bulk-bar card-panel">
          <label className="label" style={{ margin: 0 }}>
            Cambiar estado
            <select className="input" value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as PosterStatus)}>
              {POSTER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>
          <button className="btn secondary" type="button" disabled={working} aria-busy={working} onClick={() => void run(onBulkStatus)}>
            Aplicar estado
          </button>
          <button className="btn danger" type="button" disabled={working} aria-busy={working} onClick={() => void run(onBulkDelete)}>
            Eliminar selección
          </button>
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="empty-state card-panel">
          <h2>{codeLookup ? "No encontramos ese QR" : "No hay QR para mostrar"}</h2>
          <p className="muted">Probá modificar los filtros o generar un nuevo QR.</p>
        </div>
      ) : null}
      <div id="carteles" className="qr-admin-grid">
        {items.map((item) => {
          const code = item.uniqueCode || item.id;
          const slug = publicSlug(item);
          const editing = openId === item.id;
          return (
            <article key={item.id} className="card-panel interactive qr-card stack" style={{ margin: 0 }}>
              <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={selected.includes(item.id)}
                  onChange={(e) =>
                    setSelected((current) =>
                      e.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id),
                    )
                  }
                />
                <strong>{item.cartelId || item.id}</strong>
              </label>
              <QrPreview id={slug} size={120} />
              <p className="muted" style={{ margin: 0 }}>
                {code}
              </p>
              <p style={{ margin: 0 }}>
                <span className={`status-pill status-${item.status || "disponible"}`}>{STATUS_LABELS[item.status || "disponible"]}</span>
              </p>
              <p className="muted" style={{ margin: 0 }}>
                {item.title || "Sin comercio"}
              </p>
              <p className="muted" style={{ margin: 0 }}>
                {item.status === "disponible" ? "Sin revendedor" : item.ownerName || "Sin revendedor"}
              </p>
              <p className="muted" style={{ margin: 0 }}>
                {formatCreated(item.createdAt)}
              </p>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {item.url ? (
                  <a className="btn secondary" href={`/r/${slug}`} target="_blank" rel="noreferrer">
                    Probar
                  </a>
                ) : null}
                <button className="btn" type="button" onClick={() => downloadPng(slug)}>
                  PNG
                </button>
                <button className="btn secondary" type="button" onClick={() => setOpenId(editing ? null : item.id)}>
                  {editing ? "Cerrar" : "Configurar"}
                </button>
                <button className="btn secondary" type="button" onClick={() => void onDelete(item)}>
                  Eliminar
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <Drawer open={Boolean(editingItem)} title={editingItem?.cartelId || editingItem?.uniqueCode || "Cartel"} onClose={() => setOpenId(null)}>
        {editingItem ? (
          <PosterForm key={editingItem.updatedAt || editingItem.id} item={editingItem} admin onSave={(body) => onSave(editingItem.id, body)} />
        ) : null}
      </Drawer>
      <div className="pager">
        <p className="muted" style={{ margin: 0 }}>
          Mostrando {from.toLocaleString("es-AR")}–{to.toLocaleString("es-AR")} de {total.toLocaleString("es-AR")} QR
        </p>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button className="btn secondary" type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Página anterior
          </button>
          <span>
            {page} / {pages}
          </span>
          <button className="btn secondary" type="button" disabled={page >= pages} onClick={() => setPage(page + 1)}>
            Página siguiente
          </button>
        </div>
      </div>
    </>
  );
}

function PosterForm({
  item,
  admin,
  onSave,
}: {
  item: QrItem;
  admin: boolean;
  onSave: (body: Record<string, unknown>) => Promise<void>;
}) {
  const [title, setTitle] = useState(item.title);
  const [url, setUrl] = useState(item.url);
  const [destinationType, setDestinationType] = useState<DestinationType>(item.destinationType || "google");
  const [status, setStatus] = useState<PosterStatus>(item.status || "disponible");

  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!isHttpUrl(url.trim())) return;
        await onSave({ title, url, destinationType, ...(admin ? { status } : {}) });
      }}
    >
      <p className="muted" style={{ margin: 0 }}>
        URL del QR: /r/{item.token || item.uniqueCode || item.id}
      </p>
      <label className="label">
        Comercio
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nombre del comercio" />
      </label>
      <label className="label">
        Tipo de destino
        <select className="input" value={destinationType} onChange={(e) => setDestinationType(e.target.value as DestinationType)}>
          {DESTINATIONS.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="label">
        URL de destino
        <input className="input" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." required />
      </label>
      {admin ? (
        <label className="label">
          Estado
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value as PosterStatus)}>
            {POSTER_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button className="btn" type="submit">
          Guardar cambios
        </button>
        {!admin ? (
          <button className="btn secondary" type="button" onClick={() => onSave({ title, url, destinationType, sale: true })}>
            Registrar venta
          </button>
        ) : null}
      </div>
      {item.history && item.history.length > 0 ? (
        <div className="stack">
          <strong>Historial</strong>
          {item.history.map((change) => (
            <p key={`${change.at}-${change.to}`} className="muted" style={{ margin: 0 }}>
              {new Date(change.at).toLocaleString("es-AR")} · {change.from || "vacío"} → {change.to || "vacío"} · {change.byName}
              {admin && change.from ? (
                <>
                  {" "}
                  <button className="btn secondary" type="button" onClick={() => onSave({ restoreUrl: change.from })}>
                    Restaurar
                  </button>
                </>
              ) : null}
            </p>
          ))}
        </div>
      ) : null}
    </form>
  );
}

function Stats({ summary, resellers }: { summary: Summary; resellers?: number }) {
  const cards = [
    { label: "Total de QR", value: summary.total, hint: "En el inventario" },
    { label: "Disponibles", value: summary.disponible, hint: "Listos para asignar" },
    { label: "Asignados", value: summary.asignados, hint: "Con revendedor" },
    { label: "En uso", value: summary.enUso, hint: "Configurados o vendidos" },
  ];
  if (resellers !== undefined) {
    cards.push({ label: "Revendedores", value: resellers, hint: "Cuentas creadas" });
    cards.push({ label: "Comercios", value: summary.comercios, hint: "Con nombre cargado" });
  }
  return (
    <section className="stat-grid" aria-label="Resumen">
      {cards.map((card) => (
        <article key={card.label} className="card-panel interactive stat-card">
          <span className="stat-icon" aria-hidden>
            {card.label.slice(0, 1)}
          </span>
          <div className="stat-value">
            <CountUp value={card.value} />
          </div>
          <div className="stat-label">{card.label}</div>
          <p className="muted" style={{ margin: 0, fontSize: "0.78rem" }}>
            {card.hint}
          </p>
        </article>
      ))}
    </section>
  );
}
