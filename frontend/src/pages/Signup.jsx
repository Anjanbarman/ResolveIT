import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup, sendOtp, verifyOtp } from "../services/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select } from "../components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  AlertCircle,
  User,
  Mail,
  Lock,
  FileText,
  Shield,
  Phone,
  CheckCircle,
} from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "CITIZEN",
    phoneNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // OTP states
  const [showOtpSection, setShowOtpSection] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Validate Indian phone number (10 digits starting with 6-9)
  const isValidIndianPhone = (phone) => {
    const cleaned = phone.replace(/^(\+91|91)/, "").trim();
    return /^[6-9]\d{9}$/.test(cleaned);
  };

  const handleSendOtp = async () => {
    if (!form.phoneNumber) {
      setError("Please enter a phone number");
      return;
    }
    if (!isValidIndianPhone(form.phoneNumber)) {
      setError("Invalid Indian phone number. Must be 10 digits.");
      return;
    }

    setError("");
    setOtpLoading(true);
    try {
      await sendOtp(form.phoneNumber);
      setOtpSent(true);
      setSuccess("OTP sent! Check your phone or the server console.");
    } catch (err) {
      setError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setError("");
    setOtpLoading(true);
    try {
      await verifyOtp(form.phoneNumber, otpCode);
      setPhoneVerified(true);
      setSuccess("Phone number verified successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      // Include phone number only if verified
      const signupData = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      };

      if (phoneVerified && form.phoneNumber) {
        signupData.phoneNumber = form.phoneNumber
          .replace(/^(\+91|91)/, "")
          .trim();
      }

      await signup(signupData);
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl mb-4 shadow-lg">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Join ResolveIt
          </h1>
          <p className="text-gray-600">Create your account to get started</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              Create Account
            </CardTitle>
            <CardDescription className="text-center">
              Sign up to submit and track your complaints
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-emerald-200 bg-emerald-50">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <AlertDescription className="text-emerald-700">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    name="name"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={onChange}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={onChange}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="At least 6 characters"
                    value={form.password}
                    onChange={onChange}
                    required
                    minLength={6}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Account Type</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                  <Select
                    id="role"
                    name="role"
                    value={form.role}
                    onChange={onChange}
                    className="pl-10"
                  >
                    <option value="CITIZEN">
                      Citizen - Submit and track complaints
                    </option>
                    <option value="OFFICER">Officer - Manage complaints</option>
                    <option value="ADMIN">Admin - Full system access</option>
                  </Select>
                </div>
              </div>

              {/* Optional Phone Verification Section */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Phone Verification (Optional)
                  </Label>
                  {!showOtpSection && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowOtpSection(true)}
                      className="text-emerald-600 hover:text-emerald-700"
                    >
                      + Add Phone
                    </Button>
                  )}
                </div>

                {showOtpSection && (
                  <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber" className="text-sm">
                        Enter Mobile Number
                      </Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="phoneNumber"
                            type="tel"
                            name="phoneNumber"
                            placeholder="9876543210"
                            value={form.phoneNumber}
                            onChange={onChange}
                            disabled={phoneVerified}
                            className="pl-10"
                            maxLength={10}
                          />
                        </div>
                        {!otpSent && !phoneVerified && (
                          <Button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={otpLoading || !form.phoneNumber}
                            size="sm"
                            className="whitespace-nowrap"
                          >
                            {otpLoading ? "Sending..." : "Send OTP"}
                          </Button>
                        )}
                        {phoneVerified && (
                          <div className="flex items-center text-emerald-600">
                            <CheckCircle className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500"></p>
                    </div>

                    {otpSent && !phoneVerified && (
                      <div className="space-y-2">
                        <Label htmlFor="otpCode" className="text-sm">
                          Enter OTP
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="otpCode"
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            value={otpCode}
                            onChange={(e) =>
                              setOtpCode(
                                e.target.value.replace(/\D/g, "").slice(0, 6)
                              )
                            }
                            maxLength={6}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            onClick={handleVerifyOtp}
                            disabled={otpLoading || otpCode.length !== 6}
                            size="sm"
                          >
                            {otpLoading ? "Verifying..." : "Verify"}
                          </Button>
                        </div>
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={otpLoading}
                          className="text-xs text-emerald-600 hover:underline"
                        >
                          Resend OTP
                        </button>
                      </div>
                    )}

                    {!phoneVerified && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowOtpSection(false);
                          setOtpSent(false);
                          setOtpCode("");
                          setForm({ ...form, phoneNumber: "" });
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <div className="text-sm text-center w-full text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
              >
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>

        <p className="text-center text-sm text-gray-600 mt-6">
          By signing up, you agree to our terms and conditions
        </p>
      </div>
    </div>
  );
}
