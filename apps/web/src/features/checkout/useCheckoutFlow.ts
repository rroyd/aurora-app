import { useNavigate } from 'react-router-dom';
import type { Address, CardInput } from '@shared/contracts';
import { useToast } from '@/components/ui/Toast';
import { usePlaceOrder } from '@/features/orders/api';
import { ApiError } from '@/lib/api';

export function useCheckoutFlow() {
  const navigate = useNavigate();
  const toast = useToast();
  const placeOrder = usePlaceOrder();

  async function submit(address: Address, card: CardInput) {
    try {
      const order = await placeOrder.mutateAsync({ shippingAddress: address, card });
      toast.success('Order placed', `#${order.id.slice(0, 8)}`);
      navigate(`/account/orders/${order.id}`);
    } catch (e) {
      if (e instanceof ApiError) toast.error('Payment failed', e.message);
      else toast.error('Could not place order');
    }
  }

  return {
    submit,
    isPending: placeOrder.isPending,
  };
}
