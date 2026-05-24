import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import {
  addressSchema,
  cardSchema,
  type Address,
  type CardInput,
} from '@shared/contracts';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ProductImage } from '@/components/ui/ProductImage';
import { useToast } from '@/components/ui/Toast';
import { PageTransition } from '@/components/layout/PageTransition';
import { useAuth } from '@/features/auth/useAuth';
import { useUnifiedCart } from '@/features/cart/useUnifiedCart';
import { usePlaceOrder } from '@/features/orders/api';
import { ApiError } from '@/lib/api';
import { formatMoney } from '@/lib/format';

const STEPS = ['Shipping', 'Payment', 'Review'] as const;
type Step = (typeof STEPS)[number];

export function CheckoutPage() {
  const { isAuthenticated } = useAuth();
  const cart = useUnifiedCart();
  const navigate = useNavigate();
  const toast = useToast();
  const placeOrder = usePlaceOrder();

  const [step, setStep] = useState<Step>('Shipping');
  const [address, setAddress] = useState<Address | null>(null);
  const [card, setCard] = useState<CardInput | null>(null);

  if (!isAuthenticated) {
    return (
      <PageTransition>
        <Card className="mx-auto max-w-md p-8 text-center">
          <h1 className="text-2xl font-semibold">Sign in to check out</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Your cart will be merged with your account.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/login">
              <Button>Sign in</Button>
            </Link>
            <Link to="/signup">
              <Button variant="secondary">Create account</Button>
            </Link>
          </div>
        </Card>
      </PageTransition>
    );
  }

  if (cart.items.length === 0) {
    return (
      <PageTransition>
        <Card className="mx-auto max-w-md p-8 text-center">
          <h1 className="text-2xl font-semibold">Your cart is empty</h1>
          <p className="mt-2 text-sm text-ink-muted">Add a few things first.</p>
          <Link to="/">
            <Button className="mt-6">Continue shopping</Button>
          </Link>
        </Card>
      </PageTransition>
    );
  }

  async function placeOrderNow(addr: Address, c: CardInput) {
    try {
      const order = await placeOrder.mutateAsync({ shippingAddress: addr, card: c });
      toast.success('Order placed', `#${order.id.slice(0, 8)}`);
      navigate(`/account/orders/${order.id}`);
    } catch (e) {
      if (e instanceof ApiError) toast.error('Payment failed', e.message);
      else toast.error('Could not place order');
    }
  }

  return (
    <PageTransition>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Stepper current={step} />
          <div className="mt-6">
            {step === 'Shipping' && (
              <ShippingStep
                initial={address}
                onSubmit={(a) => {
                  setAddress(a);
                  setStep('Payment');
                }}
              />
            )}
            {step === 'Payment' && (
              <PaymentStep
                initial={card}
                onBack={() => setStep('Shipping')}
                onSubmit={(c) => {
                  setCard(c);
                  setStep('Review');
                }}
              />
            )}
            {step === 'Review' && address && card && (
              <ReviewStep
                address={address}
                card={card}
                onBack={() => setStep('Payment')}
                onConfirm={() => placeOrderNow(address, card)}
                loading={placeOrder.isPending}
              />
            )}
          </div>
        </div>

        <aside className="space-y-3">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink-muted">Order summary</h2>
            <ul className="mt-3 divide-y divide-slate-100">
              {cart.items.map((i) => (
                <li key={i.productId} className="flex gap-3 py-3">
                  <ProductImage src={i.imageUrl} alt={i.name} className="h-12 w-12 rounded object-cover" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{i.name}</p>
                    <p className="text-xs text-ink-muted">Qty {i.quantity}</p>
                  </div>
                  <p className="text-sm">{formatMoney(i.priceCents * i.quantity, i.currency)}</p>
                </li>
              ))}
            </ul>
            <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm">
              <Row label="Subtotal" value={formatMoney(cart.subtotalCents, cart.currency)} />
              <Row label="Shipping" value={cart.subtotalCents >= 5000 ? 'Free' : formatMoney(799, cart.currency)} />
              <Row label="Estimated tax" value={formatMoney(Math.round(cart.subtotalCents * 0.08), cart.currency)} />
              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-base font-semibold">
                <span>Total</span>
                <span>
                  {formatMoney(
                    cart.subtotalCents +
                      (cart.subtotalCents >= 5000 ? 0 : 799) +
                      Math.round(cart.subtotalCents * 0.08),
                    cart.currency,
                  )}
                </span>
              </div>
            </div>
          </Card>
        </aside>
      </div>
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

function Stepper({ current }: { current: Step }) {
  return (
    <ol className="flex items-center gap-3">
      {STEPS.map((s, i) => {
        const reached = STEPS.indexOf(current) >= i;
        const active = current === s;
        return (
          <li key={s} className="flex flex-1 items-center gap-3">
            <div
              className={`grid h-8 w-8 place-items-center rounded-full text-xs font-semibold transition ${
                active
                  ? 'bg-brand-600 text-white'
                  : reached
                    ? 'bg-emerald-500 text-white'
                    : 'bg-surface-sunken text-ink-subtle'
              }`}
            >
              {reached && !active ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={`text-sm font-medium ${
                active ? 'text-ink' : reached ? 'text-ink-muted' : 'text-ink-subtle'
              }`}
            >
              {s}
            </span>
            {i < STEPS.length - 1 ? (
              <div
                className={`h-px flex-1 ${reached ? 'bg-emerald-300' : 'bg-slate-200'}`}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function ShippingStep({
  initial,
  onSubmit,
}: {
  initial: Address | null;
  onSubmit: (a: Address) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Address>({ resolver: zodResolver(addressSchema), defaultValues: initial ?? undefined });

  return (
    <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}>
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Shipping address</h2>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" error={errors.firstName?.message}>
              {(p) => <Input {...register('firstName')} {...p} />}
            </Field>
            <Field label="Last name" error={errors.lastName?.message}>
              {(p) => <Input {...register('lastName')} {...p} />}
            </Field>
          </div>
          <Field label="Address line 1" error={errors.line1?.message}>
            {(p) => <Input {...register('line1')} {...p} />}
          </Field>
          <Field label="Address line 2" error={errors.line2?.message}>
            {(p) => <Input {...register('line2')} {...p} />}
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="City" error={errors.city?.message}>
              {(p) => <Input {...register('city')} {...p} />}
            </Field>
            <Field label="State / Region" error={errors.region?.message}>
              {(p) => <Input {...register('region')} {...p} />}
            </Field>
            <Field label="Postal code" error={errors.postalCode?.message}>
              {(p) => <Input {...register('postalCode')} {...p} />}
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Country (ISO-2)"
              error={errors.country?.message}
              hint="e.g. US, GB, IL"
            >
              {(p) => <Input maxLength={2} {...register('country')} {...p} />}
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              {(p) => <Input type="tel" {...register('phone')} {...p} />}
            </Field>
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit">Continue to payment</Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
}

function PaymentStep({
  initial,
  onBack,
  onSubmit,
}: {
  initial: CardInput | null;
  onBack: () => void;
  onSubmit: (c: CardInput) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CardInput>({
    resolver: zodResolver(cardSchema),
    defaultValues: initial ?? { number: '4242424242424242', expMonth: 12, expYear: new Date().getFullYear() + 2, cvc: '123', holderName: '' },
  });

  return (
    <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}>
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Payment</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Test cards: 4242 4242 4242 4242 (success), 4000 0000 0000 0002 (decline).
        </p>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 space-y-3">
          <Field label="Name on card" error={errors.holderName?.message}>
            {(p) => <Input autoComplete="cc-name" {...register('holderName')} {...p} />}
          </Field>
          <Field label="Card number" error={errors.number?.message}>
            {(p) => (
              <Input
                inputMode="numeric"
                autoComplete="cc-number"
                {...register('number')}
                {...p}
              />
            )}
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Exp month" error={errors.expMonth?.message}>
              {(p) => (
                <Input
                  inputMode="numeric"
                  autoComplete="cc-exp-month"
                  {...register('expMonth', { valueAsNumber: true })}
                  {...p}
                />
              )}
            </Field>
            <Field label="Exp year" error={errors.expYear?.message}>
              {(p) => (
                <Input
                  inputMode="numeric"
                  autoComplete="cc-exp-year"
                  {...register('expYear', { valueAsNumber: true })}
                  {...p}
                />
              )}
            </Field>
            <Field label="CVC" error={errors.cvc?.message}>
              {(p) => <Input inputMode="numeric" autoComplete="cc-csc" {...register('cvc')} {...p} />}
            </Field>
          </div>
          <div className="flex justify-between pt-2">
            <Button type="button" variant="ghost" onClick={onBack}>
              Back
            </Button>
            <Button type="submit">Review order</Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
}

function ReviewStep({
  address,
  card,
  onBack,
  onConfirm,
  loading,
}: {
  address: Address;
  card: CardInput;
  onBack: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}>
      <Card className="space-y-4 p-6">
        <h2 className="text-lg font-semibold">Review and place order</h2>
        <section>
          <h3 className="text-sm font-semibold text-ink-muted">Shipping to</h3>
          <p className="mt-1 text-sm">
            {address.firstName} {address.lastName}
            <br />
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ''}
            <br />
            {address.city}, {address.region} {address.postalCode}, {address.country}
            <br />
            {address.phone}
          </p>
        </section>
        <section>
          <h3 className="text-sm font-semibold text-ink-muted">Payment</h3>
          <p className="mt-1 text-sm">
            •••• •••• •••• {card.number.replace(/\s+/g, '').slice(-4)} · {card.holderName}
          </p>
        </section>
        <div className="flex justify-between pt-2">
          <Button type="button" variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onConfirm} loading={loading}>
            Place order
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
