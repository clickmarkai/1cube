// No Link import needed - using direct navigation
import { ArrowRight, Bot, BarChart3, ShoppingCart, Users, Zap, Globe } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-primary-lighter">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">1Cube</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/auth/login" className="text-gray-700 hover:text-primary">
                Login
              </a>
              <a
                href="/auth/register"
                className="btn-primary px-4 py-2"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            AI Autopilot for <span className="text-primary">Wellness Ecommerce</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Unify marketplaces, predict winners, and auto-optimize ads, content, bundles, and retention — built specifically for Indonesia&apos;s health & wellness brands.
          </p>
          <div className="flex justify-center space-x-4">
            <a href="/app" className="btn-primary px-8 py-4 text-lg flex items-center">
              Open Platform
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
            <a href="#features" className="btn-outline px-8 py-4 text-lg">
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">The Challenge</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card">
              <ShoppingCart className="h-12 w-12 text-primary mb-4" />
              <h4 className="text-xl font-semibold mb-2">Multi-Marketplace Chaos</h4>
              <p className="text-gray-600">
                Managing Shopee, Tokopedia, TikTok Shop, Lazada, and more with different algorithms and rules.
              </p>
            </div>
            <div className="card">
              <BarChart3 className="h-12 w-12 text-primary mb-4" />
              <h4 className="text-xl font-semibold mb-2">No Unified Analytics</h4>
              <p className="text-gray-600">
                Scattered data leads to poor decisions on CAC, ROAS, LTV, and AOV optimization.
              </p>
            </div>
            <div className="card">
              <Zap className="h-12 w-12 text-primary mb-4" />
              <h4 className="text-xl font-semibold mb-2">Manual Operations</h4>
              <p className="text-gray-600">
                Slow iteration cycles and missed trends due to spreadsheet-based management.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">Core Modules</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<Bot className="h-8 w-8" />}
              title="AI Predictive Campaigns"
              description="Generate, launch, and continuously iterate across all channels"
            />
            <FeatureCard
              icon={<Globe className="h-8 w-8" />}
              title="Market Intelligence"
              description="Competitor analysis, trend radar, and benchmarks"
            />
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="Content Studio"
              description="Wellness-tuned templates with ID/EN localization"
            />
            <FeatureCard
              icon={<ShoppingCart className="h-8 w-8" />}
              title="Bundling Automation"
              description="AI-powered bundles for margin and AOV optimization"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-6">
            Ready to Automate Your Wellness Ecommerce?
          </h3>
          <p className="text-xl mb-8 text-primary-lighter">
            Join Indonesia&apos;s leading health & wellness brands using 1Cube
          </p>
          <a href="/app" className="btn-secondary px-8 py-4 text-lg inline-flex items-center">
            Start Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <p>&copy; 2025 1Cube. Built for Indonesia, ready for the world.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="text-primary mb-4">{icon}</div>
      <h4 className="text-lg font-semibold mb-2">{title}</h4>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}