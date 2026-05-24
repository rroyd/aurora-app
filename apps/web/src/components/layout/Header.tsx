import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { motion } from 'framer-motion';
import { LogOut, Package, Search, ShoppingBag, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/useAuth';
import { useLogout } from '@/features/auth/api';
import { useUnifiedCart } from '@/features/cart/useUnifiedCart';
import { useCartDrawer } from '@/stores/cart-drawer.store';
import { cn } from '@/lib/cn';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const logout = useLogout();
  const cart = useUnifiedCart();
  const openCart = useCartDrawer((s) => s.open);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 border-b border-transparent bg-surface/85 backdrop-blur',
        scrolled && 'border-slate-200 shadow-soft',
      )}
    >
      <div className="container flex h-16 items-center gap-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-ink">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-white">
            ✦
          </div>
          <span>Aurora</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/" className="text-sm text-ink-muted hover:text-ink">
            Shop
          </Link>
          <Link to="/?sort=popular" className="text-sm text-ink-muted hover:text-ink">
            Bestsellers
          </Link>
          <Link to="/?sort=newest" className="text-sm text-ink-muted hover:text-ink">
            New
          </Link>
        </nav>

        <form
          className="ml-auto hidden flex-1 max-w-md md:flex"
          onSubmit={(e) => {
            e.preventDefault();
            const q = new FormData(e.currentTarget).get('q')?.toString().trim();
            navigate(q ? `/?q=${encodeURIComponent(q)}` : '/');
          }}
        >
          <label className="relative flex w-full items-center">
            <Search className="absolute left-3 h-4 w-4 text-ink-subtle" />
            <input
              name="q"
              placeholder="Search products"
              className="h-10 w-full rounded-full border border-slate-200 bg-surface-muted pl-9 pr-4 text-sm placeholder:text-ink-subtle focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </label>
        </form>

        <button
          onClick={openCart}
          aria-label="Open cart"
          className="relative rounded-full p-2 hover:bg-surface-muted"
        >
          <ShoppingBag className="h-5 w-5" />
          {cart.itemCount > 0 ? (
            <motion.span
              key={cart.itemCount}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute -right-0.5 -top-0.5 grid min-h-[18px] min-w-[18px] place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white"
            >
              {cart.itemCount}
            </motion.span>
          ) : null}
        </button>

        {isAuthenticated && user ? (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="flex h-9 items-center gap-2 rounded-full bg-surface-muted px-3 text-sm hover:bg-surface-sunken"
                aria-label="Account menu"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                  {user.firstName[0]}
                </span>
                <span className="hidden sm:block">{user.firstName}</span>
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                sideOffset={6}
                align="end"
                className="z-40 min-w-[200px] rounded-lg border border-slate-200 bg-surface p-1 shadow-card"
              >
                <DropdownMenu.Item asChild>
                  <Link
                    to="/account"
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-surface-muted"
                  >
                    <User className="h-4 w-4" />
                    Account
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                  <Link
                    to="/account/orders"
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-surface-muted"
                  >
                    <Package className="h-4 w-4" />
                    Orders
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-slate-100" />
                <DropdownMenu.Item asChild>
                  <button
                    onClick={() => logout.mutate()}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-danger hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        ) : (
          <div className="hidden items-center gap-2 md:flex">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">Sign up</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
