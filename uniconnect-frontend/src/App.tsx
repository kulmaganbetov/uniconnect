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
import PrivateRoute from "./components/PrivateRoute";

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

      {/* Fallback */}
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
