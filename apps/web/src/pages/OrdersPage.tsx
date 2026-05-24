import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { PageTransition } from '@/components/layout/PageTransition';
import { useOrders } from '@/features/orders/api';
import { formatDate, formatMoney } from '@/lib/format';

export function OrdersPage() {
  const orders = useOrders();
  return (
    <PageTransition>
      <h1 className="text-3xl font-bold">Your orders</h1>
      <p className="mt-1 text-sm text-ink-muted">Recent purchases on your account.</p>

      <div className="mt-6 space-y-3">
        {orders.isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          : orders.data?.items.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-ink-muted">No orders yet.</p>
                <Link to="/" className="mt-2 inline-block text-brand-600 hover:underline">
                  Start shopping →
                </Link>
              </Card>
            ) : (
              orders.data?.items.map((o) => (
                <Link key={o.id} to={`/account/orders/${o.id}`}>
                  <Card className="flex items-center justify-between p-5 transition hover:shadow-lg">
                    <div>
                      <p className="text-xs uppercase text-ink-subtle">Order</p>
                      <p className="text-sm font-semibold">#{o.id.slice(0, 8)}</p>
                      <p className="mt-1 text-xs text-ink-muted">{formatDate(o.createdAt)} · {o.items.length} item{o.items.length === 1 ? '' : 's'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge tone={o.status === 'PAID' ? 'success' : o.status === 'CANCELLED' ? 'danger' : 'neutral'}>
                        {o.status}
                      </Badge>
                      <span className="font-semibold">
                        {formatMoney(o.totalCents, o.currency)}
                      </span>
                    </div>
                  </Card>
                </Link>
              ))
            )}
      </div>
    </PageTransition>
  );
}
