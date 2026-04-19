import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Datasets from "./pages/Datasets";
import Studio from "./pages/Studio";
import DemoStudio from "./pages/DemoStudio";
import Settings from "./pages/Settings";
import AppLayout from "./components/AppLayout";

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes directly rendering Studio */}
            <Route path="/studio/:id" element={<Studio />} />
            <Route path="/studio/demo" element={<DemoStudio />} />

            {/* Protected Routes with Sidebar/Topnav */}
            <Route element={<AppLayout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/datasets" element={<Datasets />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
