import { useState } from "react";
import { useLocation } from "wouter";
import { nanoid } from "nanoid";
import { Code2, Users, Zap, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  const [, setLocation] = useLocation();
  const [joinSessionId, setJoinSessionId] = useState("");
  const [userName, setUserName] = useState("");

  const handleCreateSession = () => {
    const sessionId = nanoid(10);
    const name = userName.trim() || "Interviewer";
    localStorage.setItem("codeinterview-username", name);
    setLocation(`/session/${sessionId}`);
  };

  const handleJoinSession = () => {
    if (joinSessionId.trim()) {
      const name = userName.trim() || "Candidate";
      localStorage.setItem("codeinterview-username", name);
      // Extract session ID from URL if full URL is pasted
      let sessionId = joinSessionId.trim();
      if (sessionId.includes("/session/")) {
        sessionId = sessionId.split("/session/")[1];
      }
      setLocation(`/session/${sessionId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Code2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg" data-testid="text-logo">CodeInterview</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Real-time Collaborative Coding
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Technical Interviews,{" "}
            <span className="text-primary">Reimagined</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Conduct seamless coding interviews with real-time collaboration, 
            syntax highlighting for multiple languages, and instant code execution.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-16">
          {/* Create Session Card */}
          <Card className="relative overflow-visible">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                Start New Session
              </CardTitle>
              <CardDescription>
                Create a new interview room and invite candidates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Your name (optional)"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                data-testid="input-create-name"
              />
              <Button 
                onClick={handleCreateSession} 
                className="w-full gap-2"
                data-testid="button-create-session"
              >
                Create Interview Room
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Join Session Card */}
          <Card className="relative overflow-visible">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                Join Session
              </CardTitle>
              <CardDescription>
                Enter a session link or ID to join an existing interview
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Your name (optional)"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                data-testid="input-join-name"
              />
              <Input
                placeholder="Paste session link or ID"
                value={joinSessionId}
                onChange={(e) => setJoinSessionId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoinSession()}
                data-testid="input-session-id"
              />
              <Button 
                onClick={handleJoinSession} 
                variant="secondary"
                className="w-full gap-2"
                disabled={!joinSessionId.trim()}
                data-testid="button-join-session"
              >
                Join Interview
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-8">
            Everything you need for technical interviews
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Code2 className="h-5 w-5" />}
              title="Multi-Language Support"
              description="JavaScript, TypeScript, Python, Java, C++, and more with full syntax highlighting"
            />
            <FeatureCard
              icon={<Users className="h-5 w-5" />}
              title="Real-time Collaboration"
              description="See changes instantly as your candidate types with live cursor tracking"
            />
            <FeatureCard
              icon={<Zap className="h-5 w-5" />}
              title="Code Execution"
              description="Run code directly in the browser with instant output and error feedback"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 h-14 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Built for seamless technical interviews
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="p-6 rounded-lg border bg-card hover-elevate">
      <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="font-medium mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
