
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
    { code: 'USD', label: 'US Dollar', symbol: '$', flag: '🇺🇸' },
    { code: 'EUR', label: 'Euro', symbol: '€', flag: '🇪🇺' },
    { code: 'GBP', label: 'British Pound', symbol: '£', flag: '🇬🇧' },
    { code: 'CAD', label: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
    { code: 'AUD', label: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
    { code: 'JPY', label: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
    { code: 'CNY', label: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
    { code: 'INR', label: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
    { code: 'BRL', label: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
    { code: 'RUB', label: 'Russian Ruble', symbol: '₽', flag: '🇷🇺' },
    { code: 'KRW', label: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
    { code: 'MXN', label: 'Mexican Peso', symbol: '$', flag: '🇲🇽' },
    { code: 'SAR', label: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦' },
    { code: 'ZAR', label: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
    { code: 'TRY', label: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
    { code: 'SEK', label: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪' },
    { code: 'CHF', label: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭' },
    { code: 'SGD', label: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
    { code: 'HKD', label: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
    { code: 'NOK', label: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴' },
    { code: 'NZD', label: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿' },
    { code: 'AED', label: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
    { code: 'THB', label: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
    { code: 'IDR', label: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩' },
    { code: 'PLN', label: 'Polish Złoty', symbol: 'zł', flag: '🇵🇱' },
    { code: 'ILS', label: 'Israeli New Shekel', symbol: '₪', flag: '🇮🇱' },
    { code: 'CLP', label: 'Chilean Peso', symbol: '$', flag: '🇨🇱' },
    { code: 'PHP', label: 'Philippine Peso', symbol: '₱', flag: '🇵🇭' },
    { code: 'CZK', label: 'Czech Koruna', symbol: 'Kč', flag: '🇨🇿' },
    { code: 'HUF', label: 'Hungarian Forint', symbol: 'Ft', flag: '🇭🇺' },
    { code: 'MYR', label: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾' },
    { code: 'VND', label: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳' },
    { code: 'EGP', label: 'Egyptian Pound', symbol: 'E£', flag: '🇪🇬' }
];
