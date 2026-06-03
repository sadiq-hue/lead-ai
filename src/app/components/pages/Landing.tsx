import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, MessageSquare, DollarSign, TrendingUp, Zap, CheckCircle, Users, Mail, Instagram, Facebook, Phone } from "lucide-react";
import { signInWithGoogle } from "../../../lib/firebase";

export function Landing() {
  const navigate = useNavigate();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const features = [
    {
      icon: MessageSquare,
      title: "AI Conversations",
      description: "Automatically handle leads from WhatsApp, Email, Instagram, and Facebook with intelligent responses",
    },
    {
      icon: Users,
      title: "Smart Qualification",
      description: "AI qualifies prospects and books meetings while you focus on closing deals",
    },
    {
      icon: DollarSign,
      title: "Payment Tracking",
      description: "M-Pesa and bank transfer integration with automated reconciliation",
    },
    {
      icon: TrendingUp,
      title: "Financial Insights",
      description: "Clear visibility into revenue, expenses, and cash flow without complexity",
    },
  ];

  const benefits = [
    "Respond to leads 24/7 automatically",
    "Reduce response time from hours to seconds",
    "Never miss a payment or follow-up",
    "Track every dollar without manual work",
    "Complete visibility from lead to revenue",
    "Built for SMEs, not enterprises",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
              <Zap className="w-4 h-4" />
              <span className="text-sm">Business automation from lead to revenue</span>
            </div>

            <h1 className="text-6xl font-semibold text-foreground max-w-4xl mx-auto leading-tight">
              Stop chasing leads.
              <br />
              <span className="text-primary">Let AI close them.</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              FlowOps AI automates your entire sales pipeline — from multi-channel conversations to payment collection to financial reporting.
            </p>

            <div className="flex items-center justify-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquare className="w-5 h-5 text-green-600" />
                <span>WhatsApp</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-5 h-5 text-blue-600" />
                <span>Email</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Instagram className="w-5 h-5 text-pink-600" />
                <span>Instagram</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Facebook className="w-5 h-5 text-blue-700" />
                <span>Facebook</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <button
                onClick={() => navigate("/signup")}
                className="px-8 py-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                Start free trial
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="px-8 py-4 rounded-lg border border-border hover:bg-accent transition-all">
                Watch demo
              </button>
              <button
                onClick={() => navigate("/login")}
                className="px-8 py-4 rounded-lg border border-border hover:bg-accent transition-all inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>

        {/* Decorative gradient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl -z-10" />
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-card">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold mb-4">Everything you need in one place</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Stop juggling between tools. FlowOps connects sales, payments, and finance automatically.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="p-8 rounded-2xl bg-background border border-border hover:border-primary/50 transition-all">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold mb-4">From lead to revenue in minutes</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              AI handles the entire flow so you can focus on growing your business
            </p>
          </div>

          <div className="grid grid-cols-4 gap-6">
            {[
              { step: "1", title: "Lead arrives", desc: "WhatsApp or email" },
              { step: "2", title: "AI responds", desc: "Qualifies & books meeting" },
              { step: "3", title: "Deal closes", desc: "Payment collected" },
              { step: "4", title: "Auto-logged", desc: "Financial record created" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-semibold mx-auto mb-4">
                  {item.step}
                </div>
                <h4 className="mb-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 bg-card">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold mb-4">Built for SMEs, not enterprises</h2>
            <p className="text-lg text-muted-foreground">
              Simple, powerful, and affordable automation for growing businesses
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                <p>{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="p-12 rounded-3xl bg-primary text-primary-foreground">
            <h2 className="text-4xl font-semibold mb-4">Ready to automate your business?</h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Join businesses using FlowOps to convert more leads and track every dollar
            </p>
            <button
              onClick={() => navigate("/signup")}
              className="px-8 py-4 rounded-lg bg-white text-primary hover:bg-white/90 transition-all inline-flex items-center gap-2"
            >
              Start your free trial
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-sm opacity-75 mt-4">14 days free • No credit card required</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-12 mb-12">
            <div>
              <h3 className="mb-3">FlowOps AI</h3>
              <p className="text-sm text-muted-foreground mb-4">Business automation from lead to revenue</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>+254 700 123 456</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>hello@flowops.ai</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="mb-4">Product</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="#features" className="block hover:text-foreground transition-colors">Features</a>
                <a href="#pricing" className="block hover:text-foreground transition-colors">Pricing</a>
                <a href="#integrations" className="block hover:text-foreground transition-colors">Integrations</a>
                <a href="/login" className="block hover:text-foreground transition-colors">Sign In</a>
              </div>
            </div>
            <div>
              <h4 className="mb-4">Support</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="#docs" className="block hover:text-foreground transition-colors">Documentation</a>
                <a href="#help" className="block hover:text-foreground transition-colors">Help Center</a>
                <a href="#contact" className="block hover:text-foreground transition-colors">Contact Us</a>
                <a href="#status" className="block hover:text-foreground transition-colors">System Status</a>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-border">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <p>© 2026 FlowOps AI. Built for SMEs who want to grow smarter.</p>
              <div className="flex gap-6">
                <a href="#privacy" className="hover:text-foreground transition-colors">Privacy</a>
                <a href="#terms" className="hover:text-foreground transition-colors">Terms</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
