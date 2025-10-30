import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getUser, clearToken, clearUser, getComplaints } from "../services/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { FileText, Plus, List, LogOut, Filter, Eye, Clock, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ComplaintList() {
  const navigate = useNavigate();
  const user = getUser();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    loadComplaints();
  }, []);

  async function loadComplaints() {
    try {
      const data = await getComplaints();
      setComplaints(data);
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

  if (!user) return null;

  const filteredComplaints = filter === "ALL"
    ? complaints
    : complaints.filter(c => c.status === filter);

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

  const filterButtons = [
    { value: "ALL", label: "All", icon: List },
    { value: "PENDING", label: "Pending", icon: Clock },
    { value: "IN_PROGRESS", label: "In Progress", icon: AlertCircle },
    { value: "RESOLVED", label: "Resolved", icon: CheckCircle2 },
  ];

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Complaints</h1>
            <p className="text-gray-600">View and manage all your complaints</p>
          </div>
          <Link to="/complaints/new">
            <Button size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              New Complaint
            </Button>
          </Link>
        </div>

        <Card className="mb-6 border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filter by Status</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {filterButtons.map((btn) => (
                <Button
                  key={btn.value}
                  variant={filter === btn.value ? "default" : "outline"}
                  onClick={() => setFilter(btn.value)}
                  className="gap-2"
                >
                  <btn.icon className="w-4 h-4" />
                  {btn.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">
              {filteredComplaints.length} Complaint{filteredComplaints.length !== 1 ? 's' : ''}
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
                  {filter === "ALL" ? "Submit your first complaint to get started" : `No ${filter.toLowerCase().replace("_", " ")} complaints`}
                </p>
                {filter === "ALL" && (
                  <Link to="/complaints/new">
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Submit Complaint
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Title</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Category</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Priority</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Created</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComplaints.map((complaint) => (
                      <tr key={complaint.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 text-sm font-medium text-gray-900">#{complaint.id}</td>
                        <td className="py-4 px-4 text-sm text-gray-900 font-medium">{complaint.title}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">{complaint.category}</td>
                        <td className="py-4 px-4">
                          <Badge className={getPriorityColor(complaint.priority) + " border"}>
                            {complaint.priority}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={getStatusColor(complaint.status) + " border"}>
                            {complaint.status.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <Link to={`/complaints/${complaint.id}`}>
                            <Button variant="ghost" size="sm" className="gap-2">
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                          </Link>
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
