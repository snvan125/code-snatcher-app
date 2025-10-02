import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Shield, Zap, Clock, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">SkinScanX</h1>
          <Button onClick={() => navigate("/auth")} variant="outline">
            Sign In
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-5xl font-bold tracking-tight">
              AI-Powered Skin Analysis
              <span className="block text-primary mt-2">At Your Fingertips</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get instant, AI-powered insights about your skin health. Upload a photo and receive
              detailed analysis with personalized recommendations.
            </p>
          </div>

          <div className="flex justify-center gap-4">
            <Button onClick={() => navigate("/auth")} size="lg" className="gap-2">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button onClick={() => navigate("/auth")} variant="outline" size="lg">
              Learn More
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 pt-16">
            <div className="p-6 rounded-lg bg-card border">
              <Shield className="h-12 w-12 text-primary mb-4 mx-auto" />
              <h3 className="font-semibold text-lg mb-2">Secure & Private</h3>
              <p className="text-sm text-muted-foreground">
                Your images and data are encrypted and stored securely with enterprise-grade protection.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border">
              <Zap className="h-12 w-12 text-primary mb-4 mx-auto" />
              <h3 className="font-semibold text-lg mb-2">AI-Powered</h3>
              <p className="text-sm text-muted-foreground">
                Advanced AI analyzes your skin with accuracy, providing detailed insights instantly.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border">
              <Clock className="h-12 w-12 text-primary mb-4 mx-auto" />
              <h3 className="font-semibold text-lg mb-2">Track Progress</h3>
              <p className="text-sm text-muted-foreground">
                Monitor your skin health over time with comprehensive scan history and trends.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 mt-16 border-t">
        <p className="text-center text-sm text-muted-foreground">
          © 2024 SkinScanX. For educational purposes only. Always consult a healthcare professional.
        </p>
      </footer>
    </div>
  );
};

export default Index;
