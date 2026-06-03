import { createBrowserRouter, Navigate } from "react-router";
import { MainLayout } from "./components/layout/MainLayout";
import { Landing } from "./components/pages/Landing";
import { Login } from "./components/pages/Login";
import { Signup } from "./components/pages/Signup";
import { Dashboard } from "./components/pages/Dashboard";
import { Inbox } from "./components/pages/Inbox";
import { Calendar } from "./components/pages/Calendar";
import { Leads } from "./components/pages/Leads";
import { Payments } from "./components/pages/Payments";
import { Finance } from "./components/pages/Finance";
import { Analytics } from "./components/pages/Analytics";
import { Architecture } from "./components/pages/Architecture";
import { Settings } from "./components/pages/Settings";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Landing,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/signup",
    Component: Signup,
  },
  {
    path: "/app",
    Component: MainLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "inbox", Component: Inbox },
      { path: "leads", Component: Leads },
      { path: "calendar", Component: Calendar },
      { path: "payments", Component: Payments },
      { path: "finance", Component: Finance },
      { path: "analytics", Component: Analytics },
      { path: "architecture", Component: Architecture },
      { path: "settings", Component: Settings },
    ],
  },
  {
    path: "/inbox",
    element: <Navigate to="/app/inbox" replace />,
  },
  {
    path: "/leads",
    element: <Navigate to="/app/leads" replace />,
  },
  {
    path: "/calendar",
    element: <Navigate to="/app/calendar" replace />,
  },
  {
    path: "/payments",
    element: <Navigate to="/app/payments" replace />,
  },
  {
    path: "/finance",
    element: <Navigate to="/app/finance" replace />,
  },
  {
    path: "/analytics",
    element: <Navigate to="/app/analytics" replace />,
  },
  {
    path: "/architecture",
    element: <Navigate to="/app/architecture" replace />,
  },
  {
    path: "/settings",
    element: <Navigate to="/app/settings" replace />,
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
