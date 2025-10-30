import { useState } from "react";
import { Link } from "react-router-dom";
import { createComplaint } from "../services/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select } from "../components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { FileText, AlertCircle, Upload, CheckCircle2, LogIn, RefreshCw } from "lucide-react";

export default function AnonymousSubmission() {
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

  if (success) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <Card className="shadow-xl border-0">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Complaint Submitted!</h2>
              <p className="text-lg text-gray-600 mb-4">
                Your complaint has been registered with ID: <span className="font-semibold text-orange-600">#{success.id}</span>
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 max-w-md mx-auto">
                <p className="text-sm text-amber-800">
                  <strong>Important:</strong> Please save this ID for your records. You can use it to track your complaint.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/login">
                  <Button size="lg" className="gap-2 w-full sm:w-auto">
                    <LogIn className="w-4 h-4" />
                    Go to Login
                  </Button>
                </Link>
                <Button size="lg" variant="outline" onClick={handleSubmitAnother} className="gap-2 w-full sm:w-auto">
                  <RefreshCw className="w-4 h-4" />
                  Submit Another
                </Button>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Anonymous Complaint</h1>
          <p className="text-gray-600">Submit a complaint without creating an account</p>
        </div>

        <Card className="shadow-xl border-0 mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Submit Anonymously</CardTitle>
            <CardDescription>
              Your complaint will be reviewed by our team. Optionally provide your contact information to receive updates.
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Complaint Details</h3>

                <div className="space-y-4">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <p className="text-center text-sm text-gray-600">
          Have an account?{" "}
          <Link to="/login" className="text-orange-600 hover:text-orange-700 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
