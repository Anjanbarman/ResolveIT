import { clearToken, getToken } from "../services/api";
import { useNavigate, Navigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      <div>
        <h1>Welcome</h1>
        <p>You're logged in.</p>
        <button
          className="primary"
          onClick={() => {
            clearToken();
            navigate("/login", { replace: true });
          }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}
