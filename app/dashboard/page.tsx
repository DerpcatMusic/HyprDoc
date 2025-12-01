'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { DashboardView } from '@/components/views/DashboardView';
import { DocumentState, AuditLogEntry } from '@/types';
import { useQuery, useMutation, api } from '@/lib/convex';

export default function DashboardPage() {
    const router = useRouter();
    const documents = useQuery(api.documents.list) ?? [];
    const createDocument = useMutation(api.documents.create);

    const handleCreateDocument = async () => {
        const newId = await createDocument({
            title: 'Untitled Document',
        });
        router.push(`/doc/${newId}/edit`);
    };

    const handleSelectDocument = (id: string) => {
        router.push(`/doc/${id}/edit`);
    };

    const handleImportDocument = (doc: DocumentState) => {
        console.log('Importing document:', doc);
    };

    return (
        <DashboardView
            documents={documents.map(doc => ({
                id: doc.id as string,
                title: doc.title,
                status: doc.status as DocumentState['status'],
                blocks: [],
                parties: [],
                variables: [],
                terms: [],
                auditLog: [],
                updatedAt: doc.updated_at,
                settings: {
                    signingOrder: 'parallel',
                    emailReminders: false,
                    reminderDays: 3,
                    expirationDays: 30,
                    fontFamily: '',
                    brandColor: '#000000',
                    direction: 'ltr'
                }
            }))}
            auditLog={[]}
            onCreate={handleCreateDocument}
            onSelect={handleSelectDocument}
            onImport={handleImportDocument}
        />
    );
}

