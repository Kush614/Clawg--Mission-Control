export default function WizardStep({ number, title, children, onNext, onBack }: {
  number: number; title: string; children: React.ReactNode; onNext?: () => void; onBack?: () => void;
}) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm shrink-0">{number}</div>
        <h2 className="text-white font-semibold">{title}</h2>
      </div>
      <div className="mb-6">{children}</div>
      <div className="flex gap-3">
        {onBack && <button onClick={onBack} className="flex-1 py-2 border border-gray-700 text-gray-400 hover:text-white rounded-xl text-sm transition-all">← Back</button>}
        {onNext && <button onClick={onNext} className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-xl text-sm font-semibold transition-all">Next →</button>}
      </div>
    </div>
  );
}
