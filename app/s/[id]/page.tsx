'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Viewer } from '../../../components/Viewer';
import { AccessGate } from '../../../components/AccessGate';
import { useDocument } from '../../../context/DocumentContext';

export default function SharedDocumentPage() {
    const params = useParams();
    const docId = params.id as string;
    
    const { doc, loadDocument } = useDocument();
    const [recipientIdentifier, setRecipientIdentifier] = useState<string | null>(null);

    // Load document effect
    useEffect(() => {
        if (docId && docId !== doc.id) {
            loadDocument(docId);
        }
    }, [docId, doc.id, loadDocument]);

    const handleAccessGranted = (identifier: string) => {
        setRecipientIdentifier(identifier);
    };

    // Show access gate if no recipient identifier
    if (!recipientIdentifier) {
        return (
            <AccessGate 
                documentTitle={doc.title} 
                onAccessGranted={handleAccessGranted} 
            />
        );
    }

    // Show the document viewer
    return (
        <Viewer 
            blocks={doc.blocks} 
            snapshot={doc.snapshot} 
            settings={doc.settings} 
            parties={doc.parties} 
            terms={doc.terms} 
            docHash={doc.sha256}
            verifiedIdentifier={recipientIdentifier} 
        />
    );
}