"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { addPackQuantity } from "@/lib/store-cart";
import { formatArs, isStorePack, STORE_PACKS, TIER_LABELS, type StorePack } from "@/lib/store-pricing";

const FULFILLMENT = ["recibido", "preparando", "enviado", "entregado"] as const;
type Fulfillment = (typeof FULFILLMENT)[number];
const FULFILLMENT_LABELS: Record<Fulfillment, string> = {
  recibido: "Recibido",
  preparando: "En preparación",
  enviado: "Enviado",
  entregado: "Entregado",
};

type StoreOrder = {
  id: string;
  createdAt: string;
  buyer: { name: string; email: string; phone: string };
  shipping: { street: string; city: string; state: string; zip: string };
  quantity: number;
  unit: number;
  total: number;
  fulfillment: Fulfillment;
};

type Desk = {
  canManage: boolean;
  packs: StorePack[];
  units: number[] | null;
  orders: StoreOrder[] | null;
};

export function PanelStore() {
  const [desk, setDesk] = useState<Desk | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [units, setUnits] = useState<string[]>([]);
  const [savingPrices, setSavingPrices] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  async function load() {
    const res = await fetch("/api/store/desk");
    const data = (await res.json()) as Desk & { error?: string };
    if (!res.ok) throw new Error(data.error || "No se pudo abrir la tienda");
    const packs = Array.isArray(data.packs) ? data.packs.filter(isStorePack) : [];
    setDesk({ ...data, packs: packs.length ? packs : STORE_PACKS });
    setUnits((data.units || []).map(String));
  }

  useEffect(() => {
    load().catch((reason: Error) => setError(reason.message));
  }, []);

  const order = desk?.orders?.find((item) => item.id === selected) || null;

  return (
    <div className="stack">
      <div>
        <h1 className="page-title">Tienda online</h1>
        <p className="page-lead muted">
          Carteles NFC + QR por cantidad. El precio unitario y el total salen de una sola tarifa, la de la cantidad elegida.
        </p>
      </div>

      {error ? <p className="store-note">{error}</p> : null}
      {!desk && !error ? <p className="muted">Cargando la tienda...</p> : null}
      {notice ? <p className="store-note">{notice}</p> : null}

      {desk ? (
        <>
          <div className="toolbar">
            <Link className="btn" href="/#tienda">Ver la tienda pública</Link>
            <Link className="btn secondary" href="/carrito">Ver carrito</Link>
          </div>
          {desk.packs.length === 0 ? (
            <div className="empty-state card-panel">
              <strong>No hay productos para mostrar</strong>
              <p className="muted">Los precios de la tienda no se pudieron armar.</p>
            </div>
          ) : (
            <div className="store-grid">
              {desk.packs.map((pack) => (
                <article key={pack.id} className="store-card">
                  {pack.wholesale ? <span className="store-badge">Precio mayorista</span> : <span className="store-badge quiet">Precio minorista</span>}
                  <h3>{pack.name}</h3>
                  <p className="store-unit">{formatArs(pack.unit)} <small>c/u</small></p>
                  <p className="store-total">{pack.total ? `Total: ${formatArs(pack.total)}` : "Elegí de 1 a 4 en el carrito"}</p>
                  <img src="/store/hero-posters.jpg" alt="" />
                  <button
                    className="btn"
                    type="button"
                    onClick={() => {
                      const quantity = addPackQuantity(pack.quantity);
                      setNotice(quantity ? `Carrito actualizado: ${quantity} cartel${quantity === 1 ? "" : "es"}.` : "No se pudo agregar.");
                    }}
                  >
                    {pack.wholesale ? "Comprar pack" : "Comprar ahora"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </>
      ) : null}

      {desk?.canManage && units.length === TIER_LABELS.length ? (
        <section className="card-panel stack">
          <h2 style={{ margin: 0 }}>Precios</h2>
          <p className="muted" style={{ margin: 0 }}>
            Cada tramo reemplaza al anterior. No se suman dos tarifas. Los importes son pesos argentinos por cartel.
          </p>
          <form
            className="stack"
            onSubmit={async (event) => {
              event.preventDefault();
              setSavingPrices(true);
              setError("");
              try {
                const res = await fetch("/api/store/prices", {
                  method: "PUT",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ units: units.map(Number) }),
                });
                const data = (await res.json()) as { error?: string };
                if (!res.ok) throw new Error(data.error || "No se pudieron guardar los precios");
                await load();
                setNotice("Precios guardados. La tienda pública ya usa estos importes.");
              } catch (reason) {
                setError(reason instanceof Error ? reason.message : "No se pudieron guardar los precios");
              } finally {
                setSavingPrices(false);
              }
            }}
          >
            {TIER_LABELS.map((label, index) => (
              <label className="label" key={label}>
                {label}
                <input
                  className="input"
                  inputMode="numeric"
                  value={units[index]}
                  onChange={(event) => {
                    const next = [...units];
                    next[index] = event.target.value.replace(/[^\d]/g, "");
                    setUnits(next);
                  }}
                />
              </label>
            ))}
            <button className="btn" type="submit" disabled={savingPrices}>
              {savingPrices ? "Guardando precios..." : "Guardar precios"}
            </button>
          </form>
        </section>
      ) : null}

      {desk?.canManage ? (
        <section className="card-panel stack">
          <h2 style={{ margin: 0 }}>Pedidos</h2>
          <p className="muted" style={{ margin: 0 }}>
            El pago figura como sin confirmar: no hay un proveedor de cobros conectado.
          </p>
          {desk.orders && desk.orders.length === 0 ? (
            <div className="empty-state">
              <strong>Todavía no hay pedidos</strong>
            </div>
          ) : null}
          {desk.orders && desk.orders.length > 0 ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Fecha</th>
                    <th>Comprador</th>
                    <th>Cantidad</th>
                    <th>Total</th>
                    <th>Pago</th>
                    <th>Entrega</th>
                  </tr>
                </thead>
                <tbody>
                  {desk.orders.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <button className="btn secondary small" type="button" onClick={() => setSelected(item.id === selected ? null : item.id)}>
                          {item.id}
                        </button>
                      </td>
                      <td>{new Date(item.createdAt).toLocaleString("es-AR")}</td>
                      <td>{item.buyer.name}</td>
                      <td>{item.quantity}</td>
                      <td>{formatArs(item.total)}</td>
                      <td>Sin medio de pago</td>
                      <td>{FULFILLMENT_LABELS[item.fulfillment]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {order ? (
            <div className="stack">
              <h3 style={{ margin: 0 }}>{order.id}</h3>
              <p style={{ margin: 0 }}>
                {order.buyer.name} · {order.buyer.email} · {order.buyer.phone}
              </p>
              <p className="muted" style={{ margin: 0 }}>
                {order.shipping.street}, {order.shipping.city}, {order.shipping.state}, CP {order.shipping.zip}
              </p>
              <p style={{ margin: 0 }}>
                {order.quantity} × {formatArs(order.unit)} · Total {formatArs(order.total)}
              </p>
              <p style={{ margin: 0 }}>Pago: sin confirmar. Falta un proveedor de pagos.</p>
              <label className="label">
                Estado de preparación y entrega
                <select
                  className="input"
                  value={order.fulfillment}
                  onChange={async (event) => {
                    const fulfillment = event.target.value as Fulfillment;
                    setSavingOrder(true);
                    setError("");
                    try {
                      const res = await fetch(`/api/store/orders/${order.id}`, {
                        method: "PATCH",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ fulfillment }),
                      });
                      const data = (await res.json()) as { error?: string };
                      if (!res.ok) throw new Error(data.error || "No se pudo actualizar el pedido");
                      setDesk((current) => current && current.orders ? {
                        ...current,
                        orders: current.orders.map((item) => item.id === order.id ? { ...item, fulfillment } : item),
                      } : current);
                      setNotice(`Entrega de ${order.id}: ${FULFILLMENT_LABELS[fulfillment]}.`);
                    } catch (reason) {
                      setError(reason instanceof Error ? reason.message : "No se pudo actualizar el pedido");
                    } finally {
                      setSavingOrder(false);
                    }
                  }}
                  disabled={savingOrder}
                >
                  {FULFILLMENT.map((value) => (
                    <option key={value} value={value}>{FULFILLMENT_LABELS[value]}</option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
