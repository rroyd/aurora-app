import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-24 border-t border-slate-200 bg-surface">
      <div className="container grid gap-8 py-12 md:grid-cols-4">
        <div>
          <div className="mb-3 flex items-center gap-2 font-bold text-ink">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-white">
              ✦
            </div>
            <span>Aurora</span>
          </div>
          <p className="text-sm text-ink-muted">
            Premium goods, thoughtfully curated. Crafted to last.
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Shop</p>
          <ul className="space-y-2 text-sm text-ink-muted">
            <li><Link to="/?category=electronics" className="hover:text-ink">Electronics</Link></li>
            <li><Link to="/?category=apparel" className="hover:text-ink">Apparel</Link></li>
            <li><Link to="/?category=home" className="hover:text-ink">Home</Link></li>
            <li><Link to="/?category=books" className="hover:text-ink">Books</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Help</p>
          <ul className="space-y-2 text-sm text-ink-muted">
            <li>Shipping</li>
            <li>Returns</li>
            <li>Contact</li>
            <li>FAQ</li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Stay in the loop</p>
          <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="you@example.com"
              className="h-10 w-full rounded-md border border-slate-200 bg-surface-muted px-3 text-sm placeholder:text-ink-subtle focus:border-brand-500 focus:outline-none"
            />
            <button className="h-10 rounded-md bg-ink px-4 text-sm font-medium text-white hover:bg-ink/90">
              Join
            </button>
          </form>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-ink-subtle">
        © {new Date().getFullYear()} Aurora. All rights reserved.
      </div>
    </footer>
  );
}
