import { Sparkles } from "lucide-react";
import Button from "./ui/Button";

export default function EmptyState({ title, copy, onClear, buttonLabel = "Clear filters" }) {
  return (
    <div className="empty-state">
      <Sparkles aria-hidden="true" />
      <h3>{title}</h3>
      <p>{copy}</p>
      <Button variant="outline" onClick={onClear}>{buttonLabel}</Button>
    </div>
  );
}
