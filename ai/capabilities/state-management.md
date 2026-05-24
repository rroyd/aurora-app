# Capability — State Management

## Server State: TanStack Query

- One `QueryClient` configured in `lib/queryClient.ts`. Defaults:
  - `staleTime: 30_000`
  - `retry: 1` (auth errors are not retried)
  - `refetchOnWindowFocus: false` (catalog), `true` for cart / orders.
- Query keys: stable, hierarchical. Helpers in each feature's `api.ts`:

```ts
export const productsKeys = {
  all: ['products'] as const,
  list: (filters: ProductFilters) => [...productsKeys.all, 'list', filters] as const,
  detail: (slug: string) => [...productsKeys.all, 'detail', slug] as const,
};
```

- Mutations invalidate the keys they affect:
  - `addToCart` → invalidate `cartKeys.detail()`.
  - `placeOrder` → invalidate `cartKeys.detail()` + `ordersKeys.list()`.

## Client UI State: Zustand

Stores live under `src/stores/`. Each store is a single slice with a focused purpose.

```ts
// stores/cart-drawer.store.ts
type CartDrawerStore = {
  isOpen: boolean;
  open(): void;
  close(): void;
  toggle(): void;
};
export const useCartDrawer = create<CartDrawerStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
}));
```

### Guest Cart (persisted)

```ts
// stores/guest-cart.store.ts
const useGuestCart = create<GuestCartStore>()(
  persist(
    (set) => ({ items: [], add: (item) => …, remove: (id) => …, clear: () => set({ items: [] }) }),
    { name: 'guest-cart', version: 1 },
  ),
);
```

When the user logs in, the cart sync hook merges the guest cart into the server cart, then clears `guest-cart`.

## URL State: Search Params

Filters / pagination / search-query live in the URL so pages are linkable and refresh-safe:

```ts
const [params, setParams] = useSearchParams();
const filters = useMemo(() => parseFilters(params), [params]);
```

## Form State: react-hook-form

- All forms use `useForm({ resolver: zodResolver(schema) })`.
- Don't lift form state into Zustand or the URL — it's transient.

## Auth State

The `useAuth` hook is the only public surface. Underneath:

- TanStack Query stores `me` under key `['auth','me']`.
- A `useEffect` in the root subscribes to 401 errors via a global `apiClient` interceptor and triggers a silent refresh.
