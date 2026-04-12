import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("how-it-works", "routes/how-it-works.tsx"),
  route("economy", "routes/economy.tsx"),
  route("dashboard", "routes/dashboard.tsx", [index("routes/dashboard._index.tsx")]),
  route("about", "routes/about.tsx"),
] satisfies RouteConfig;
