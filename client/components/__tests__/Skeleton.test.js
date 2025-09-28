import React from 'react';
import { render, screen } from '@testing-library/react';
import { Skeleton, SkeletonCard, SkeletonImageCard } from '@/components/Skeleton';

describe('Skeleton Components', () => {
  describe('Skeleton', () => {
    it('renders with default props', () => {
      render(<Skeleton />);
      const skeleton = screen.getByRole('generic');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('bg-gray-200', 'rounded', 'animate-pulse');
    });

    it('renders with custom width and height', () => {
      render(<Skeleton width="200px" height="50px" />);
      const skeleton = screen.getByRole('generic');
      expect(skeleton).toHaveStyle({ width: '200px', height: '50px' });
    });

    it('renders with rounded variant', () => {
      render(<Skeleton rounded />);
      const skeleton = screen.getByRole('generic');
      expect(skeleton).toHaveClass('rounded-full');
    });

    it('renders without animation when animate is false', () => {
      render(<Skeleton animate={false} />);
      const skeleton = screen.getByRole('generic');
      expect(skeleton).not.toHaveClass('animate-pulse');
    });
  });

  describe('SkeletonCard', () => {
    it('renders card skeleton with proper structure', () => {
      render(<SkeletonCard />);
      expect(screen.getByRole('generic')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<SkeletonCard className="custom-class" />);
      const card = screen.getByRole('generic');
      expect(card).toHaveClass('custom-class');
    });
  });

  describe('SkeletonImageCard', () => {
    it('renders image card skeleton', () => {
      render(<SkeletonImageCard />);
      expect(screen.getByRole('generic')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<SkeletonImageCard className="custom-class" />);
      const card = screen.getByRole('generic');
      expect(card).toHaveClass('custom-class');
    });
  });
});
