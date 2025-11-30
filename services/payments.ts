
import type { DocBlock } from '../types/block';

/**
 * Payment Service
 * Handles Provider Simulation, Currency Formatting, and Calculation Logic
 */

export const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(amount);
};

export const PaymentService = {
    // --- SIMULATIONS ---

    processStripePayment: async (amount: number, currency: string): Promise<{ success: boolean; id?: string; error?: string }> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (amount > 0) resolve({ success: true, id: 'pi_' + Math.random().toString(36).substr(2, 10) });
                else resolve({ success: false, error: 'Invalid amount' });
            }, 2000);
        });
    },

    processBitPayment: async (phoneNumber: string, amount: number): Promise<{ success: boolean }> => {
        // In real Bit implementation, this would poll a backend status endpoint after QR scan
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true });
            }, 3000);
        });
    },

    processGoCardlessMandate: async (details: { accountHolder: string, sortCode: string, accountNumber: string }): Promise<{ success: boolean, mandateId?: string }> => {
        return new Promise((resolve) => {
            // Simulate Bank Verification
            setTimeout(() => {
                if (details.sortCode.length >= 6 && details.accountNumber.length >= 8) {
                    resolve({ success: true, mandateId: 'MD' + Math.random().toString(36).substr(2, 8).toUpperCase() });
                } else {
                    resolve({ success: false }); // Validation fail
                }
            }, 2500);
        });
    },

    initPayPalCheckout: async (): Promise<{ success: boolean, orderId?: string }> => {
        return new Promise((resolve) => {
            // Simulate Popup interaction
            setTimeout(() => {
                const confirmed = window.confirm("PayPal Simulation:\n\nUser logged in and approved payment.\n\nClick OK to simulate Success.");
                if (confirmed) {
                    resolve({ success: true, orderId: 'PAYID-' + Math.random().toString(36).substr(2, 12).toUpperCase() });
                } else {
                    resolve({ success: false });
                }
            }, 1000);
        });
    },

    // --- CALCULATIONS ---

    calculateAmount: (
        settings: { 
            amountType?: 'fixed' | 'variable' | 'percent' | undefined; 
            amount?: number | undefined; 
            percentage?: number | undefined;
            variableName?: string | undefined; 
        } | undefined, 
        formValues: Record<string, string | number | boolean | string[] | null | undefined>,
        globalVariables: Array<{ id: string; key: string; value: string; label?: string }>,
        allBlocks: DocBlock[] = []
    ): number => {
        if (!settings) return 0;

        // 1. Fixed Amount
        if (settings.amountType === 'fixed') {
            return settings.amount || 0;
        }

        const resolveValue = (varName: string): number => {
            if (!varName) return 0;
            
            // A. Check Global Variables
            const globalVal = globalVariables.find(v => v.key === varName)?.value;
            if (globalVal !== undefined) return parseFloat(globalVal) || 0;

            // B. Check Block Variables
            const sourceBlock = allBlocks.find(b => b.variableName === varName);
            if (sourceBlock) {
                // Try to find the value in formValues using the block's ID
                // Note: formValues keys are block IDs. 
                // We attempt to find the ID directly or with a suffix check for resilience.
                let val = formValues[sourceBlock.id];
                
                // Fallback: Check if any key ends with this ID (useful if ID is used as suffix)
                if (val === undefined) {
                     const entry = Object.entries(formValues).find(([k]) => k.endsWith(sourceBlock.id));
                     if (entry) val = entry[1];
                }

                if (val !== undefined && val !== '') return parseFloat(String(val)) || 0;
            }

            return 0;
        };

        // 2. Variable Reference (Direct)
        if (settings.amountType === 'variable' && settings.variableName) {
            return resolveValue(settings.variableName);
        }

        // 3. Percentage Calculation (Deposit)
        if (settings.amountType === 'percent' && settings.percentage && settings.variableName) {
             const baseValue = resolveValue(settings.variableName);
             return (baseValue * (settings.percentage / 100));
        }

        return 0;
    }
};
