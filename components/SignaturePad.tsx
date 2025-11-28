import React from 'react';
import { SignatureWidget } from './SignatureWidget';

/**
 * DEPRECATED: Use SignatureWidget.tsx instead.
 * This file is kept to prevent import errors but redirects to the superior component.
 */
interface SignaturePadProps {
    onSign: (dataUrl: string) => void;
    initialValue?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = (props) => {
    return <SignatureWidget {...props} />;
};
