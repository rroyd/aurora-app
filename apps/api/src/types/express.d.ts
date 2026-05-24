// Global module augmentations for Express. Lives in a .d.ts so it loads
// regardless of which file is imported first.
export {};

declare global {
  namespace Express {
    interface Request {
      /** Request-correlation UUID, populated by the requestId middleware. */
      id: string;
      /** Set by requireAuth / attachUserIfPresent middleware. */
      user?: {
        id: string;
        role: 'CUSTOMER' | 'ADMIN';
      };
    }
  }
}
