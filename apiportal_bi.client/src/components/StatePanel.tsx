import Icon from "./Icon";
export function LoadingPanel({ label = "Loading Portal data…" }: { label?: string }) { return <div className="state-panel"><Icon name="fa-solid fa-spinner" className="spin" /><span>{label}</span></div>; }
export function ErrorPanel({ error }: { error: Error | null }) { return <div className="state-panel error"><Icon name="fa-solid fa-circle-exclamation" /><span>{error?.message ?? "The Portal could not load this data."}</span></div>; }
