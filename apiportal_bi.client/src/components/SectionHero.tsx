import type { ReactNode } from "react";
import Icon from "./Icon";

interface SectionHeroProps {
  icon: string;
  kicker: string;
  title: string;
  description: string;
  children?: ReactNode;
}

export default function SectionHero({ icon, kicker, title, description, children }: SectionHeroProps) {
  return <header className="section-hero">
    <div className="section-kicker"><Icon name={icon} /> {kicker}</div>
    <h1 tabIndex={-1}>{title}</h1>
    <p>{description}</p>
    {children}
  </header>;
}
