import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createComplaint, getUser, clearToken, clearUser } from "../services/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select } from "../components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { FileText, Plus, List, LogOut, AlertCircle, Upload, CheckCircle2, ArrowLeft, Eye } from "lucide-react";

export default function NewComplaint() {
  const navigate = useNavigate();
  const user = getUser();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "SANITATION",
    priority: "MEDIUM",
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("category", form.category);
      formData.append("priority", form.priority);
      if (file) {
        formData.append("file", file);
      }

      const complaint = await createComplaint(formData);
      setSuccess(complaint);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearToken();
    clearUser();
    navigate("/login", { replace: true });
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">ResolveIt</h1>
              </div>
              <nav className="flex items-center gap-4">
                <Link to="/dashboard">
                  <Button variant="ghost" className="gap-2">
                    <FileText className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
                <Link to="/complaints">
                  <Button variant="ghost" className="gap-2">
                    <List className="w-4 h-4" />
                    My Complaints
                  </Button>
                </Link>
                <Button variant="outline" onClick={handleLogout} className="gap-2">
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </nav>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="border-0 shadow-xl text-center">
            <CardContent className="pt-12 pb-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Complaint Submitted Successfully!</h2>
              <p className="text-lg text-gray-600 mb-8">
                Your complaint has been registered with ID: <span className="font-semibold text-violet-600">#{success.id}</span>
              </p>
              <div className="flex gap-4 justify-center">
                <Link to="/dashboard">
                  <Button size="lg" className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                  </Button>
                </Link>
                <Link to={`/complaints/${success.id}`}>
                  <Button size="lg" variant="outline" className="gap-2">
                    <Eye className="w-4 h-4" />
                    View Complaint
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">ResolveIt</h1>
            </div>
            <nav className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/complaints">
                <Button variant="ghost" className="gap-2">
                  <List className="w-4 h-4" />
                  My Complaints
                </Button>
              </Link>
              <Button variant="outline" onClick={handleLogout} className="gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link to="/dashboard">
            <Button variant="ghost" className="gap-2 mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit New Complaint</h1>
          <p className="text-gray-600">Fill out the form below to submit your complaint</p>
        </div>

        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <form onSubmit={onSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  type="text"
                  name="title"
                  placeholder="Brief summary of your complaint"
                  value={form.title}
                  onChange={onChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Provide detailed information about the issue..."
                  value={form.description}
                  onChange={onChange}
                  required
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
                  <Select id="category" name="category" value={form.category} onChange={onChange}>
                    <option value="SANITATION">🧹 Sanitation</option>
                    <option value="TRAFFIC">🚗 Traffic</option>
                    <option value="WATER">💧 Water</option>
                    <option value="OTHER">📋 Other</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority <span className="text-red-500">*</span></Label>
                  <Select id="priority" name="priority" value={form.priority} onChange={onChange}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Attachment (Optional)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="cursor-pointer"
                  />
                </div>
                {file && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                    <Upload className="w-4 h-4" />
                    <span>Selected: {file.name}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1 gap-2" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Submit Complaint
                    </>
                  )}
                </Button>
                <Link to="/dashboard">
                  <Button type="button" variant="outline" className="gap-2">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
