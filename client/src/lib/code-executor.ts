// Safe in-browser code execution using sandboxed iframe with srcdoc

interface ExecutionResult {
  output: string;
  error: boolean;
}

// Execute JavaScript code safely in a sandboxed iframe using srcdoc
export async function executeJavaScript(code: string): Promise<ExecutionResult> {
  return new Promise((resolve) => {
    const logs: string[] = [];
    let hasError = false;
    let timeoutId: NodeJS.Timeout;
    let iframe: HTMLIFrameElement | null = null;

    // Listen for messages from the sandbox
    const messageHandler = (event: MessageEvent) => {
      // Only accept messages from our iframe
      if (!iframe || event.source !== iframe.contentWindow) return;
      
      const { type, data } = event.data || {};
      
      if (type === "log") {
        logs.push(data);
      } else if (type === "error") {
        logs.push(`Error: ${data}`);
        hasError = true;
      } else if (type === "done") {
        cleanup();
        resolve({
          output: logs.length > 0 ? logs.join("\n") : "(No output)",
          error: hasError,
        });
      }
    };

    const cleanup = () => {
      window.removeEventListener("message", messageHandler);
      clearTimeout(timeoutId);
      if (iframe && iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
      iframe = null;
    };

    window.addEventListener("message", messageHandler);

    // Set a timeout for execution (5 seconds)
    timeoutId = setTimeout(() => {
      cleanup();
      resolve({
        output: "Execution timed out (5 second limit)",
        error: true,
      });
    }, 5000);

    // Escape the code for embedding in HTML
    const escapedCode = code
      .replace(/\\/g, "\\\\")
      .replace(/`/g, "\\`")
      .replace(/\$/g, "\\$");

    // Create the sandbox HTML with console override
    const sandboxHtml = `
<!DOCTYPE html>
<html>
<head>
<script>
(function() {
  // Override console methods to capture output
  const logs = [];
  window.console = {
    log: function(...args) {
      const msg = args.map(a => {
        if (a === null) return 'null';
        if (a === undefined) return 'undefined';
        if (typeof a === 'object') {
          try { return JSON.stringify(a, null, 2); }
          catch (e) { return String(a); }
        }
        return String(a);
      }).join(' ');
      window.parent.postMessage({ type: 'log', data: msg }, '*');
    },
    error: function(...args) {
      const msg = args.map(a => String(a)).join(' ');
      window.parent.postMessage({ type: 'error', data: msg }, '*');
    },
    warn: function(...args) {
      const msg = '[Warning] ' + args.map(a => String(a)).join(' ');
      window.parent.postMessage({ type: 'log', data: msg }, '*');
    },
    info: function(...args) {
      const msg = args.map(a => String(a)).join(' ');
      window.parent.postMessage({ type: 'log', data: msg }, '*');
    }
  };
  
  // Execute the user code
  try {
    const userCode = \`${escapedCode}\`;
    const fn = new Function(userCode);
    fn();
  } catch (e) {
    window.parent.postMessage({ type: 'error', data: e.message || String(e) }, '*');
  }
  
  // Signal completion
  window.parent.postMessage({ type: 'done' }, '*');
})();
</script>
</head>
<body></body>
</html>`;

    // Create the iframe with srcdoc
    iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.sandbox.add("allow-scripts");
    iframe.srcdoc = sandboxHtml;
    document.body.appendChild(iframe);
  });
}

// Main execution function that handles different languages
export async function executeCode(code: string, language: string): Promise<ExecutionResult> {
  if (language === "javascript") {
    return executeJavaScript(code);
  }
  
  // For non-JavaScript languages, show a helpful message
  const languageNames: Record<string, string> = {
    typescript: "TypeScript",
    python: "Python",
    java: "Java",
    cpp: "C++",
    csharp: "C#",
    go: "Go",
    rust: "Rust",
  };
  
  const langName = languageNames[language] || language;
  
  return {
    output: `Browser-based execution is only available for JavaScript.\n\n${langName} code would need to be compiled/run in a server environment.\n\nFor interview purposes, discuss the code logic with your candidate.`,
    error: false,
  };
}
