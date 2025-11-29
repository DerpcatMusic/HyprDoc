'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from './ui-components';

interface BreadcrumbItem {
    label: string;
    href?: string;
    isActive?: boolean;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
    const pathname = usePathname();

    const getBreadcrumbItems = (): BreadcrumbItem[] => {
        if (pathname === '/dashboard') {
            return [
                { label: 'Dashboard', href: '/dashboard', isActive: true }
            ];
        }

        if (pathname === '/settings') {
            return [
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Settings', href: '/settings', isActive: true }
            ];
        }

        if (pathname?.startsWith('/doc/')) {
            const pathParts = pathname.split('/');
            const docId = pathParts[2];
            const isEdit = pathname.includes('/edit');
            const isPreview = pathname.includes('/preview');

            const breadcrumbItems: BreadcrumbItem[] = [
                { label: 'Dashboard', href: '/dashboard' },
                { label: `Document ${docId}`, href: `/doc/${docId}/edit` }
            ];

            if (isPreview) {
                breadcrumbItems.push({ label: 'Preview', isActive: true });
            } else {
                breadcrumbItems[breadcrumbItems.length - 1].isActive = true;
            }

            return breadcrumbItems;
        }

        if (pathname?.startsWith('/s/')) {
            const pathParts = pathname.split('/');
            const docId = pathParts[2];
            
            return [
                { label: 'Shared Document', isActive: true }
            ];
        }

        return items;
    };

    const breadcrumbItems = getBreadcrumbItems();

    if (breadcrumbItems.length <= 1) {
        return null;
    }

    return (
        <nav 
            className={cn(
                "flex items-center space-x-2 text-sm text-muted-foreground",
                className
            )}
            aria-label="Breadcrumb"
        >
            {breadcrumbItems.map((item, index) => (
                <React.Fragment key={index}>
                    {index > 0 && (
                        <ChevronRight 
                            size={16} 
                            className="text-muted-foreground/60" 
                            aria-hidden="true"
                        />
                    )}
                    {item.href && !item.isActive ? (
                        <Link
                            href={item.href}
                            className="hover:text-foreground transition-colors flex items-center gap-1"
                        >
                            {index === 0 && <Home size={14} />}
                            {item.label}
                        </Link>
                    ) : (
                        <span 
                            className={cn(
                                "flex items-center gap-1",
                                item.isActive ? "text-foreground font-medium" : "text-muted-foreground"
                            )}
                            aria-current={item.isActive ? "page" : undefined}
                        >
                            {index === 0 && <Home size={14} />}
                            {item.label}
                        </span>
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
}