import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  getUser,
  clearToken,
  clearUser,
  getComplaints,
  getAssignedComplaints,
  getAdminMetrics,
  getOfficerMetrics,
} from "../services/api";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  StatusDistributionChart,
  CategoryBarChart,
  PriorityBarChart,
} from "../components/Charts";
import {
  FileText,
  Plus,
  List,
  LogOut,
  User,
  Mail,
  Shield,
  Clock,
  AlertCircle,
  Home,
  Info,
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const [complaints, setComplaints] = useState([]); // recent (for table)
  const [allComplaints, setAllComplaints] = useState([]); // full list for fallback stats
  const [metrics, setMetrics] = useState(null); // server metrics
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    loadComplaints();
  }, []);

  async function loadComplaints() {
    try {
      const data =
        user.role === "OFFICER"
          ? await getAssignedComplaints()
          : await getComplaints();
      setAllComplaints(data);
      setComplaints(data.slice(0, 5));
      // Fetch metrics if admin/officer
      if (user.role === "ADMIN") {
        const m = await getAdminMetrics();
        setMetrics(m);
      } else if (user.role === "OFFICER") {
        const m = await getOfficerMetrics();
        setMetrics(m);
      }
    } catch (err) {
      console.error("Failed to load complaints", err);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearToken();
    clearUser();
    navigate("/login", { replace: true });
  }

  function goToComplaints(status) {
    const qs = status ? `?status=${encodeURIComponent(status)}` : "";
    navigate(`/complaints${qs}`);
  }

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

  const getPriorityColor = (priority) => {
    const colors = {
      LOW: "bg-gray-100 text-gray-700 border-gray-200",
      MEDIUM: "bg-blue-100 text-blue-700 border-blue-200",
      HIGH: "bg-orange-100 text-orange-700 border-orange-200",
      URGENT: "bg-red-100 text-red-700 border-red-200",
    };
    return colors[priority] || "bg-gray-100 text-gray-700";
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const displayStatusForRole = (status) => {
    // Hide "COMPLETED" on dashboard for non-officers; show as IN_PROGRESS instead
    if (status === "COMPLETED" && user.role !== "OFFICER") return "IN_PROGRESS";
    return status;
  };

  const stats = (() => {
    // Admin: Total, Pending, Resolved (reduced); provide optional avg as info
    if (metrics && user.role === "ADMIN") {
      return [
        {
          label: "Total Complaints",
          value: metrics.total,
          icon: FileText,
          color: "text-violet-600",
          clickStatus: "ALL",
        },
        {
          label: "Pending Complaints",
          value: metrics.pending,
          icon: Clock,
          color: "text-yellow-600",
          clickStatus: "PENDING",
        },
        {
          label: "Resolved Complaints",
          value: metrics.resolved,
          icon: AlertCircle,
          color: "text-green-600",
          clickStatus: "RESOLVED",
        },
      ];
    }
    if (metrics && user.role === "OFFICER") {
      return [
        {
          label: "Active Assigned",
          value: metrics.totalAssigned,
          icon: FileText,
          color: "text-violet-600",
          clickStatus: "ASSIGNED",
        },
        {
          label: "Completed",
          value: metrics.completed,
          icon: AlertCircle,
          color: "text-indigo-600",
          clickStatus: "COMPLETED",
        },
        {
          label: "In Progress",
          value: metrics.inProgress,
          icon: AlertCircle,
          color: "text-blue-600",
          clickStatus: "IN_PROGRESS",
        },
      ];
    }
    // Citizen fallback (client-side only)
    return [
      {
        label: "Total Complaints",
        value: allComplaints.length,
        icon: FileText,
        color: "text-violet-600",
        clickStatus: "ALL",
      },
      {
        label: "Pending Complaints",
        value: allComplaints.filter((c) => c.status === "PENDING").length,
        icon: Clock,
        color: "text-yellow-600",
        clickStatus: "PENDING",
      },
      {
        label: "Resolved Complaints",
        value: allComplaints.filter((c) => c.status === "RESOLVED").length,
        icon: AlertCircle,
        color: "text-green-600",
        clickStatus: "RESOLVED",
      },
    ];
  })();

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

      {/* Main Content */}
      <main className="w-full px-3 sm:px-5 md:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6">
        {/* Welcome Banner (compact) */}
        <Card className="mb-4 border-0 shadow-md bg-gradient-to-r from-violet-600 to-purple-600 text-white">
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <CardTitle className="text-2xl truncate text-white">
                  Welcome back, {user.name}!
                </CardTitle>
                <CardDescription className="text-violet-100 text-sm truncate">
                  {user.email}
                </CardDescription>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6`}
        >
          {stats.map((stat, index) => (
            <Card
              key={index}
              onClick={() =>
                stat.clickStatus && goToComplaints(stat.clickStatus)
              }
              className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && stat.clickStatus) {
                  e.preventDefault();
                  goToComplaints(stat.clickStatus);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`${stat.color} bg-opacity-10 p-3 rounded-lg`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {/* Avg Resolution card removed for admin as requested */}
        </div>

        {/* Quick Actions removed; moved into Recent Complaints header */}

        {/* Charts */}
        {user.role !== "CITIZEN" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusDistributionChart complaints={allComplaints} />
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">By Category</CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryBarChart complaints={allComplaints} />
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">By Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <PriorityBarChart complaints={allComplaints} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Complaints */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <CardTitle className="text-2xl">Recent Complaints</CardTitle>
                <CardDescription>
                  {user.role === "OFFICER"
                    ? "Recently assigned to you"
                    : user.role === "ADMIN"
                    ? "Latest complaints"
                    : "Your most recent complaint submissions"}
                </CardDescription>
              </div>
              <div className="shrink-0 flex gap-2">
                {user.role === "CITIZEN" && (
                  <Link to="/complaints/new">
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      New Complaint
                    </Button>
                  </Link>
                )}
                <Link to="/complaints">
                  <Button variant="outline" className="gap-2">
                    <List className="w-4 h-4" />
                    {user.role === "OFFICER" ? "View Assigned" : "View All"}
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">Loading complaints...</p>
              </div>
            ) : complaints.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 mb-2">No complaints yet</p>
                {user.role === "CITIZEN" && (
                  <>
                    <p className="text-sm text-gray-500 mb-4">
                      Submit your first complaint to get started
                    </p>
                    <Link to="/complaints/new">
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Submit Complaint
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="max-h-[420px] overflow-y-auto border rounded-md">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 sticky top-0 bg-white z-10">
                        <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">
                          ID
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">
                          Tracking
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">
                          Title
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">
                          Category
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">
                          Priority
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {complaints.map((complaint) => (
                        <tr
                          key={complaint.id}
                          onClick={() =>
                            navigate(`/complaints/${complaint.id}`)
                          }
                          className="border-b border-gray-100 hover:bg-gray-50/80 hover:shadow-sm cursor-pointer transition-colors"
                        >
                          <td className="py-4 px-4 text-sm font-medium text-gray-900">
                            #{complaint.id}
                          </td>
                          <td className="py-4 px-4 text-xs text-gray-600 font-mono">
                            {complaint.trackingId}
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-900 font-medium max-w-[160px] truncate">
                            {complaint.title}
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-600">
                            {complaint.category}
                          </td>
                          <td className="py-4 px-4">
                            <Badge
                              className={
                                getPriorityColor(complaint.priority) + " border"
                              }
                            >
                              {complaint.priority}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
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
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-600">
                            {new Date(complaint.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
