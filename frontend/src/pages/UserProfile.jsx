import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  getUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
  saveUser,
  clearToken,
  clearUser,
  sendOtp,
  verifyOtpAndLink,
} from "../services/api";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  FileText,
  User as UserIcon,
  Mail,
  Shield,
  Key,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  LogOut,
  Phone,
  Smartphone,
} from "lucide-react";

export default function UserProfile() {
  const navigate = useNavigate();
  const user = getUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Profile form state
  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Phone verification state
  const [phoneForm, setPhoneForm] = useState({ phoneNumber: "" });
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [phoneSuccess, setPhoneSuccess] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const data = await getUserProfile();
      setProfile(data);
      setProfileForm({ name: data.name, email: data.email });
    } catch (err) {
      console.error("Failed to load profile", err);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearToken();
    clearUser();
    navigate("/login", { replace: true });
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    setProfileLoading(true);

    try {
      const updatedProfile = await updateUserProfile(profileForm);
      setProfile(updatedProfile);
      setProfileSuccess("Profile updated successfully!");

      // Update local storage with new user data
      const updatedUser = {
        id: updatedProfile.id,
        name: updatedProfile.name,
        email: updatedProfile.email,
        role: updatedProfile.role,
      };
      saveUser(updatedUser);

      // If email changed, inform user they may need to re-login
      if (profileForm.email !== user.email) {
        setTimeout(() => {
          alert(
            "Email updated! Please note that you'll need to use the new email for your next login."
          );
        }, 500);
      }
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    // Validate passwords match
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    // Validate password length
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long");
      return;
    }

    setPasswordLoading(true);

    try {
      await changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordSuccess("Password changed successfully!");
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  }

  // Validate Indian phone number (10 digits starting with 6-9)
  function isValidIndianPhone(phone) {
    const cleaned = phone.replace(/^(\+91|91)/, "").trim();
    return /^[6-9]\d{9}$/.test(cleaned);
  }

  async function handleSendOtp(e) {
    e.preventDefault();
    setPhoneError("");
    setPhoneSuccess("");

    const cleaned = phoneForm.phoneNumber.replace(/^(\+91|91)/, "").trim();
    if (!isValidIndianPhone(cleaned)) {
      setPhoneError(
        "Please enter a valid 10-digit Indian mobile number (starting with 6-9)"
      );
      return;
    }

    setPhoneLoading(true);
    try {
      const result = await sendOtp(cleaned);
      setPhoneSuccess(result.message || "OTP sent successfully!");
      setOtpSent(true);
    } catch (err) {
      setPhoneError(err.message);
    } finally {
      setPhoneLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setPhoneError("");
    setPhoneSuccess("");

    if (!otpCode || otpCode.length !== 6) {
      setPhoneError("Please enter a valid 6-digit OTP");
      return;
    }

    setPhoneLoading(true);
    try {
      const cleaned = phoneForm.phoneNumber.replace(/^(\+91|91)/, "").trim();
      const result = await verifyOtpAndLink(cleaned, otpCode);
      setPhoneSuccess(result.message || "Phone number verified successfully!");
      // Reload profile to get updated phone info
      await loadProfile();
      setOtpSent(false);
      setOtpCode("");
      setPhoneForm({ phoneNumber: "" });
    } catch (err) {
      setPhoneError(err.message);
    } finally {
      setPhoneLoading(false);
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
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
              <Link to={user.role === "CITIZEN" ? "/welcome" : "/dashboard"}>
                <Button variant="ghost" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
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
      <main className="w-full px-3 sm:px-5 md:px-6 lg:px-8 xl:px-10 2xl:px-12 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <UserIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              User Profile
            </h1>
            <p className="text-gray-600">
              Manage your account settings and update your information
            </p>
          </div>

          {/* Current Profile Info */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-violet-600" />
                Account Information
              </CardTitle>
              <CardDescription>Your current account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <UserIcon className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium text-gray-900">
                      {profile?.name || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">
                      {profile?.email || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Shield className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Role</p>
                    <p className="font-medium text-gray-900">
                      {profile?.role || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">User ID</p>
                    <p className="font-medium text-gray-900">
                      #{profile?.id || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Phone Number</p>
                    <p className="font-medium text-gray-900 flex items-center gap-2">
                      {profile?.phoneNumber
                        ? `+91${profile.phoneNumber}`
                        : "Not verified"}
                      {profile?.phoneVerified && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" /> Verified
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Profile Form */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-violet-600" />
                Edit Profile
              </CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                {profileError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{profileError}</AlertDescription>
                  </Alert>
                )}
                {profileSuccess && (
                  <Alert className="border-green-200 bg-green-50 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{profileSuccess}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, email: e.target.value })
                    }
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={profileLoading}
                  className="w-full"
                >
                  {profileLoading ? "Updating..." : "Update Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Phone Verification Form */}
          {!profile?.phoneVerified && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-violet-600" />
                  Verify Phone Number
                </CardTitle>
                <CardDescription>
                  Verify your Indian mobile number for enhanced security
                  (10-digit number starting with 6-9)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    {phoneError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{phoneError}</AlertDescription>
                      </Alert>
                    )}
                    {phoneSuccess && (
                      <Alert className="border-green-200 bg-green-50 text-green-800">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>{phoneSuccess}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Mobile Number</Label>
                      <div className="flex gap-2">
                        <div className="flex items-center px-3 bg-gray-100 border border-r-0 rounded-l-md text-gray-600 text-sm">
                          +91
                        </div>
                        <Input
                          id="phoneNumber"
                          type="tel"
                          placeholder="9876543210"
                          value={phoneForm.phoneNumber}
                          onChange={(e) =>
                            setPhoneForm({
                              phoneNumber: e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 10),
                            })
                          }
                          className="rounded-l-none"
                          maxLength={10}
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Enter your 10-digit Indian mobile number
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={phoneLoading}
                      className="w-full"
                    >
                      {phoneLoading ? "Sending OTP..." : "Send OTP"}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    {phoneError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{phoneError}</AlertDescription>
                      </Alert>
                    )}
                    {phoneSuccess && (
                      <Alert className="border-green-200 bg-green-50 text-green-800">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>{phoneSuccess}</AlertDescription>
                      </Alert>
                    )}

                    <div className="p-3 bg-violet-50 rounded-lg text-sm text-violet-700">
                      OTP sent to +91{phoneForm.phoneNumber}. Valid for 5
                      minutes.
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="otpCode">Enter OTP</Label>
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
                        className="text-center text-lg tracking-widest"
                        required
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpCode("");
                          setPhoneError("");
                          setPhoneSuccess("");
                        }}
                        className="flex-1"
                      >
                        Change Number
                      </Button>
                      <Button
                        type="submit"
                        disabled={phoneLoading}
                        className="flex-1"
                      >
                        {phoneLoading ? "Verifying..." : "Verify OTP"}
                      </Button>
                    </div>

                    <Button
                      type="button"
                      variant="link"
                      onClick={handleSendOtp}
                      disabled={phoneLoading}
                      className="w-full text-sm"
                    >
                      Resend OTP
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {/* Change Password Form */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-violet-600" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {passwordError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{passwordError}</AlertDescription>
                  </Alert>
                )}
                {passwordSuccess && (
                  <Alert className="border-green-200 bg-green-50 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{passwordSuccess}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="oldPassword">Current Password</Label>
                  <Input
                    id="oldPassword"
                    type="password"
                    value={passwordForm.oldPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        oldPassword: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-gray-500">
                    Minimum 6 characters required
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                    minLength={6}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full"
                >
                  {passwordLoading ? "Changing Password..." : "Change Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
