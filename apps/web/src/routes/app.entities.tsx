import { createFileRoute } from "@tanstack/react-router";
import { EntityManager } from "../components/EntityManager";

export const Route = createFileRoute("/app/entities")({
  component: EntitiesPage,
});

function EntitiesPage() {
  return <EntityManager />;
}
