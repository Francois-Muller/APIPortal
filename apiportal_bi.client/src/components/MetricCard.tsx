import Icon from "./Icon";
interface MetricCardProps { icon: string; value: string | number; label: string; hint?: string; }
export default function MetricCard({ icon, value, label, hint }: MetricCardProps) {
  return <article className="metric-card"><div className="metric-icon"><Icon name={icon} /></div><div><strong>{value}</strong><span>{label}</span>{hint ? <small>{hint}</small> : null}</div></article>;
}
