import { Link, useNavigate } from "react-router-dom";
import { getUser } from "../services/api";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { FileText, Plus, LayoutDashboard } from "lucide-react";
import { useEffect } from "react";

export default function Welcome() {
  const user = getUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    } else if (user.role !== "CITIZEN") {
      navigate("/dashboard", { replace: true });
    }
  }, []);

  if (!user || user.role !== "CITIZEN") return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl mb-6 shadow-lg">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-3">
            Welcome, {user.name}!
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Raise a new complaint or view your complaint dashboard to track
            progress and updates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Plus className="w-5 h-5 text-violet-600" /> Raise New Complaint
              </CardTitle>
              <CardDescription>
                Submit a new complaint with all relevant details and
                attachments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/complaints/new">
                <Button size="lg" className="w-full gap-2">
                  <Plus className="w-5 h-5" /> Start Complaint
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <LayoutDashboard className="w-5 h-5 text-purple-600" />{" "}
                Dashboard
              </CardTitle>
              <CardDescription>
                View status, updates, and analytics of your submitted
                complaints.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/dashboard">
                <Button variant="outline" size="lg" className="w-full gap-2">
                  <LayoutDashboard className="w-5 h-5" /> Go to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-sm text-gray-500 pt-4">
          Secure & Transparent Issue Resolution • ResolveIt Platform
        </div>
      </div>
    </div>
  );
}
