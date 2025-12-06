interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: 'indigo' | 'green' | 'cyan' | 'amber' | 'rose';
}

const colorClasses = {
    indigo: 'bg-indigo-500/10 text-indigo-500',
    green: 'bg-green-500/10 text-green-500',
    cyan: 'bg-cyan-500/10 text-cyan-500',
    amber: 'bg-amber-500/10 text-amber-500',
    rose: 'bg-rose-500/10 text-rose-500',
};

export default function StatCard({ title, value, icon, trend, color = 'indigo' }: StatCardProps) {
    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 hover:border-[var(--border-secondary)] transition-all duration-200 group hover:shadow-lg">
            <div className={`w-12 h-12 ${colorClasses[color]} rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                {icon}
            </div>
            <h3 className="text-3xl font-bold text-[var(--text-primary)]">{value}</h3>
            <div className="flex items-center justify-between mt-2">
                <p className="text-[var(--text-tertiary)]">{title}</p>
                {trend && (
                    <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-500' : 'text-rose-500'}`}>
                        {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                    </span>
                )}
            </div>
        </div>
    );
}
