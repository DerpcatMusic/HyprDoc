import React, { useRef, useState, useEffect } from 'react';
import { Button } from './ui-components';
import { Eraser, Check } from 'lucide-react';

interface SignaturePadProps {
    onSign: (dataUrl: string) => void;
    initialValue?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSign, initialValue }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEmpty, setIsEmpty] = useState(!initialValue);

    useEffect(() => {
        if (initialValue && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            const img = new Image();
            img.onload = () => {
                ctx?.drawImage(img, 0, 0);
            };
            img.src = initialValue;
        }
    }, [initialValue]);

    const getCoords = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        
        // Calculate scale in case canvas is resized via CSS
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault(); // Prevent scrolling on touch
        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const { x, y } = getCoords(e);
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#000';
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { x, y } = getCoords(e);
        ctx.lineTo(x, y);
        ctx.stroke();
        setIsEmpty(false);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        if (canvasRef.current) {
            onSign(canvasRef.current.toDataURL());
        }
    };

    const clear = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
            setIsEmpty(true);
            onSign('');
        }
    };

    return (
        <div className="border rounded-md bg-white shadow-sm overflow-hidden select-none">
            <div className="bg-muted/30 p-2 border-b flex justify-between items-center">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Draw Signature</span>
                <Button variant="ghost" size="sm" onClick={clear} className="h-6 text-xs gap-1 text-muted-foreground hover:text-destructive">
                    <Eraser size={12} /> Clear
                </Button>
            </div>
            <div className="relative w-full h-48">
                 <canvas
                    ref={canvasRef}
                    width={800} 
                    height={300}
                    className="absolute inset-0 w-full h-full touch-none cursor-crosshair bg-white"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            </div>
           
            {!isEmpty && (
                <div className="p-2 bg-green-50 text-green-700 text-xs flex items-center justify-center gap-1 border-t border-green-100">
                    <Check size={12} /> Signature Captured
                </div>
            )}
        </div>
    );
};