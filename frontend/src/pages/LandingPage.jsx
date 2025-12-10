import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  FileText,
  CheckCircle,
  Clock,
  Users,
  BarChart3,
  Shield,
  ArrowRight,
  Zap,
  Globe,
  UserX,
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: FileText,
      title: "Seamless Complaint Management",
      description:
        "Track and resolve citizen complaints with an intuitive, streamlined workflow.",
    },
    {
      icon: Clock,
      title: "Real-Time Updates",
      description:
        "Keep citizens informed with automatic status updates and transparent timelines.",
    },
    {
      icon: Users,
      title: "Role-Based Access",
      description:
        "Empower your team with specialized views for citizens, officers, and administrators.",
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description:
        "Make data-driven decisions with comprehensive dashboards and reporting tools.",
    },
    {
      icon: Shield,
      title: "Secure & Compliant",
      description:
        "Enterprise-grade security ensuring data protection and regulatory compliance.",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description:
        "Optimized performance delivering instant responses and seamless experiences.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                ResolveIT
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/anonymous")}
                className="text-violet-600 hover:text-purple-700 hover:bg-violet-50"
              >
                <UserX className="w-4 h-4 mr-1" />
                Anonymous
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/login")}
                className="text-gray-700 hover:text-violet-600"
              >
                Login
              </Button>
              <Button
                onClick={() => navigate("/signup")}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
              Transform Citizen{" "}
              <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Complaint Resolution
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
              The comprehensive platform that empowers organizations to manage,
              track, and resolve citizen complaints with unprecedented
              efficiency and transparency.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate("/signup")}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-6 py-3"
              >
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/login")}
                className="border-2 border-gray-300 hover:border-violet-600 text-gray-700 hover:text-violet-600 px-6 py-3"
              >
                Sign In
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/anonymous")}
                className="border-2 border-violet-300 hover:border-purple-500 text-violet-600 hover:text-purple-700 hover:bg-violet-50 px-6 py-3"
              >
                <UserX className="w-4 h-4 mr-2" />
                Anonymous Complaint
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Built for organizations that demand excellence in public service
              delivery
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-violet-200"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-violet-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-violet-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">99.9%</div>
              <div className="text-violet-200 text-lg">Uptime Guarantee</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">100+</div>
              <div className="text-violet-200 text-lg">
                Complaints Resolved Monthly
              </div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">24/7</div>
              <div className="text-violet-200 text-lg">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Operations?
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Join leading organizations worldwide in delivering exceptional
            citizen service
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate("/signup")}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-6 py-3"
            >
              Get Started Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">ResolveIT</span>
            </div>
            <div className="text-center md:text-left">
              <p className="text-sm">
                © 2025 ResolveIT. All rights reserved. | Enterprise Complaint
                Management Platform
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
