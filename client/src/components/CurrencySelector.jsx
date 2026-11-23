import { useCurrency, CURRENCY_CONFIG } from "../context/CurrencyContext";

export default function CurrencySelector({ className = "" }) {
  const { currency, setCurrency, currencies } = useCurrency();

  return (
    <div className={`currency-switcher ${className}`}>
      <label htmlFor="currency-select" className="sr-only">
        Select Currency
      </label>
      <select
        id="currency-select"
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        className="currency-select-input"
        aria-label="Currency"
      >
        {currencies.map((code) => {
          const conf = CURRENCY_CONFIG[code];
          return (
            <option key={code} value={code}>
              {conf.code} ({conf.symbol})
            </option>
          );
        })}
      </select>
    </div>
  );
}
