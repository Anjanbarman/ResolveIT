import { useState } from "react";
import { Link } from "react-router-dom";
import { createComplaint, trackAnonymousComplaint } from "../services/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select } from "../components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  FileText,
  AlertCircle,
  Upload,
  CheckCircle2,
  LogIn,
  RefreshCw,
  Search,
  Copy,
  Clock,
  MapPin,
  Calendar,
} from "lucide-react";

export default function AnonymousSubmission() {
  const [activeTab, setActiveTab] = useState("submit"); // "submit" or "track"
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "SANITATION",
    priority: "MEDIUM",
    submitterName: "",
    submitterContact: "",
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  // Tracking state
  const [trackingId, setTrackingId] = useState("");
  const [trackingResult, setTrackingResult] = useState(null);
  const [trackingError, setTrackingError] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);

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
      formData.append("submitterName", form.submitterName);
      formData.append("submitterContact", form.submitterContact);
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

  const handleSubmitAnother = () => {
    setSuccess(null);
    setForm({
      title: "",
      description: "",
      category: "SANITATION",
      priority: "MEDIUM",
      submitterName: "",
      submitterContact: "",
    });
    setFile(null);
  };

  const copyTrackingId = (id) => {
    navigator.clipboard.writeText(id);
    alert("Tracking ID copied to clipboard!");
  };

  const handleTrackComplaint = async (e) => {
    e.preventDefault();
    setTrackingError("");
    setTrackingResult(null);
    setTrackingLoading(true);

    try {
      const result = await trackAnonymousComplaint(
        trackingId.toUpperCase().trim()
      );
      setTrackingResult(result);
    } catch (err) {
      setTrackingError(err.message);
    } finally {
      setTrackingLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
      IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-300",
      COMPLETED: "bg-purple-100 text-purple-800 border-purple-300",
      RESOLVED: "bg-green-100 text-green-800 border-green-300",
      REJECTED: "bg-red-100 text-red-800 border-red-300",
      WITHDRAWN: "bg-gray-100 text-gray-800 border-gray-300",
      UNRESOLVED: "bg-orange-100 text-orange-800 border-orange-300",
      REOPENED: "bg-indigo-100 text-indigo-800 border-indigo-300",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (success) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <Card className="shadow-xl border-0">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Complaint Submitted!
              </h2>
              <p className="text-lg text-gray-600 mb-4">
                Your complaint has been registered. Your tracking ID is:
              </p>
              <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 mb-4 max-w-md mx-auto">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl font-mono font-bold text-orange-600">
                    {success.trackingId}
                  </span>
                  <button
                    onClick={() => copyTrackingId(success.trackingId)}
                    className="p-2 hover:bg-amber-100 rounded-lg transition"
                    title="Copy tracking ID"
                  >
                    <Copy className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 max-w-md mx-auto">
                <p className="text-sm text-red-800">
                  <strong>⚠️ Important:</strong> Please save this tracking ID!
                  You will need it to check the status of your complaint.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    setActiveTab("track");
                    setTrackingId(success.trackingId);
                    setSuccess(null);
                    handleSubmitAnother();
                  }}
                  className="gap-2 w-full sm:w-auto"
                >
                  <Search className="w-4 h-4" />
                  Track This Complaint
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleSubmitAnother}
                  className="gap-2 w-full sm:w-auto"
                >
                  <RefreshCw className="w-4 h-4" />
                  Submit Another
                </Button>
                <Link to="/login">
                  <Button size="lg" className="gap-2 w-full sm:w-auto">
                    <LogIn className="w-4 h-4" />
                    Go to Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-600 to-amber-600 rounded-2xl mb-4 shadow-lg">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Anonymous Complaint
          </h1>
          <p className="text-gray-600">
            Submit a complaint or track an existing one
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex mb-0 bg-white rounded-t-xl shadow-lg border-b">
          <button
            onClick={() => setActiveTab("submit")}
            className={`flex-1 py-4 px-6 text-center font-semibold transition-all ${
              activeTab === "submit"
                ? "text-orange-600 border-b-2 border-orange-600 bg-orange-50"
                : "text-gray-500 hover:text-orange-600 hover:bg-gray-50"
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Submit Complaint
          </button>
          <button
            onClick={() => setActiveTab("track")}
            className={`flex-1 py-4 px-6 text-center font-semibold transition-all ${
              activeTab === "track"
                ? "text-orange-600 border-b-2 border-orange-600 bg-orange-50"
                : "text-gray-500 hover:text-orange-600 hover:bg-gray-50"
            }`}
          >
            <Search className="w-4 h-4 inline mr-2" />
            Track Complaint
          </button>
        </div>

        {/* Submit Complaint Tab */}
        {activeTab === "submit" && (
          <Card className="shadow-xl border-0 rounded-t-none mb-6">
            <CardHeader>
              <CardTitle className="text-2xl">Submit Anonymously</CardTitle>
              <CardDescription>
                Your complaint will be reviewed by our team. Optionally provide
                your contact information to receive updates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Your Name (Optional)</Label>
                  <Input
                    id="name"
                    type="text"
                    name="submitterName"
                    placeholder="John Doe"
                    value={form.submitterName}
                    onChange={onChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact">Contact Info (Optional)</Label>
                  <Input
                    id="contact"
                    type="text"
                    name="submitterContact"
                    placeholder="Email or phone number"
                    value={form.submitterContact}
                    onChange={onChange}
                  />
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Complaint Details
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">
                        Title <span className="text-red-500">*</span>
                      </Label>
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
                      <Label htmlFor="description">
                        Description <span className="text-red-500">*</span>
                      </Label>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">
                          Category <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          id="category"
                          name="category"
                          value={form.category}
                          onChange={onChange}
                        >
                          <option value="SANITATION">🧹 Sanitation</option>
                          <option value="TRAFFIC">🚗 Traffic</option>
                          <option value="WATER">💧 Water</option>
                          <option value="OTHER">📋 Other</option>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="priority">
                          Priority <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          id="priority"
                          name="priority"
                          value={form.priority}
                          onChange={onChange}
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="file">Attachment (Optional)</Label>
                      <Input
                        id="file"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="cursor-pointer"
                      />
                      {file && (
                        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                          <Upload className="w-4 h-4" />
                          <span>Selected: {file.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      "Submit Complaint"
                    )}
                  </Button>
                  <Link to="/login" className="flex-1">
                    <Button type="button" variant="outline" className="w-full">
                      Login Instead
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Track Complaint Tab */}
        {activeTab === "track" && (
          <Card className="shadow-xl border-0 rounded-t-none mb-6">
            <CardHeader>
              <CardTitle className="text-2xl">Track Your Complaint</CardTitle>
              <CardDescription>
                Enter your tracking ID to check the current status of your
                complaint.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTrackComplaint} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="trackingId">Tracking ID</Label>
                  <div className="flex gap-2">
                    <Input
                      id="trackingId"
                      type="text"
                      placeholder="Enter your tracking ID (e.g., ABC12345)"
                      value={trackingId}
                      onChange={(e) =>
                        setTrackingId(e.target.value.toUpperCase())
                      }
                      className="font-mono text-lg uppercase"
                      required
                    />
                    <Button
                      type="submit"
                      disabled={trackingLoading || !trackingId.trim()}
                    >
                      {trackingLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {trackingError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{trackingError}</AlertDescription>
                  </Alert>
                )}

                {/* Tracking Result */}
                {trackingResult && (
                  <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                    {/* Status Header */}
                    <div
                      className={`p-4 ${
                        getStatusColor(trackingResult.status)
                          .replace("text-", "bg-")
                          .split(" ")[0]
                      }`}
                    >
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(
                              trackingResult.status
                            )}`}
                          >
                            {trackingResult.status.replace("_", " ")}
                          </span>
                          <h3 className="text-xl font-bold mt-2 text-gray-900">
                            {trackingResult.title}
                          </h3>
                          <p className="text-gray-600 text-sm mt-1">
                            {trackingResult.statusDescription}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 font-mono text-sm bg-white px-2 py-1 rounded border">
                            {trackingResult.trackingId}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              copyTrackingId(trackingResult.trackingId)
                            }
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Copy className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="p-4 border-t bg-gray-50">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 flex items-center gap-1">
                            <FileText className="w-3 h-3" /> Category
                          </p>
                          <p className="font-semibold">
                            {trackingResult.category}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Priority
                          </p>
                          <p className="font-semibold">
                            {trackingResult.priority}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Submitted
                          </p>
                          <p className="font-semibold">
                            {formatDate(trackingResult.submittedAt)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Last Updated
                          </p>
                          <p className="font-semibold">
                            {formatDate(trackingResult.lastUpdatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Assignment Info */}
                    {trackingResult.assignedDepartment && (
                      <div className="p-4 border-t">
                        <p className="text-gray-500 text-sm flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Assignment Status
                        </p>
                        <p className="font-semibold text-orange-600">
                          {trackingResult.assignedDepartment}
                        </p>
                      </div>
                    )}

                    {/* Target Resolution Date */}
                    {trackingResult.targetResolutionDate && (
                      <div className="p-4 border-t bg-blue-50">
                        <p className="text-gray-500 text-sm">
                          Target Resolution Date
                        </p>
                        <p className="font-semibold text-blue-700">
                          {trackingResult.targetResolutionDate}
                        </p>
                      </div>
                    )}

                    {/* Resolution Notes */}
                    {trackingResult.resolutionNotes && (
                      <div className="p-4 border-t bg-green-50">
                        <p className="text-gray-500 text-sm">
                          Resolution Notes
                        </p>
                        <p className="font-semibold text-green-800">
                          {trackingResult.resolutionNotes}
                        </p>
                      </div>
                    )}

                    {/* Timeline */}
                    {trackingResult.timeline &&
                      trackingResult.timeline.length > 0 && (
                        <div className="p-4 border-t">
                          <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Timeline
                          </h4>
                          <div className="space-y-3">
                            {trackingResult.timeline.map((item, index) => (
                              <div key={index} className="flex items-start">
                                <div className="w-2 h-2 mt-2 rounded-full bg-orange-500 mr-3 flex-shrink-0"></div>
                                <div>
                                  <p className="font-semibold text-gray-800">
                                    {item.status.replace("_", " ")}
                                  </p>
                                  <p className="text-gray-500 text-sm">
                                    {item.description}
                                  </p>
                                  <p className="text-gray-400 text-xs">
                                    {formatDate(item.timestamp)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Public Updates */}
                    {trackingResult.publicUpdates &&
                      trackingResult.publicUpdates.length > 0 && (
                        <div className="p-4 border-t bg-blue-50">
                          <h4 className="font-semibold text-gray-700 mb-3">
                            Public Updates
                          </h4>
                          <div className="space-y-3">
                            {trackingResult.publicUpdates.map(
                              (update, index) => (
                                <div
                                  key={index}
                                  className="bg-white p-3 rounded-lg border"
                                >
                                  <p className="text-gray-700">
                                    {update.message}
                                  </p>
                                  <p className="text-gray-400 text-xs mt-1">
                                    {formatDate(update.createdAt)}
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-sm text-gray-600">
          Have an account?{" "}
          <Link
            to="/login"
            className="text-orange-600 hover:text-orange-700 font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
