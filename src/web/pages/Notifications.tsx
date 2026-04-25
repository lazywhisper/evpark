import { useEffect, useState } from "react";
import { Link } from "wouter";
import { fetchNotifications, type Notification } from "@/lib/api";
import { Layout } from "@/components/Layout";

export default function Notifications() {
  const [items, setItems] = useState<Notification[] | null>(null);
  useEffect(() => {
    fetchNotifications().then((r) => setItems(r.notifications));
  }, []);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">История уведомлений</h1>
      {!items ? (
        <p className="text-muted-foreground">Загрузка...</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">Пока нет уведомлений.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n.id} className="bg-card border border-border rounded p-3 text-sm flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <Link href={`/listings/${n.listingId}`} className="text-primary hover:underline font-medium truncate block">
                  {n.listingTitle ?? n.listingId}
                </Link>
                {n.listingPriceUsd != null && (
                  <span className="text-muted-foreground text-xs">${n.listingPriceUsd}</span>
                )}
              </div>
              <span className="text-muted-foreground shrink-0 text-right">
                {new Date(n.sentAt).toLocaleString("ru-BY")}
                {n.reaction === "up" && " · 👍"}
                {n.reaction === "down" && " · 👎"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Layout>
  );
}
