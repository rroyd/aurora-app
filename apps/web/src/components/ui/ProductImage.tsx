import { useState, type ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const PLACEHOLDER = '/product-placeholder.svg';

export interface ProductImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | null | undefined;
  alt: string;
}

export function ProductImage({ src, alt, className, ...rest }: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const effective = !src || failed ? PLACEHOLDER : src;
  return (
    <img
      src={effective}
      alt={alt}
      onError={() => setFailed(true)}
      className={cn(className)}
      {...rest}
    />
  );
}
