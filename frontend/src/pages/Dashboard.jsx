import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  getUser,
  clearToken,
  clearUser,
  getComplaints,
  getAssignedComplaints,
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
  FileText,
  Plus,
  List,
  LogOut,
  User,
  Mail,
  Shield,
  Clock,
  AlertCircle,
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const [complaints, setComplaints] = useState([]); // recent (for table)
  const [allComplaints, setAllComplaints] = useState([]); // full (for stats)
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

  if (!user) return null;

  const displayStatusForRole = (status) => {
    // Hide "COMPLETED" on dashboard for non-officers; show as IN_PROGRESS instead
    if (status === "COMPLETED" && user.role !== "OFFICER") return "IN_PROGRESS";
    return status;
  };

  const stats = (() => {
    const terminal = ["RESOLVED", "WITHDRAWN", "REJECTED"];
    if (user.role === "OFFICER") {
      return [
        {
          label: "Assigned",
          // Count only active assignments (exclude terminal states)
          value: allComplaints.filter((c) => !terminal.includes(c.status))
            .length,
          icon: FileText,
          color: "text-violet-600",
        },
        {
          label: "Completed",
          value: allComplaints.filter((c) => c.status === "COMPLETED").length,
          icon: AlertCircle,
          color: "text-indigo-600",
        },
      ];
    }
    // Citizen/Admin
    return [
      {
        label: user.role === "ADMIN" ? "Total Complaints" : "Total Complaints",
        value: allComplaints.length,
        icon: FileText,
        color: "text-violet-600",
      },
      {
        label: "Pending",
        value: allComplaints.filter((c) => c.status === "PENDING").length,
        icon: Clock,
        color: "text-yellow-600",
      },
      {
        label: "In Progress",
        value: allComplaints.filter(
          (c) => c.status === "IN_PROGRESS" || c.status === "COMPLETED"
        ).length,
        icon: AlertCircle,
        color: "text-blue-600",
      },
    ];
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <Card className="mb-8 border-0 shadow-md bg-gradient-to-br from-violet-600 to-purple-600 text-white">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl mb-2 text-white">
                  Welcome back, {user.name}!
                </CardTitle>
                <CardDescription className="text-violet-100 text-base">
                  Manage your complaints and track their progress
                </CardDescription>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                <User className="w-8 h-8 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <Shield className="w-4 h-4" />
                <span className="font-medium">{user.role}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="border-0 shadow-md hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
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
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 mb-8">
          {user.role === "CITIZEN" && (
            <Link to="/complaints/new">
              <Button size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                Submit New Complaint
              </Button>
            </Link>
          )}
          <Link to="/complaints">
            <Button size="lg" variant="outline" className="gap-2">
              <List className="w-5 h-5" />
              {user.role === "OFFICER"
                ? "View Assigned Complaints"
                : "View All Complaints"}
            </Button>
          </Link>
        </div>

        {/* Recent Complaints */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl">Recent Complaints</CardTitle>
            <CardDescription>
              {user.role === "OFFICER"
                ? "Recently assigned to you"
                : user.role === "ADMIN"
                ? "Latest complaints"
                : "Your most recent complaint submissions"}
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">
                        ID
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
                        onClick={() => navigate(`/complaints/${complaint.id}`)}
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="py-4 px-4 text-sm font-medium text-gray-900">
                          #{complaint.id}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-900 font-medium">
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
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
