import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getUser,
  clearToken,
  clearUser,
  getComplaint,
  getOfficers,
  assignOfficer,
  unassignOfficer,
  addInternalNote,
  getInternalNotes,
  addPublicUpdate,
  getPublicUpdates,
  updateComplaintStatus,
  reopenComplaint,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import {
  FileText,
  Users,
  MessageSquare,
  AlertCircle,
  List,
  LogOut,
  Home,
} from "lucide-react";

export default function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getUser();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [officers, setOfficers] = useState([]);
  const [internalNotes, setInternalNotes] = useState([]);
  const [publicUpdates, setPublicUpdates] = useState([]);
  const [newInternalNote, setNewInternalNote] = useState("");
  const [newPublicUpdate, setNewPublicUpdate] = useState("");
  const [selectedOfficerId, setSelectedOfficerId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [activeTab, setActiveTab] = useState("public");
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [reopenFeedback, setReopenFeedback] = useState("");

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

      setActiveTab(user.role === "OFFICER" ? "internal" : "public");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Map complaint status to a step index for the visual timeline
  const getTimelineStep = (status) => {
    switch (status) {
      case "PENDING":
        return 0;
      case "IN_PROGRESS":
      case "UNRESOLVED":
        return 1;
      case "COMPLETED":
      case "RESOLVED":
        return 2;
      default:
        return 0;
    }
  };

  async function handleAssignOfficer(officerId) {
    try {
      await assignOfficer(id, officerId, deadline || null);
      await loadComplaint();
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

  async function handleReopen() {
    try {
      await reopenComplaint(id, reopenFeedback);
      setShowReopenDialog(false);
      setReopenFeedback("");
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

  function handleLogout() {
    clearToken();
    clearUser();
    navigate("/login", { replace: true });
  }

  const getStatusColor = (status) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
      IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
      COMPLETED: "bg-indigo-100 text-indigo-800 border-indigo-200",
      RESOLVED: "bg-green-100 text-green-800 border-green-200",
      UNRESOLVED: "bg-orange-100 text-orange-800 border-orange-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      LOW: "bg-gray-100 text-gray-700",
      MEDIUM: "bg-blue-100 text-blue-700",
      HIGH: "bg-orange-100 text-orange-700",
      URGENT: "bg-red-100 text-red-700",
    };
    return colors[priority] || "bg-gray-100 text-gray-700";
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-gray-600 text-sm">Loading complaint...</p>
        </div>
      </div>
    );

  if (!complaint)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Complaint not found</AlertDescription>
        </Alert>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="w-full px-3 sm:px-5 md:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">ResolveIt</h1>
            </div>
            <nav className="flex items-center gap-4">
              {user.role === "CITIZEN" && (
                <Link to="/welcome">
                  <Button variant="ghost" className="gap-2">
                    <Home className="w-4 h-4" />
                    Home
                  </Button>
                </Link>
              )}
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

      {/* Two-column layout */}
      <main className="w-full px-3 sm:px-5 md:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT COLUMN - Main Complaint Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Complaint Details Card */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {complaint.title}
                </CardTitle>
                <div className="flex gap-2 flex-shrink-0">
                  <Badge
                    className={
                      getStatusColor(complaint.status) +
                      " border text-xs font-medium"
                    }
                  >
                    {complaint.status.replace("_", " ")}
                  </Badge>
                  <Badge
                    className={
                      getPriorityColor(complaint.priority) +
                      " border text-xs font-medium"
                    }
                  >
                    {complaint.priority}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">
                  DESCRIPTION
                </h3>
                <div className="border border-gray-200 rounded-md bg-gray-50 p-3 min-h-[100px]">
                  <p className="text-gray-900 whitespace-pre-wrap text-sm leading-relaxed">
                    {complaint.description}
                  </p>
                </div>
              </div>

              {/* Complaint Information Grid */}
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">
                  COMPLAINT INFORMATION
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white border border-gray-200 rounded-md p-3">
                    <p className="text-xs text-gray-500 mb-1 uppercase">
                      Complaint ID
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      #{complaint.id}
                    </p>
                  </div>
                  {complaint.trackingId && (
                    <div className="bg-white border border-gray-200 rounded-md p-3">
                      <p className="text-xs text-gray-500 mb-1 uppercase">
                        Tracking ID
                      </p>
                      <p className="text-sm font-semibold text-gray-900 break-all">
                        {complaint.trackingId}
                      </p>
                    </div>
                  )}
                  <div className="bg-white border border-gray-200 rounded-md p-3">
                    <p className="text-xs text-gray-500 mb-1 uppercase">
                      Category
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {complaint.category}
                    </p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-md p-3">
                    <p className="text-xs text-gray-500 mb-1 uppercase">
                      Submitted On
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(complaint.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                  {complaint.updatedAt && (
                    <div className="bg-white border border-gray-200 rounded-md p-3">
                      <p className="text-xs text-gray-500 mb-1 uppercase">
                        Last Updated
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(complaint.updatedAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  )}
                  {complaint.targetResolutionDate && (
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                      <p className="text-xs text-amber-700 mb-1 uppercase">
                        Resolution Deadline
                      </p>
                      <p className="text-sm font-semibold text-amber-900">
                        {new Date(
                          complaint.targetResolutionDate
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                  {complaint.assignedOfficer && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <p className="text-xs text-blue-700 mb-1 uppercase">
                        Assigned Officer
                      </p>
                      <p className="text-sm font-semibold text-blue-900">
                        {complaint.assignedOfficer.name}
                      </p>
                    </div>
                  )}
                  {complaint.reporter && (
                    <div className="bg-violet-50 border border-violet-200 rounded-md p-3">
                      <p className="text-xs text-violet-700 mb-1 uppercase">
                        Reporter
                      </p>
                      <p className="text-sm font-semibold text-violet-900">
                        {complaint.reporter.name || complaint.reporter.email}
                      </p>
                    </div>
                  )}
                  {complaint.attachmentPath && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <p className="text-xs text-green-700 mb-1 uppercase">
                        Attachment
                      </p>
                      <a
                        href={complaint.attachmentPath}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-green-700 hover:text-green-900 hover:underline"
                      >
                        View File
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Complaint Timeline */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Complaint Timeline
                </CardTitle>
                <Badge
                  className={
                    getStatusColor(complaint.status) +
                    " border text-xs font-semibold shadow-sm"
                  }
                >
                  {complaint.status.replace("_", " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const steps = [
                  { key: "PENDING", label: "Pending" },
                  { key: "IN_PROGRESS", label: "Under Review" },
                  { key: "RESOLVED", label: "Resolved" },
                ];
                const current = getTimelineStep(complaint.status);
                return (
                  <div>
                    {/* Timeline circles and lines */}
                    <div className="relative flex items-center w-full mb-3">
                      {/* Connecting lines with colors */}
                      <div
                        className="absolute inset-0 flex items-center px-6"
                        aria-hidden="true"
                      >
                        <div className="flex items-center w-full">
                          {/* First line segment (Pending to In Progress) */}
                          <div
                            className={`flex-1 h-0.5 transition-all ${
                              current >= 1 ? "bg-green-500" : "bg-gray-300"
                            }`}
                          ></div>
                          {/* Second line segment (In Progress to Resolved) */}
                          <div
                            className={`flex-1 h-0.5 transition-all ${
                              current >= 2
                                ? "bg-green-500"
                                : current === 1
                                ? "bg-blue-400"
                                : "bg-gray-300"
                            }`}
                          ></div>
                        </div>
                      </div>
                      <div className="relative flex justify-between w-full">
                        {steps.map((step, idx) => {
                          const isDone = idx < current;
                          const isCurrent = idx === current;
                          const isUpcoming = idx > current;
                          return (
                            <div
                              key={step.key}
                              className={
                                "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all shadow-sm bg-white " +
                                (isDone
                                  ? "border-green-500"
                                  : isCurrent
                                  ? "border-blue-500 ring-4 ring-blue-100"
                                  : "border-gray-300")
                              }
                            >
                              <div
                                className={
                                  "flex items-center justify-center w-full h-full rounded-full " +
                                  (isDone
                                    ? "bg-green-500 text-white"
                                    : isCurrent
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-100 text-gray-400")
                                }
                              >
                                {isDone ? (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="w-5 h-5"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                ) : isCurrent ? (
                                  <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                                ) : (
                                  <div className="w-2 h-2 bg-gray-400 rounded-full" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Timeline labels - directly below circles */}
                    <div className="flex justify-between w-full -mt-1">
                      {steps.map((step, idx) => {
                        const isDone = idx < current;
                        const isCurrent = idx === current;
                        const isUpcoming = idx > current;
                        return (
                          <div key={step.key} className="w-20">
                            <p
                              className={
                                "text-sm font-medium text-center leading-tight whitespace-nowrap " +
                                (isCurrent
                                  ? "text-blue-600 font-semibold"
                                  : isDone
                                  ? "text-gray-700"
                                  : "text-gray-500")
                              }
                            >
                              {step.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN - Actions and Updates */}
        <div className="lg:col-span-1 space-y-4">
          {/* Actions Card */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Actions
              </CardTitle>
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
              {user.role === "ADMIN" && complaint.status === "COMPLETED" && (
                <Button className="w-full" onClick={handleMarkResolved}>
                  Mark as Resolved
                </Button>
              )}
              {user.role === "CITIZEN" && complaint.status === "RESOLVED" && (
                <Button
                  onClick={() => setShowReopenDialog(true)}
                  variant="outline"
                  className="w-full"
                >
                  Reopen Complaint
                </Button>
              )}

              {user.role === "ADMIN" && (
                <div className="pt-3 border-t border-gray-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <p className="font-medium text-sm text-gray-800">
                      Assign Officer
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm mb-1">Select Officer</Label>
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
                  </div>
                  <div>
                    <Label className="text-sm mb-1">Resolution Deadline</Label>
                    <Input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAssignOfficer(selectedOfficerId)}
                      disabled={!selectedOfficerId}
                      className="flex-1"
                    >
                      Assign
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
              )}
            </CardContent>
          </Card>

          {/* Updates & Notes Card */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <MessageSquare className="w-4 h-4" />
                Updates & Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Tabs */}
              <div className="border-b border-gray-200 mb-3 flex gap-1">
                {user.role !== "OFFICER" && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("public")}
                    className={`px-3 py-2 text-sm font-medium rounded-t-md transition-colors ${
                      activeTab === "public"
                        ? "bg-white border border-b-0 text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Public Updates
                  </button>
                )}
                {(user.role === "ADMIN" || user.role === "OFFICER") && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("internal")}
                    className={`px-3 py-2 text-sm font-medium rounded-t-md transition-colors ${
                      activeTab === "internal"
                        ? "bg-white border border-b-0 text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Internal Notes
                  </button>
                )}
              </div>

              {/* Public Tab */}
              {activeTab === "public" && user.role !== "OFFICER" && (
                <div className="space-y-3">
                  {publicUpdates.length > 0 ? (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {publicUpdates.map((update) => (
                        <div
                          key={update.id}
                          className="bg-blue-50 border border-blue-200 rounded-md p-3"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-semibold text-sm text-blue-900">
                              {update.authorName}
                            </p>
                            <p className="text-xs text-blue-600">
                              {new Date(update.createdAt).toLocaleString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                          <p className="text-blue-900 text-sm whitespace-pre-wrap">
                            {update.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500 text-sm">
                        No public updates yet
                      </p>
                    </div>
                  )}

                  {user.role === "ADMIN" && (
                    <form
                      onSubmit={handleAddPublicUpdate}
                      className="space-y-2 pt-2 border-t border-gray-200"
                    >
                      <Textarea
                        placeholder="Add a public update..."
                        value={newPublicUpdate}
                        onChange={(e) => setNewPublicUpdate(e.target.value)}
                        rows={3}
                        className="resize-none text-sm"
                      />
                      <Button type="submit" className="w-full">
                        Add Public Update
                      </Button>
                    </form>
                  )}
                </div>
              )}

              {/* Internal Notes Tab */}
              {activeTab === "internal" &&
                (user.role === "ADMIN" || user.role === "OFFICER") && (
                  <div className="space-y-3">
                    {internalNotes.length > 0 ? (
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {internalNotes.map((note) => (
                          <div
                            key={note.id}
                            className="bg-gray-50 border border-gray-200 rounded-md p-3"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <div>
                                <p className="font-semibold text-sm text-gray-900">
                                  {note.authorName}
                                </p>
                                <Badge className="bg-gray-200 text-gray-700 text-xs mt-1 border-0">
                                  {note.authorRole}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500">
                                {new Date(note.createdAt).toLocaleString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </p>
                            </div>
                            <p className="text-gray-800 text-sm whitespace-pre-wrap mt-1">
                              {note.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                        <p className="text-gray-500 text-sm">
                          No internal notes yet
                        </p>
                      </div>
                    )}
                    <form
                      onSubmit={handleAddInternalNote}
                      className="space-y-2 pt-2 border-t border-gray-200"
                    >
                      <Textarea
                        placeholder="Add an internal note..."
                        value={newInternalNote}
                        onChange={(e) => setNewInternalNote(e.target.value)}
                        rows={3}
                        className="resize-none text-sm"
                      />
                      <Button type="submit" className="w-full">
                        Add Internal Note
                      </Button>
                    </form>
                  </div>
                )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Reopen Complaint Dialog */}
      <Dialog open={showReopenDialog} onOpenChange={setShowReopenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reopen Complaint</DialogTitle>
            <DialogDescription>
              Please provide feedback on why you are reopening this complaint.
              This will help us improve our service and address your concerns.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="feedback" className="text-sm font-medium">
                Feedback / Reason for Reopening
              </Label>
              <Textarea
                id="feedback"
                placeholder="Please explain why you're not satisfied with the resolution..."
                value={reopenFeedback}
                onChange={(e) => setReopenFeedback(e.target.value)}
                rows={5}
                className="mt-2"
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReopenDialog(false);
                setReopenFeedback("");
                setError("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleReopen} disabled={!reopenFeedback.trim()}>
              Submit & Reopen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
