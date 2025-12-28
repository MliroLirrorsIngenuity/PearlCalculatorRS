interface DirectionDisplayProps {
    direction: [boolean, boolean];
    label?: string;
}

export function DirectionDisplay({ direction, label }: DirectionDisplayProps) {
    return (
        <div className="flex justify-center">
            <div className="inline-flex items-center gap-3 px-2 py-2 rounded-2xl border border-slate-200 border-dashed bg-slate-50/50">
                {label && (
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-2 mr-1">
                        {label}
                    </span>
                )}
                <div className="flex gap-2">
                    {direction.map((isActive, idx) => (
                        <div
                            key={idx}
                            className={`w-8 h-8 flex items-center justify-center text-xs font-mono rounded-lg border transition-all duration-300 ${isActive
                                ? "bg-slate-900 border-slate-900 shadow-md text-white font-bold scale-110 z-10"
                                : "bg-white border-slate-200 text-slate-300"
                                }`}
                        >
                            {isActive ? "1" : "0"}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
