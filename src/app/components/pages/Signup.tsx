import { useState } from "react";
import { useNavigate } from "react-router";
import { MessageSquare, ArrowRight, CheckCircle } from "lucide-react";
import { signInWithGoogle } from "../../../lib/firebase";

export function Signup() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    businessName: "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/app");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      navigate("/app");
    } catch (error) {
      console.error("Google signup failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    "14-day free trial, no credit card required",
    "Connect WhatsApp, Email, Instagram & Facebook",
    "AI-powered lead qualification",
    "Automated payment tracking",
    "Cancel anytime",
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground mb-4">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h1>Create your account</h1>
            <p className="text-muted-foreground">Start automating your business in minutes</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-input-background border border-border"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@company.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-input-background border border-border"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+254 700 123 456"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-input-background border border-border"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="businessName">Business Name</label>
              <input
                id="businessName"
                name="businessName"
                type="text"
                placeholder="Your Company Ltd"
                value={formData.businessName}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-input-background border border-border"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-input-background border border-border"
                required
              />
              <p className="text-xs text-muted-foreground">At least 8 characters</p>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              Create account
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-primary hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>

          <div className="pt-4">
            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg border border-border hover:bg-accent transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isLoading ? "Signing up..." : "Sign up with Google"}
            </button>
          </div>

          <div className="pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">What you get:</p>
            <div className="space-y-2">
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-primary p-12 items-center justify-center">
        <div className="max-w-md space-y-6 text-primary-foreground">
          <h2 className="text-3xl">Join businesses automating their growth</h2>
          <p className="text-lg opacity-90">
            FlowOps AI handles leads from WhatsApp, Email, Instagram, and Facebook — automatically qualifying prospects and collecting payments.
          </p>
          <div className="space-y-4 pt-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium mb-1">Multi-channel automation</p>
                <p className="text-sm opacity-75">Connect all your communication channels in one place</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium mb-1">AI-powered responses</p>
                <p className="text-sm opacity-75">Smart conversations that qualify and convert leads</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium mb-1">Complete financial visibility</p>
                <p className="text-sm opacity-75">Track payments and revenue without manual work</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
