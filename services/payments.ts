
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
            amountType?: 'fixed' | 'variable' | 'percent'; 
            amount?: number; 
            percentage?: number;
            variableName?: string; 
        } | undefined, 
        formValues: Record<string, any>,
        globalVariables: any[]
    ): number => {
        if (!settings) return 0;

        // 1. Fixed Amount
        if (settings.amountType === 'fixed') {
            return settings.amount || 0;
        }

        // 2. Variable Reference (Direct)
        if (settings.amountType === 'variable' && settings.variableName) {
            // Check form values (Input fields)
            const formVal = Object.entries(formValues).find(([key, val]) => key.endsWith(settings.variableName!))?.[1];
            if (formVal) return parseFloat(formVal) || 0;

            // Check global variables
            const globalVal = globalVariables.find(v => v.key === settings.variableName)?.value;
            if (globalVal) return parseFloat(globalVal) || 0;
        }

        // 3. Percentage Calculation (Deposit)
        if (settings.amountType === 'percent' && settings.percentage && settings.variableName) {
             let baseValue = 0;
             // Check form values
             const formVal = Object.entries(formValues).find(([key, val]) => key.endsWith(settings.variableName!))?.[1];
             if (formVal) baseValue = parseFloat(formVal) || 0;
             else {
                 // Check global variables
                 const globalVal = globalVariables.find(v => v.key === settings.variableName)?.value;
                 if (globalVal) baseValue = parseFloat(globalVal) || 0;
             }

             return (baseValue * (settings.percentage / 100));
        }

        return 0;
    }
};
