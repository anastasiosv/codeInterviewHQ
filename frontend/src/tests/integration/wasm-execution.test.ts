import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeCode, resetPyodideInstance } from '../../lib/code-executor';

describe('Code Executor (WASM)', () => {
    beforeEach(() => {
        resetPyodideInstance();
        // Mock window.loadPyodide
        vi.stubGlobal('window', {
            loadPyodide: vi.fn().mockResolvedValue({
                runPython: vi.fn((code) => {
                    if (code === "sys.stdout.getvalue()") return "Hello from Python!";
                    if (code === "sys.stderr.getvalue()") return "";
                    return "";
                }),
                runPythonAsync: vi.fn().mockResolvedValue(undefined),
            }),
        });
    });

    it('should execute Python code using Pyodide', async () => {
        const code = 'print("Hello from Python!")';
        const result = await executeCode(code, 'python');

        expect(result.output).toBe('Hello from Python!');
        expect(result.error).toBe(false);
    });

    it('should handle Python execution errors', async () => {
        // Mock error scenario
        vi.stubGlobal('window', {
            loadPyodide: vi.fn().mockResolvedValue({
                runPython: vi.fn((code) => {
                    if (code === "sys.stdout.getvalue()") return "";
                    if (code === "sys.stderr.getvalue()") return "SyntaxError: invalid syntax";
                    return "";
                }),
                runPythonAsync: vi.fn().mockResolvedValue(undefined),
            }),
        });

        const code = 'invalid python code';
        const result = await executeCode(code, 'python');

        expect(result.output).toContain('SyntaxError');
        expect(result.error).toBe(true);
    });

    it('should fallback for unsupported languages', async () => {
        const result = await executeCode('class Foo {}', 'java');
        expect(result.output).toContain('Browser-based execution is currently only available for JavaScript and Python');
    });
});
