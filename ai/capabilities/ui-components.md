# Capability — UI Composition

## Design System

- **Tailwind CSS** (utility-first), configured with brand tokens in `tailwind.config.ts`.
- **Framer Motion** for animations (page transitions, modal/drawer entry, micro-interactions).
- **Lucide Icons** for the icon set.
- **Radix UI** primitives for accessibility (dialog, menu, popover, tooltip).
- **`clsx` + `tailwind-merge`** in a `cn()` helper.

## Design Tokens (Tailwind theme)

```ts
// tailwind.config.ts (excerpt)
colors: {
  brand: {
    50:  '#f5f3ff',
    500: '#7c3aed',  // primary
    600: '#6d28d9',
    900: '#3b0764',
  },
  surface: { DEFAULT: '#ffffff', muted: '#f8fafc', sunken: '#f1f5f9' },
  ink:     { DEFAULT: '#0f172a', muted: '#475569', subtle: '#94a3b8' },
  success: '#10b981',
  warning: '#f59e0b',
  danger:  '#ef4444',
},
borderRadius: { sm: '0.375rem', DEFAULT: '0.75rem', lg: '1rem', xl: '1.5rem' },
boxShadow:    { card: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -8px rgba(15,23,42,0.10)' },
fontFamily:   { sans: ['Inter', 'ui-sans-serif', 'system-ui'] },
```

## Primitive Components (`components/ui/`)

Each is a thin, accessible, styled primitive. Named export.

| Component         | Props (key)                          | Notes                                   |
| ----------------- | ------------------------------------ | --------------------------------------- |
| `Button`          | `variant: 'primary'\|'secondary'\|'ghost'\|'danger'`, `size`, `loading` | Disabled state, focus ring |
| `Input`           | standard `<input>` + `error?: string`| Error renders red border + helper text  |
| `Label`           | `htmlFor`                            |                                         |
| `Field`           | composes `Label + Input + error`     | Form ergonomics                         |
| `Select`          | `options: {value,label}[]`           | Radix Select                            |
| `Badge`           | `tone: 'neutral'\|'success'\|'warn'\|'danger'`|                              |
| `Card`            | `as`, `className`                    | rounded-xl, shadow-card                 |
| `Dialog`          | Radix                                | Framer-motion entry                     |
| `Sheet` (drawer)  | side, open, onOpenChange             | Cart drawer                             |
| `Skeleton`        | `className`                          | Loading placeholders                    |
| `Toast`           | provider + `useToast`                |                                         |
| `Spinner`         |                                      |                                         |

## Layout Components (`components/layout/`)

- `Header` — logo, nav, search trigger, cart icon (with count badge), account menu.
- `Footer` — links, newsletter input.
- `Container` — `max-w-7xl mx-auto px-4`.
- `PageTransition` — Framer Motion wrapper for route changes.

## Premium Touches (REQUIRED for evaluation)

- **Hero**: large gradient, animated headline, secondary CTA.
- **Product card hover**: subtle scale (1.02), shadow lift, image zoom.
- **Add-to-cart**: micro-bounce on cart icon + toast.
- **Skeletons** while loading; never bare spinners on the catalog.
- **Empty states** with illustration + CTA.
- **Sticky header** with scroll-aware shadow.
- **Dark-mode-ready** tokens (the theme defines dark variants; toggle is a nice-to-have).

## Accessibility

- Color contrast ≥ WCAG AA.
- Every interactive element keyboard-reachable. Visible focus ring.
- Forms: `<label>` linked to `<input>` via `htmlFor`/`id`. Error text linked via `aria-describedby`.
- Modals: focus trap (Radix handles this).
- Images: `alt` text always. Decorative images use `alt=""` + `aria-hidden`.

## Forms

- `react-hook-form` + `zodResolver` for client-side validation.
- Shared Zod schemas from `@shared` so client and server agree.
- Submit handler: optimistic UI optional; always reflect server error on a per-field basis.
