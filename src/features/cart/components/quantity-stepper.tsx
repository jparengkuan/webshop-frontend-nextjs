type Props = {
  quantity: number;
  max: number;
  onChange: (quantity: number) => void;
};

export function QuantityStepper({ quantity, max, onChange }: Props) {
  return (
    <div className="flex items-center rounded-lg border border-stone-300">
      <button type="button" aria-label="Minder" className="px-3 py-1" onClick={() => onChange(quantity - 1)}>
        −
      </button>
      <span className="w-8 text-center" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        aria-label="Meer"
        className="px-3 py-1 disabled:text-stone-300"
        disabled={quantity >= max}
        onClick={() => onChange(quantity + 1)}
      >
        +
      </button>
    </div>
  );
}
