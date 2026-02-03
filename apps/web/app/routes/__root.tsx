import { createRootRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import "../styles/tailwind.css";

const RootComponent = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to auth if no token
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate({ to: "/auth/login" });
    }
  }, []);

  return (
    <div>
      <Outlet />
    </div>
  );
};

export const Route = createRootRoute({
  component: RootComponent,
});
