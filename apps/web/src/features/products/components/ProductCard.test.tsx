import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { Product } from '@shared/contracts';
import { ProductCard } from './ProductCard';

const sample: Product = {
  id: 'p1',
  slug: 'sample',
  name: 'Sample Product',
  description: 'A sample.',
  priceCents: 1999,
  currency: 'USD',
  imageUrl: 'https://example.com/img.jpg',
  stock: 5,
  rating: 4.5,
  reviewCount: 10,
  category: { id: 'c1', slug: 'electronics', name: 'Electronics' },
  createdAt: new Date().toISOString(),
};

describe('<ProductCard />', () => {
  it('renders the name, category, and price', () => {
    render(
      <MemoryRouter>
        <ProductCard product={sample} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Sample Product')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('$19.99')).toBeInTheDocument();
  });

  it('fires onAddToCart when the add button is clicked', () => {
    const onAdd = vi.fn();
    render(
      <MemoryRouter>
        <ProductCard product={sample} onAddToCart={onAdd} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: /add sample product to cart/i }));
    expect(onAdd).toHaveBeenCalledWith(sample);
  });

  it('disables add-to-cart when out of stock', () => {
    render(
      <MemoryRouter>
        <ProductCard product={{ ...sample, stock: 0 }} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Out of stock/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add sample product to cart/i })).toBeDisabled();
  });
});
