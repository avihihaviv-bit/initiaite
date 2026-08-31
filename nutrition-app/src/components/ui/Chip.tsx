export function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition active:scale-95 ${
        selected ? 'border-primary-500 bg-primary-500 text-white' : 'border-gray-200 bg-white text-ink hover:border-gray-300'
      }`}
    >
      {children}
    </button>
  );
}
