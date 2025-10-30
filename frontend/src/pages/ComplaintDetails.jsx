import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getUser, clearToken, clearUser, getComplaint, withdrawComplaint, updateComplaint } from "../services/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select } from "../components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { FileText, List, LogOut, ArrowLeft, Edit2, Trash2, AlertCircle, Calendar, User, Tag, AlertTriangle, Save, X, Download } from "lucide-react";

export default function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getUser();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    loadComplaint();
  }, [id]);

  async function loadComplaint() {
    try {
      const data = await getComplaint(id);
      setComplaint(data);
      setEditForm({
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw() {
    if (!confirm("Are you sure you want to withdraw this complaint?")) return;

    try {
      await withdrawComplaint(id);
      loadComplaint();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    try {
      await updateComplaint(id, editForm);
      setEditing(false);
      loadComplaint();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleLogout() {
    clearToken();
    clearUser();
    navigate("/login", { replace: true });
  }

  if (!user) return null;

  const getStatusColor = (status) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
      IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
      RESOLVED: "bg-green-100 text-green-800 border-green-200",
      REJECTED: "bg-red-100 text-red-800 border-red-200",
      WITHDRAWN: "bg-gray-100 text-gray-800 border-gray-200"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      LOW: "bg-gray-100 text-gray-700 border-gray-200",
      MEDIUM: "bg-blue-100 text-blue-700 border-blue-200",
      HIGH: "bg-orange-100 text-orange-700 border-orange-200",
      URGENT: "bg-red-100 text-red-700 border-red-200"
    };
    return colors[priority] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">ResolveIt</h1>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading complaint details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">ResolveIt</h1>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Complaint not found</AlertDescription>
          </Alert>
          <Link to="/complaints" className="mt-4 inline-block">
            <Button className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Complaints
            </Button>
          </Link>
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/complaints">
          <Button variant="ghost" className="gap-2 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Complaints
          </Button>
        </Link>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">
                      {editing ? "Edit Complaint" : complaint.title}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(complaint.status) + " border"}>
                        {complaint.status.replace("_", " ")}
                      </Badge>
                      <Badge className={getPriorityColor(complaint.priority) + " border"}>
                        {complaint.priority}
                      </Badge>
                    </div>
                  </div>
                  {complaint.status === "PENDING" && !editing && (
                    <div className="flex gap-2">
                      <Button onClick={() => setEditing(true)} variant="outline" size="sm" className="gap-2">
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button onClick={handleWithdraw} variant="destructive" size="sm" className="gap-2">
                        <Trash2 className="w-4 h-4" />
                        Withdraw
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-title">Title</Label>
                      <Input
                        id="edit-title"
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea
                        id="edit-description"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        required
                        rows={6}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-category">Category</Label>
                        <Select
                          id="edit-category"
                          value={editForm.category}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        >
                          <option value="SANITATION">Sanitation</option>
                          <option value="TRAFFIC">Traffic</option>
                          <option value="WATER">Water</option>
                          <option value="OTHER">Other</option>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-priority">Priority</Label>
                        <Select
                          id="edit-priority"
                          value={editForm.priority}
                          onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="gap-2">
                        <Save className="w-4 h-4" />
                        Save Changes
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setEditing(false)} className="gap-2">
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                      <p className="text-gray-900 whitespace-pre-wrap">{complaint.description}</p>
                    </div>

                    {complaint.attachmentPath && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Attachment</h3>
                        <a 
                          href={complaint.attachmentPath} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-700 hover:underline"
                        >
                          <Download className="w-4 h-4" />
                          View Attachment
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-gray-500">Complaint ID</p>
                    <p className="font-semibold text-gray-900">#{complaint.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-gray-500">Category</p>
                    <p className="font-semibold text-gray-900">{complaint.category}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <AlertTriangle className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-gray-500">Priority</p>
                    <p className="font-semibold text-gray-900">{complaint.priority}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-gray-500">Submitted On</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(complaint.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </p>
                  </div>
                </div>

                {complaint.updatedAt && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-gray-500">Last Updated</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(complaint.updatedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {complaint.submitterName && (
                  <div className="flex items-center gap-3 text-sm">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-gray-500">Submitter</p>
                      <p className="font-semibold text-gray-900">{complaint.submitterName}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {complaint.status === "RESOLVED" && complaint.resolvedAt && (
              <Card className="border-0 shadow-md bg-green-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <AlertCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-green-900 mb-1">Resolved</h3>
                    <p className="text-sm text-green-700">
                      {new Date(complaint.resolvedAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
