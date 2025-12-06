import { useState, useCallback, useRef } from "react";
import { useParams, useLocation } from "wouter";
import Editor, { OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { 
  Play, 
  Share2, 
  Copy, 
  Check, 
  Code2, 
  Users, 
  Terminal,
  ChevronDown,
  Loader2,
  CircleDot,
  Trash2,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/components/theme-provider";
import { useWebSocket } from "@/hooks/use-websocket";
import { executeCode } from "@/lib/code-executor";
import { 
  supportedLanguages, 
  codeTemplates, 
  type Participant,
  type SupportedLanguage
} from "@shared/schema";

export default function Interview() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId || "";
  const [, setLocation] = useLocation();
  const { theme } = useTheme();
  
  const [userName] = useState(() => 
    localStorage.getItem("codeinterview-username") || "Anonymous"
  );
  
  const [code, setCode] = useState(codeTemplates.javascript);
  const [language, setLanguage] = useState<SupportedLanguage>("javascript");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [output, setOutput] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("output");
  
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const isLocalChange = useRef(false);

  const handleCodeUpdate = useCallback((newCode: string) => {
    if (!isLocalChange.current) {
      setCode(newCode);
    }
    isLocalChange.current = false;
  }, []);

  const handleLanguageChange = useCallback((newLanguage: string) => {
    setLanguage(newLanguage as SupportedLanguage);
  }, []);

  const handleParticipantsChange = useCallback((update: Participant[] | ((prev: Participant[]) => Participant[])) => {
    if (typeof update === 'function') {
      setParticipants(update);
    } else {
      setParticipants(update);
    }
  }, []);

  const handleError = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setOutput(prev => [...prev, `${timestamp} [SYSTEM] ${message}`]);
  }, []);

  const { 
    isConnected, 
    myParticipantId,
    sendCodeUpdate, 
    sendLanguageChange,
    sendCursorUpdate,
  } = useWebSocket({
    sessionId,
    userName,
    onCodeUpdate: handleCodeUpdate,
    onLanguageChange: handleLanguageChange,
    onParticipantsChange: handleParticipantsChange,
    onError: handleError,
  });

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      isLocalChange.current = true;
      setCode(value);
      sendCodeUpdate(value);
    }
  }, [sendCodeUpdate]);

  const handleEditorMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
    
    editor.onDidChangeCursorPosition((e) => {
      sendCursorUpdate(e.position.lineNumber, e.position.column);
    });
  }, [sendCursorUpdate]);

  const handleLanguageSelect = useCallback((langId: SupportedLanguage) => {
    setLanguage(langId);
    setCode(codeTemplates[langId]);
    sendLanguageChange(langId);
    sendCodeUpdate(codeTemplates[langId]);
  }, [sendLanguageChange, sendCodeUpdate]);

  const handleRun = useCallback(async () => {
    setIsExecuting(true);
    const timestamp = new Date().toLocaleTimeString();
    setOutput(prev => [...prev, `${timestamp} [SYSTEM] Executing ${language} code...`]);
    
    try {
      const result = await executeCode(code, language);
      const resultTimestamp = new Date().toLocaleTimeString();
      const prefix = result.error ? "[ERROR]" : "[OUTPUT]";
      setOutput(prev => [...prev, `${resultTimestamp} ${prefix} ${result.output}`]);
    } catch (e) {
      const errorTimestamp = new Date().toLocaleTimeString();
      setOutput(prev => [...prev, `${errorTimestamp} [ERROR] ${e instanceof Error ? e.message : 'Unknown error'}`]);
    } finally {
      setIsExecuting(false);
      setActiveTab("output");
    }
  }, [code, language]);

  const handleClearOutput = useCallback(() => {
    setOutput([]);
  }, []);

  const handleCopyLink = useCallback(async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const currentLanguage = supportedLanguages.find(l => l.id === language);
  const monacoTheme = theme === "dark" ? "vs-dark" : "light";

  // Get other participants (not self)
  const otherParticipants = participants.filter(p => p.id !== myParticipantId);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b flex items-center px-4 gap-4 flex-shrink-0">
        {/* Left: Logo & Session */}
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation("/")}
            data-testid="button-home"
          >
            <Home className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Code2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold hidden sm:inline" data-testid="text-logo">CodeInterview</span>
          </div>
          <Badge variant="secondary" className="font-mono text-xs" data-testid="text-session-id">
            {sessionId.slice(0, 8)}...
          </Badge>
        </div>

        {/* Center: Language & Execute */}
        <div className="flex items-center gap-2 flex-1 justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2" data-testid="button-language-select">
                {currentLanguage?.name || "JavaScript"}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              {supportedLanguages.map((lang) => (
                <DropdownMenuItem
                  key={lang.id}
                  onClick={() => handleLanguageSelect(lang.id)}
                  data-testid={`menu-item-${lang.id}`}
                >
                  {lang.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            onClick={handleRun} 
            disabled={isExecuting}
            className="gap-2"
            data-testid="button-run-code"
          >
            {isExecuting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run Code
              </>
            )}
          </Button>
        </div>

        {/* Right: Participants, Share, Theme */}
        <div className="flex items-center gap-2">
          {/* Connection Status */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 px-2">
                <CircleDot className={`h-3 w-3 ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {isConnected ? 'Real-time sync active' : 'Reconnecting...'}
            </TooltipContent>
          </Tooltip>

          {/* Participant Avatars */}
          <div className="flex items-center -space-x-2">
            {participants.slice(0, 4).map((participant) => (
              <Tooltip key={participant.id}>
                <TooltipTrigger asChild>
                  <Avatar 
                    className="h-8 w-8 border-2 border-background"
                    style={{ borderColor: participant.color }}
                  >
                    <AvatarFallback 
                      style={{ backgroundColor: participant.color }}
                      className="text-white text-xs font-medium"
                    >
                      {participant.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  {participant.name}
                  {participant.id === myParticipantId && " (You)"}
                  {participant.cursorLine && (
                    <span className="text-muted-foreground ml-1">
                      Line {participant.cursorLine}
                    </span>
                  )}
                </TooltipContent>
              </Tooltip>
            ))}
            {participants.length > 4 && (
              <Avatar className="h-8 w-8 border-2 border-background">
                <AvatarFallback className="text-xs">
                  +{participants.length - 4}
                </AvatarFallback>
              </Avatar>
            )}
          </div>

          <Button 
            variant="outline" 
            size="sm"
            className="gap-2"
            onClick={() => setShowShareModal(true)}
            data-testid="button-share"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>

          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Code Editor Panel */}
        <ResizablePanel defaultSize={65} minSize={40}>
          <div className="h-full flex flex-col">
            <Editor
              height="100%"
              language={language}
              value={code}
              theme={monacoTheme}
              onChange={handleEditorChange}
              onMount={handleEditorMount}
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: { enabled: false },
                lineNumbers: "on",
                roundedSelection: true,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: "on",
                padding: { top: 16, bottom: 16 },
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                smoothScrolling: true,
              }}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel: Output & Participants */}
        <ResizablePanel defaultSize={35} minSize={25}>
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="h-full flex flex-col"
          >
            <div className="flex items-center justify-between px-4 border-b h-10 flex-shrink-0">
              <TabsList className="h-8">
                <TabsTrigger value="output" className="gap-1.5 text-xs" data-testid="tab-output">
                  <Terminal className="h-3.5 w-3.5" />
                  Output
                </TabsTrigger>
                <TabsTrigger value="participants" className="gap-1.5 text-xs" data-testid="tab-participants">
                  <Users className="h-3.5 w-3.5" />
                  Participants ({participants.length})
                </TabsTrigger>
              </TabsList>
              {activeTab === "output" && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleClearOutput}
                  className="h-7 px-2"
                  data-testid="button-clear-output"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            <TabsContent value="output" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 font-mono text-sm space-y-1">
                  {output.length === 0 ? (
                    <div className="text-muted-foreground text-center py-8">
                      <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No output yet</p>
                      <p className="text-xs mt-1">Click "Run Code" to execute</p>
                    </div>
                  ) : (
                    output.map((line, i) => (
                      <div 
                        key={i} 
                        className={`whitespace-pre-wrap break-all ${
                          line.includes("[ERROR]") 
                            ? "text-destructive" 
                            : line.includes("[SYSTEM]")
                            ? "text-muted-foreground"
                            : "text-foreground"
                        }`}
                        data-testid={`output-line-${i}`}
                      >
                        {line}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="participants" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  {participants.length === 0 ? (
                    <div className="text-muted-foreground text-center py-8">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Waiting for participants...</p>
                    </div>
                  ) : (
                    participants.map((participant) => (
                      <div 
                        key={participant.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                        data-testid={`participant-${participant.id}`}
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarFallback 
                            style={{ backgroundColor: participant.color }}
                            className="text-white text-sm font-medium"
                          >
                            {participant.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {participant.name}
                            </span>
                            {participant.id === myParticipantId && (
                              <Badge variant="secondary" className="text-xs">You</Badge>
                            )}
                          </div>
                          {participant.cursorLine && (
                            <span className="text-xs text-muted-foreground">
                              Line {participant.cursorLine}, Col {participant.cursorColumn}
                            </span>
                          )}
                        </div>
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: participant.color }}
                        />
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share Interview Session
            </DialogTitle>
            <DialogDescription>
              Share this link with candidates to join the interview
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
                {window.location.href}
              </div>
              <Button 
                size="icon"
                onClick={handleCopyLink}
                data-testid="button-copy-link"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Anyone with this link can join the session and collaborate in real-time.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
