'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Share } from 'lucide-react';
import { Viewer } from '../../../../components/Viewer';
import { Button } from '../../../../components/ui-components';
import { useDocument } from '../../../../context/DocumentContext';

export default function DocumentPreviewPage() {
    const router = useRouter();
    const params = useParams();
    const docId = params.id as string;
    
    const { doc, loadDocument } = useDocument();

    // Load document effect
    React.useEffect(() => {
        if (docId && docId !== doc.id) {
            loadDocument(docId);
        }
    }, [docId, doc.id, loadDocument]);

    const handleBackToEditor = () => {
        router.push(`/doc/${docId}/edit`);
    };

    const handleShare = () => {
        router.push(`/s/${docId}`);
    };

    return (
        <div className="min-h-screen bg-background transition-colors font-sans">
            <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-none border-b-2 border-black dark:border-white px-6 py-4 flex justify-between items-center shadow-none">
                <Button variant="outline" onClick={handleBackToEditor} className="gap-2 font-mono">
                    <ArrowLeft size={16} /> BACK TO EDITOR
                </Button>
                <div className="flex gap-4">
                    <Link href={`/s/${docId}`}>
                        <Button className="gap-2 font-mono">
                            <Share size={16}/> SHARE LINK
                        </Button>
                    </Link>
                </div>
            </div>
            <Viewer 
                blocks={doc.blocks} 
                settings={doc.settings} 
                parties={doc.parties} 
                variables={doc.variables} 
                terms={doc.terms} 
                isPreview={true} 
                docHash={doc.sha256} 
            />
        </div>
    );
}