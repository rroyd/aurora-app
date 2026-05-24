import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ProductImage } from '@/components/ui/ProductImage';
import { Skeleton } from '@/components/ui/Skeleton';
import { PageTransition } from '@/components/layout/PageTransition';
import { useOrder } from '@/features/orders/api';
import { formatDate, formatMoney } from '@/lib/format';

export function OrderDetailPage() {
  const { orderId = '' } = useParams();
  const order = useOrder(orderId);

  if (order.isLoading) {
    return (
      <PageTransition>
        <Skeleton className="h-24" />
      </PageTransition>
    );
  }
  if (!order.data) {
    return (
      <PageTransition>
        <p>Order not found.</p>
      </PageTransition>
    );
  }
  const o = order.data;
  return (
    <PageTransition>
      <Link to="/account/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Back to orders
      </Link>

      <Card className="p-6">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          <div>
            <h1 className="text-2xl font-bold">Order #{o.id.slice(0, 8)}</h1>
            <p className="text-sm text-ink-muted">
              Placed {formatDate(o.createdAt)} · <Badge tone={o.status === 'PAID' ? 'success' : 'neutral'}>{o.status}</Badge>
            </p>
          </div>
        </div>

        <ul className="mt-6 divide-y divide-slate-100">
          {o.items.map((i) => (
            <li key={i.id} className="flex items-center gap-3 py-3">
              <ProductImage
                src={i.imageUrl}
                alt={i.nameSnapshot}
                className="h-14 w-14 rounded object-cover"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{i.nameSnapshot}</p>
                <p className="text-xs text-ink-muted">Qty {i.quantity}</p>
              </div>
              <p className="text-sm">
                {formatMoney(i.priceCentsSnapshot * i.quantity, o.currency)}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-4 space-y-1 border-t border-slate-100 pt-4 text-sm">
          <Row label="Subtotal" value={formatMoney(o.subtotalCents, o.currency)} />
          <Row label="Shipping" value={o.shippingCents === 0 ? 'Free' : formatMoney(o.shippingCents, o.currency)} />
          <Row label="Tax" value={formatMoney(o.taxCents, o.currency)} />
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-base font-semibold">
            <span>Total</span>
            <span>{formatMoney(o.totalCents, o.currency)}</span>
          </div>
        </div>

        {o.paymentLast4 ? (
          <p className="mt-4 text-xs text-ink-muted">Paid with card ending in {o.paymentLast4}</p>
        ) : null}
      </Card>
    </PageTransition>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-muted">{label}</span>
      <span>{value}</span>
    </div>
  );
}
