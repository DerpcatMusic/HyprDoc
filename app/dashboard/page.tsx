'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardView } from '@/components/views/DashboardView';
import { DocumentState, AuditLogEntry } from '@/types';
import { SupabaseService, DocMeta } from '@/services/supabase';

export default function DashboardPage() {
    const router = useRouter();
    const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
    const [docList, setDocList] = useState<DocMeta[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshDocs = async () => {
        setIsLoading(true);
        const docs = await SupabaseService.listDocuments();
        setDocList(docs);
        setIsLoading(false);
    };

    useEffect(() => {
        refreshDocs();
    }, []);

    const handleCreateDocument = () => {
        const newId = crypto.randomUUID();
        router.push(`/doc/${newId}/edit`);
    };

    const handleSelectDocument = (id: string) => {
        router.push(`/doc/${id}/edit`);
    };

    const handleImportDocument = (doc: DocumentState) => {
        // This would need to be implemented with the Document context
        console.log('Importing document:', doc);
    };

    return (
        <DashboardView
            documents={docList.map(doc => ({
                id: doc.id,
                title: doc.title,
                status: doc.status as DocumentState['status'],
                blocks: [],
                parties: [],
                variables: [],
                terms: [],
                auditLog: [],
                updatedAt: Date.now(),
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
            auditLog={auditLog}
            onCreate={handleCreateDocument}
            onSelect={handleSelectDocument}
            onImport={handleImportDocument}
        />
    );
}

