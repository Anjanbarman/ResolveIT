import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getUser,
  clearToken,
  clearUser,
  getComplaint,
  withdrawComplaint,
  updateComplaint,
  getOfficers,
  assignOfficer,
  unassignOfficer,
  addInternalNote,
  getInternalNotes,
  addPublicUpdate,
  getPublicUpdates,
  updateComplaintStatus,
} from "../services/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select } from "../components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import {
  FileText,
  List,
  LogOut,
  ArrowLeft,
  Edit2,
  Trash2,
  AlertCircle,
  Calendar,
  User,
  Tag,
  AlertTriangle,
  Save,
  X,
  Download,
  Users,
  MessageSquare,
  Bell,
} from "lucide-react";

export default function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getUser();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState("");
  const [officers, setOfficers] = useState([]);
  const [internalNotes, setInternalNotes] = useState([]);
  const [publicUpdates, setPublicUpdates] = useState([]);
  const [newInternalNote, setNewInternalNote] = useState("");
  const [newPublicUpdate, setNewPublicUpdate] = useState("");
  const [selectedOfficerId, setSelectedOfficerId] = useState("");

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

      if (user.role === "ADMIN") {
        const officersData = await getOfficers();
        setOfficers(officersData);
        setSelectedOfficerId(data.assignedOfficer?.id || "");
      }

      if (user.role === "ADMIN" || user.role === "OFFICER") {
        const notesData = await getInternalNotes(id);
        setInternalNotes(notesData);
      }

      if (user.role !== "OFFICER") {
        const updatesData = await getPublicUpdates(id);
        setPublicUpdates(updatesData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAssignOfficer(officerId) {
    try {
      await assignOfficer(id, officerId);
      loadComplaint();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUnassignOfficer() {
    try {
      await unassignOfficer(id);
      await loadComplaint();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleMarkCompleted() {
    try {
      await updateComplaintStatus(id, "COMPLETED");
      await loadComplaint();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleMarkResolved() {
    try {
      await updateComplaintStatus(id, "RESOLVED");
      await loadComplaint();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAdminWithdraw() {
    try {
      await updateComplaintStatus(id, "WITHDRAWN");
      await loadComplaint();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddInternalNote(e) {
    e.preventDefault();
    if (!newInternalNote.trim()) return;
    try {
      await addInternalNote(id, newInternalNote);
      setNewInternalNote("");
      const notesData = await getInternalNotes(id);
      setInternalNotes(notesData);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddPublicUpdate(e) {
    e.preventDefault();
    if (!newPublicUpdate.trim()) return;
    try {
      await addPublicUpdate(id, newPublicUpdate);
      setNewPublicUpdate("");
      const updatesData = await getPublicUpdates(id);
      setPublicUpdates(updatesData);
    } catch (err) {
      setError(err.message);
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
      COMPLETED: "bg-indigo-100 text-indigo-800 border-indigo-200",
      RESOLVED: "bg-green-100 text-green-800 border-green-200",
      REJECTED: "bg-red-100 text-red-800 border-red-200",
      WITHDRAWN: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  // For Citizens: mask COMPLETED as IN_PROGRESS on the details page
  const displayStatusForRole = (status) => {
    if (user.role === "CITIZEN" && status === "COMPLETED") return "IN_PROGRESS";
    return status;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      LOW: "bg-gray-100 text-gray-700 border-gray-200",
      MEDIUM: "bg-blue-100 text-blue-700 border-blue-200",
      HIGH: "bg-orange-100 text-orange-700 border-orange-200",
      URGENT: "bg-red-100 text-red-700 border-red-200",
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
              <Button
                variant="outline"
                onClick={handleLogout}
                className="gap-2"
              >
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
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">
                      {editing ? "Edit Complaint" : complaint.title}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge
                        className={
                          getStatusColor(
                            displayStatusForRole(complaint.status)
                          ) + " border"
                        }
                      >
                        {displayStatusForRole(complaint.status).replace(
                          "_",
                          " "
                        )}
                      </Badge>
                      <Badge
                        className={
                          getPriorityColor(complaint.priority) + " border"
                        }
                      >
                        {complaint.priority}
                      </Badge>
                    </div>
                  </div>
                  {complaint.status === "PENDING" &&
                    !editing &&
                    user.role === "CITIZEN" &&
                    complaint.reporter &&
                    complaint.reporter.id === user.id && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setEditing(true)}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          onClick={handleWithdraw}
                          variant="destructive"
                          size="sm"
                          className="gap-2"
                        >
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
                        onChange={(e) =>
                          setEditForm({ ...editForm, title: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea
                        id="edit-description"
                        value={editForm.description}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            description: e.target.value,
                          })
                        }
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
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              category: e.target.value,
                            })
                          }
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
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              priority: e.target.value,
                            })
                          }
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
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditing(false)}
                        className="gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        Description
                      </h3>
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {complaint.description}
                      </p>
                    </div>

                    {complaint.attachmentPath && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">
                          Attachment
                        </h3>
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

            {/* Move Public Updates and Internal Notes into the left column to avoid large vertical gaps */}
            {user.role !== "OFFICER" && (
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Public Updates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {publicUpdates.length > 0 ? (
                      <div className="space-y-3 mb-4">
                        {publicUpdates.map((update) => (
                          <div
                            key={update.id}
                            className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-semibold text-sm text-blue-900">
                                {update.authorName}
                              </p>
                              <p className="text-xs text-blue-600">
                                {new Date(update.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <p className="text-blue-800 text-sm">
                              {update.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm mb-4">
                        No public updates yet
                      </p>
                    )}
                    {user.role === "ADMIN" && (
                      <form
                        onSubmit={handleAddPublicUpdate}
                        className="space-y-3"
                      >
                        <Textarea
                          placeholder="Add a public update..."
                          value={newPublicUpdate}
                          onChange={(e) => setNewPublicUpdate(e.target.value)}
                          rows={3}
                        />
                        <Button type="submit" className="w-full">
                          Add Public Update
                        </Button>
                      </form>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {(user.role === "ADMIN" || user.role === "OFFICER") && (
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Internal Notes (Private)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {internalNotes.length > 0 ? (
                      <div className="space-y-3 mb-4">
                        {internalNotes.map((note) => (
                          <div
                            key={note.id}
                            className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-semibold text-sm text-gray-900">
                                {note.authorName}
                              </p>
                              <Badge className="bg-gray-200 text-gray-700 text-xs">
                                {note.authorRole}
                              </Badge>
                            </div>
                            <p className="text-gray-700 text-sm mb-2">
                              {note.content}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(note.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm mb-4">
                        No internal notes yet
                      </p>
                    )}
                    <form
                      onSubmit={handleAddInternalNote}
                      className="space-y-3"
                    >
                      <Textarea
                        placeholder="Add an internal note..."
                        value={newInternalNote}
                        onChange={(e) => setNewInternalNote(e.target.value)}
                        rows={3}
                      />
                      <Button type="submit" className="w-full">
                        Add Internal Note
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            )}
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
                    <p className="font-semibold text-gray-900">
                      #{complaint.id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-gray-500">Category</p>
                    <p className="font-semibold text-gray-900">
                      {complaint.category}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <AlertTriangle className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-gray-500">Priority</p>
                    <p className="font-semibold text-gray-900">
                      {complaint.priority}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-gray-500">Submitted On</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(complaint.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                </div>

                {complaint.updatedAt && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-gray-500">Last Updated</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(complaint.updatedAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {complaint.submitterName && (
                  <div className="flex items-center gap-3 text-sm">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-gray-500">Submitter</p>
                      <p className="font-semibold text-gray-900">
                        {complaint.submitterName}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Actions */}
            {(user.role === "OFFICER" || user.role === "ADMIN") && (
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">Status Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {user.role === "OFFICER" &&
                    complaint.assignedOfficer &&
                    complaint.assignedOfficer.id === user.id &&
                    complaint.status === "IN_PROGRESS" && (
                      <Button className="w-full" onClick={handleMarkCompleted}>
                        Mark as Completed
                      </Button>
                    )}
                  {user.role === "ADMIN" &&
                    complaint.status === "COMPLETED" && (
                      <Button className="w-full" onClick={handleMarkResolved}>
                        Mark as Resolved
                      </Button>
                    )}
                  {user.role === "ADMIN" &&
                    complaint.status !== "RESOLVED" &&
                    complaint.status !== "REJECTED" && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleAdminWithdraw}
                      >
                        Withdraw Complaint
                      </Button>
                    )}
                </CardContent>
              </Card>
            )}

            {complaint.status === "RESOLVED" && complaint.resolvedAt && (
              <Card className="border-0 shadow-md bg-green-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <AlertCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-green-900 mb-1">
                      Resolved
                    </h3>
                    <p className="text-sm text-green-700">
                      {new Date(complaint.resolvedAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {user.role === "ADMIN" && (
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Assign Officer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {complaint.assignedOfficer && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                        <p className="text-sm text-blue-700 font-medium">
                          Currently Assigned:
                        </p>
                        <p className="text-sm text-blue-900">
                          {complaint.assignedOfficer.name}
                        </p>
                        <p className="text-xs text-blue-600">
                          {complaint.assignedOfficer.email}
                        </p>
                      </div>
                    )}
                    <Label htmlFor="officer-select">Select Officer</Label>
                    <Select
                      id="officer-select"
                      onChange={(e) => setSelectedOfficerId(e.target.value)}
                      value={selectedOfficerId}
                    >
                      <option value="">-- Select Officer --</option>
                      {officers.map((officer) => (
                        <option key={officer.id} value={officer.id}>
                          {officer.name} ({officer.email})
                        </option>
                      ))}
                    </Select>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAssignOfficer(selectedOfficerId)}
                        className="flex-1"
                        disabled={!selectedOfficerId}
                      >
                        Submit
                      </Button>
                      {complaint.assignedOfficer && (
                        <Button
                          variant="outline"
                          onClick={handleUnassignOfficer}
                          className="flex-1"
                        >
                          Unassign
                        </Button>
                      )}
                    </div>
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
