import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  getUser,
  clearToken,
  clearUser,
  getComplaints,
  getAssignedComplaints,
  searchComplaints,
  downloadComplaintsCsv,
  downloadComplaintsPdf,
} from "../services/api";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  FileText,
  Plus,
  List,
  LogOut,
  Filter,
  Eye,
  Clock,
  AlertCircle,
  CheckCircle2,
  Home,
  Calendar,
} from "lucide-react";

export default function ComplaintList() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [trackingId, setTrackingId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const fromRef = useRef(null);
  const toRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    // Initialize filter from query string if provided
    try {
      const params = new URLSearchParams(location.search);
      const status = params.get("status");
      if (status) {
        const normalized = status.toUpperCase();
        setFilter(normalized);
      }
    } catch (_) {}
    loadComplaints();
  }, []);

  // Update filter when query changes (e.g., navigating from dashboard)
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const status = params.get("status");
      if (status) {
        const normalized = status.toUpperCase();
        setFilter(normalized);
      }
    } catch (_) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDownloadMenu && !event.target.closest('.relative')) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDownloadMenu]);

  async function loadComplaints() {
    try {
      const data =
        user.role === "OFFICER"
          ? await getAssignedComplaints()
          : await getComplaints();
      setComplaints(data);
    } catch (err) {
      console.error("Failed to load complaints", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e) {
    e?.preventDefault();
    try {
      const params = {
        trackingId: trackingId || undefined,
        keyword: keyword || undefined,
        category: category || undefined,
        priority: priority || undefined,
        status: filter !== "ALL" && filter !== "ASSIGNED" ? filter : undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
      };
      const results = await searchComplaints(params);
      setComplaints(results);
    } catch (err) {
      console.error("Search failed", err);
    }
  }

  async function handleDownloadCsv(ids) {
    try {
      const blob = await downloadComplaintsCsv(ids);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `complaints_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download failed", err);
      alert("Failed to download CSV");
    }
  }

  async function handleDownloadPdf(ids) {
    try {
      const blob = await downloadComplaintsPdf(ids);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `complaints_export_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download failed", err);
      alert("Failed to download PDF");
    }
  }

  function handleLogout() {
    clearToken();
    clearUser();
    navigate("/login", { replace: true });
  }

  if (!user) return null;

  const filteredComplaints = (() => {
    if (filter === "ALL") return complaints;
    // Officer-specific pseudo-filter: ASSIGNED
    if (filter === "ASSIGNED") {
      // Show only active assignments (exclude terminal states)
      const terminal = ["RESOLVED", "WITHDRAWN", "REJECTED"];
      return complaints.filter(
        (c) =>
          c.assignedOfficer &&
          c.assignedOfficer.id &&
          user &&
          c.assignedOfficer.id === user.id &&
          !terminal.includes(c.status)
      );
    }
    // Citizen/Admin: IN_PROGRESS should include COMPLETED (masked as in progress for them)
    if (
      (user.role === "CITIZEN" || user.role === "ADMIN") &&
      filter === "IN_PROGRESS"
    ) {
      return complaints.filter(
        (c) => c.status === "IN_PROGRESS" || c.status === "COMPLETED"
      );
    }
    return complaints.filter((c) => c.status === filter);
  })();

  const getStatusColor = (status) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
      IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
      COMPLETED: "bg-indigo-100 text-indigo-800 border-indigo-200",
      RESOLVED: "bg-green-100 text-green-800 border-green-200",
      REJECTED: "bg-red-100 text-red-800 border-red-200",
      WITHDRAWN: "bg-gray-100 text-gray-800 border-gray-200",
      UNRESOLVED: "bg-orange-100 text-orange-800 border-orange-200",
      REOPENED: "bg-purple-100 text-purple-800 border-purple-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      LOW: "bg-gray-100 text-gray-700 border-gray-200",
      MEDIUM: "bg-blue-100 text-blue-700 border-blue-200",
      HIGH: "bg-orange-100 text-orange-700 border-orange-200",
    };
    return colors[priority] || "bg-gray-100 text-gray-700";
  };

  const filterButtons = (() => {
    if (user.role === "OFFICER") {
      return [
        { value: "ALL", label: "All", icon: List },
        { value: "ASSIGNED", label: "Assigned", icon: List },
        { value: "IN_PROGRESS", label: "In Progress", icon: AlertCircle },
        { value: "COMPLETED", label: "Completed", icon: CheckCircle2 },
        { value: "RESOLVED", label: "Resolved", icon: CheckCircle2 },
      ];
    }
    // Citizen/Admin: hide Completed filter
    return [
      { value: "ALL", label: "All", icon: List },
      // Citizens can still pick Pending
      { value: "PENDING", label: "Pending", icon: Clock },
      { value: "IN_PROGRESS", label: "In Progress", icon: AlertCircle },
      { value: "RESOLVED", label: "Resolved", icon: CheckCircle2 },
    ];
  })();

  return (
    <div className="min-h-screen bg-gray-50">
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

      <main className="w-full px-3 sm:px-5 md:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1.5">
              {user.role === "OFFICER"
                ? "Assigned Complaints"
                : "My Complaints"}
            </h1>
            <p className="text-gray-600">
              {user.role === "OFFICER"
                ? "Complaints assigned to you"
                : "View and manage all your complaints"}
            </p>
          </div>
          <div className="relative">
            <Button
              variant="outline"
              size="lg"
              className="gap-2"
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
            >
              <FileText className="w-5 h-5" />
              {selectedIds.length > 0
                ? `Download (${selectedIds.length})`
                : "Download"}
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </Button>
            
            {showDownloadMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  <button
                    onClick={() => {
                      handleDownloadCsv(selectedIds);
                      setShowDownloadMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Download as CSV
                  </button>
                  <button
                    onClick={() => {
                      handleDownloadPdf(selectedIds);
                      setShowDownloadMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Download as PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <Card className="mb-4 border-0 shadow-md">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                Filter by Status
              </span>
            </div>
            <div className="inline-flex flex-wrap gap-2 mb-4">
              {filterButtons.map((btn) => (
                <Button
                  key={btn.value}
                  variant={filter === btn.value ? "default" : "outline"}
                  onClick={() => setFilter(btn.value)}
                  className="gap-2 h-9"
                  size="sm"
                >
                  <btn.icon className="w-4 h-4" />
                  {btn.label}
                </Button>
              ))}
            </div>
            <form
              className="flex flex-wrap gap-2 items-center"
              onSubmit={handleSearch}
            >
              <input
                type="text"
                placeholder="Tracking ID"
                className="border rounded-md px-3 py-1.5 text-sm h-9 w-[145px] focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
              />
              <input
                type="text"
                placeholder="Keyword"
                className="border rounded-md px-3 py-1.5 text-sm h-9 w-[160px] focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <select
                className="border rounded-md px-3 py-1.5 text-sm h-9 w-[130px] focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Category</option>
                <option value="SANITATION">Sanitation</option>
                <option value="TRAFFIC">Traffic</option>
                <option value="WATER">Water</option>
                <option value="OTHER">Other</option>
              </select>
              <select
                className="border rounded-md px-3 py-1.5 text-sm h-9 w-[115px] focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="">Priority</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
              <div
                className="relative inline-flex items-center border rounded-md px-3 py-1.5 text-sm bg-white cursor-pointer h-9 min-w-[90px] hover:bg-gray-50"
                onClick={() =>
                  fromRef.current?.showPicker
                    ? fromRef.current.showPicker()
                    : fromRef.current?.focus()
                }
              >
                <Calendar className="w-4 h-4 text-gray-500 mr-1.5" />
                <span className="text-gray-600">
                  {fromDate
                    ? new Date(fromDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "From"}
                </span>
                <input
                  type="date"
                  ref={fromRef}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div
                className="relative inline-flex items-center border rounded-md px-3 py-1.5 text-sm bg-white cursor-pointer h-9 min-w-[90px] hover:bg-gray-50"
                onClick={() =>
                  toRef.current?.showPicker
                    ? toRef.current.showPicker()
                    : toRef.current?.focus()
                }
              >
                <Calendar className="w-4 h-4 text-gray-500 mr-1.5" />
                <span className="text-gray-600">
                  {toDate
                    ? new Date(toDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "To"}
                </span>
                <input
                  type="date"
                  ref={toRef}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
              <Button type="submit" size="sm" className="h-9">
                Apply
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => {
                  setTrackingId("");
                  setKeyword("");
                  setCategory("");
                  setPriority("");
                  setFromDate("");
                  setToDate("");
                  loadComplaints();
                }}
              >
                Reset
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">
              {filteredComplaints.length} Complaint
              {filteredComplaints.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">Loading complaints...</p>
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 mb-2">No complaints found</p>
                <p className="text-sm text-gray-500 mb-4">
                  {filter === "ALL"
                    ? "Submit your first complaint to get started"
                    : `No ${filter.toLowerCase().replace("_", " ")} complaints`}
                </p>
                {filter === "ALL" && user.role === "CITIZEN" && (
                  <Link to="/complaints/new">
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Submit Complaint
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/50">
                      <th className="text-left py-2.5 px-3 font-semibold text-gray-600 w-10">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                          checked={
                            filteredComplaints.length > 0 &&
                            selectedIds.length === filteredComplaints.length
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(filteredComplaints.map((c) => c.id));
                            } else {
                              setSelectedIds([]);
                            }
                          }}
                        />
                      </th>
                      <th className="text-left py-2.5 px-3 font-semibold text-gray-600">
                        ID
                      </th>
                      <th className="text-left py-2.5 px-3 font-semibold text-gray-600">
                        Tracking
                      </th>
                      <th className="text-left py-2.5 px-3 font-semibold text-gray-600">
                        Title
                      </th>
                      <th className="text-left py-2.5 px-3 font-semibold text-gray-600">
                        Category
                      </th>
                      <th className="text-left py-2.5 px-3 font-semibold text-gray-600">
                        Priority
                      </th>
                      <th className="text-left py-2.5 px-3 font-semibold text-gray-600">
                        Status
                      </th>
                      <th className="text-left py-2.5 px-3 font-semibold text-gray-600">
                        Created
                      </th>
                      <th className="text-left py-2.5 px-3 font-semibold text-gray-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComplaints.map((complaint) => (
                      <tr
                        key={complaint.id}
                        className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors"
                      >
                        <td className="py-2.5 px-3">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                            checked={selectedIds.includes(complaint.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds([...selectedIds, complaint.id]);
                              } else {
                                setSelectedIds(
                                  selectedIds.filter((id) => id !== complaint.id)
                                );
                              }
                            }}
                          />
                        </td>
                        <td className="py-2.5 px-3 font-medium text-gray-900">
                          #{complaint.id}
                        </td>
                        <td className="py-2.5 px-3 text-gray-900 font-medium">
                          {complaint.trackingId}
                        </td>
                        <td className="py-2.5 px-3 text-gray-900 font-medium">
                          {complaint.title}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600">
                          {complaint.category}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge
                            className={
                              getPriorityColor(complaint.priority) + " border"
                            }
                          >
                            {complaint.priority}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge
                            className={
                              getStatusColor(
                                (user.role === "CITIZEN" ||
                                  user.role === "ADMIN") &&
                                  complaint.status === "COMPLETED"
                                  ? "IN_PROGRESS"
                                  : complaint.status
                              ) + " border"
                            }
                          >
                            {((user.role === "CITIZEN" ||
                              user.role === "ADMIN") &&
                            complaint.status === "COMPLETED"
                              ? "IN_PROGRESS"
                              : complaint.status
                            ).replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-gray-600">
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2"
                            onClick={() => {
                              console.log(
                                "Navigating to complaint:",
                                complaint.id
                              );
                              navigate(`/complaints/${complaint.id}`);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
