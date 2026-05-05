import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SkeletonCard, SkeletonPage, SkeletonCourseCard } from './Skeletons';

describe('Skeletons Component', () => {
    it('renders SkeletonCard correctly', () => {
        const { container } = render(<SkeletonCard />);
        expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    });

    it('renders SkeletonPage correctly', () => {
        const { container } = render(<SkeletonPage />);
        expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    });

    it('renders SkeletonCourseCard correctly', () => {
        const { container } = render(<SkeletonCourseCard />);
        expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    });
});
