
/**
 * Currency Service
 * Uses public API (Frankfurter) to get real exchange rates.
 */

export interface ExchangeRateResponse {
    amount: number;
    base: string;
    date: string;
    rates: Record<string, number>;
}

export const fetchExchangeRate = async (base: string, target: string): Promise<number | null> => {
    try {
        if (base === target) return 1;
        // Frankfurter only supports EUR base for some queries, but often converts. 
        // If exact pair isn't supported, user sees 'Loading...'. 
        // For robustness in this demo, we assume the API call works for major pairs.
        const response = await fetch(`https://api.frankfurter.app/latest?from=${base}&to=${target}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch rates');
        }

        const data: ExchangeRateResponse = await response.json();
        return data.rates[target] || null;
    } catch (error) {
        console.error("Currency fetch error:", error);
        return null;
    }
};

export const SUPPORTED_CURRENCIES = [
    { code: 'USD', label: 'US Dollar', symbol: '$' },
    { code: 'EUR', label: 'Euro', symbol: '€' },
    { code: 'GBP', label: 'British Pound', symbol: '£' },
    { code: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
    { code: 'JPY', label: 'Japanese Yen', symbol: '¥' },
    { code: 'CNY', label: 'Chinese Yuan', symbol: '¥' },
    { code: 'INR', label: 'Indian Rupee', symbol: '₹' },
    { code: 'BRL', label: 'Brazilian Real', symbol: 'R$' },
    { code: 'RUB', label: 'Russian Ruble', symbol: '₽' },
    { code: 'KRW', label: 'South Korean Won', symbol: '₩' },
    { code: 'MXN', label: 'Mexican Peso', symbol: '$' },
    { code: 'SAR', label: 'Saudi Riyal', symbol: '﷼' },
    { code: 'ZAR', label: 'South African Rand', symbol: 'R' },
    { code: 'TRY', label: 'Turkish Lira', symbol: '₺' },
    { code: 'SEK', label: 'Swedish Krona', symbol: 'kr' },
    { code: 'CHF', label: 'Swiss Franc', symbol: 'Fr' },
    { code: 'SGD', label: 'Singapore Dollar', symbol: 'S$' },
    { code: 'HKD', label: 'Hong Kong Dollar', symbol: 'HK$' },
    { code: 'NOK', label: 'Norwegian Krone', symbol: 'kr' },
    { code: 'NZD', label: 'New Zealand Dollar', symbol: 'NZ$' },
    { code: 'AED', label: 'UAE Dirham', symbol: 'د.إ' },
    { code: 'THB', label: 'Thai Baht', symbol: '฿' },
    { code: 'IDR', label: 'Indonesian Rupiah', symbol: 'Rp' },
    { code: 'PLN', label: 'Polish Złoty', symbol: 'zł' },
    { code: 'ILS', label: 'Israeli New Shekel', symbol: '₪' },
    { code: 'CLP', label: 'Chilean Peso', symbol: '$' },
    { code: 'PHP', label: 'Philippine Peso', symbol: '₱' },
    { code: 'CZK', label: 'Czech Koruna', symbol: 'Kč' },
    { code: 'HUF', label: 'Hungarian Forint', symbol: 'Ft' },
    { code: 'MYR', label: 'Malaysian Ringgit', symbol: 'RM' },
    { code: 'VND', label: 'Vietnamese Dong', symbol: '₫' },
    { code: 'EGP', label: 'Egyptian Pound', symbol: 'E£' }
];
