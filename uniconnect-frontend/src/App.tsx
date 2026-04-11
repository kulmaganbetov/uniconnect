import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Dormitory from "./pages/Dormitory";
import Medical from "./pages/Medical";
import Jobs from "./pages/Jobs";
import Psychology from "./pages/Psychology";
import Guides from "./pages/Guides";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import AIChat from "./pages/AIChat";
import PrivateRoute from "./components/PrivateRoute";
import { ROLES } from "./lib/roles";

const STAFF_ROLES = [
  ROLES.ADMIN,
  ROLES.MANAGER,
  ROLES.TEACHER,
  ROLES.DORMITORY_MANAGER,
];

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/guides" element={<Guides />} />

      {/* Private routes */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/dormitory"
        element={
          <PrivateRoute>
            <Dormitory />
          </PrivateRoute>
        }
      />
      <Route
        path="/medical"
        element={
          <PrivateRoute>
            <Medical />
          </PrivateRoute>
        }
      />
      <Route
        path="/jobs"
        element={
          <PrivateRoute>
            <Jobs />
          </PrivateRoute>
        }
      />
      <Route
        path="/psychology"
        element={
          <PrivateRoute>
            <Psychology />
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />
      <Route
        path="/ai"
        element={
          <PrivateRoute>
            <AIChat />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <PrivateRoute roles={STAFF_ROLES}>
            <Admin />
          </PrivateRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
