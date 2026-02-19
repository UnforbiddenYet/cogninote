import { createFileRoute } from "@tanstack/react-router";
import { InsightsPanel } from "../components/InsightsPanel";

export const Route = createFileRoute("/app/search")({
  component: SearchPage,
});

export function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <InsightsPanel />
    </div>
  );
}
