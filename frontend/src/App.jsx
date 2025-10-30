import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import NewComplaint from "./pages/NewComplaint";
import ComplaintList from "./pages/ComplaintList";
import ComplaintDetails from "./pages/ComplaintDetails";
import AnonymousSubmission from "./pages/AnonymousSubmission";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/anonymous" element={<AnonymousSubmission />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/complaints" element={<ComplaintList />} />
        <Route path="/complaints/new" element={<NewComplaint />} />
        <Route path="/complaints/:id" element={<ComplaintDetails />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
