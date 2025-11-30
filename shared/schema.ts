import { z } from "zod";

// Session schema for coding interview rooms
export const sessionSchema = z.object({
  id: z.string(),
  code: z.string(),
  language: z.string(),
  createdAt: z.number(),
});

export const insertSessionSchema = sessionSchema.omit({ id: true, createdAt: true });

export type Session = z.infer<typeof sessionSchema>;
export type InsertSession = z.infer<typeof insertSessionSchema>;

// Participant schema for users in a session
export const participantSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  name: z.string(),
  color: z.string(),
  cursorLine: z.number().nullable(),
  cursorColumn: z.number().nullable(),
});

export type Participant = z.infer<typeof participantSchema>;

// WebSocket message types
export const wsMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("join"),
    sessionId: z.string(),
    name: z.string(),
  }),
  z.object({
    type: z.literal("code_update"),
    code: z.string(),
  }),
  z.object({
    type: z.literal("language_change"),
    language: z.string(),
  }),
  z.object({
    type: z.literal("cursor_update"),
    line: z.number(),
    column: z.number(),
  }),
  z.object({
    type: z.literal("session_state"),
    code: z.string(),
    language: z.string(),
    participants: z.array(participantSchema),
    myParticipantId: z.string(),
  }),
  z.object({
    type: z.literal("participant_joined"),
    participant: participantSchema,
  }),
  z.object({
    type: z.literal("participant_left"),
    participantId: z.string(),
  }),
  z.object({
    type: z.literal("participant_cursor"),
    participantId: z.string(),
    line: z.number(),
    column: z.number(),
  }),
  z.object({
    type: z.literal("error"),
    message: z.string(),
  }),
]);

export type WsMessage = z.infer<typeof wsMessageSchema>;

// Supported programming languages
export const supportedLanguages = [
  { id: "javascript", name: "JavaScript", extension: ".js" },
  { id: "typescript", name: "TypeScript", extension: ".ts" },
  { id: "python", name: "Python", extension: ".py" },
  { id: "java", name: "Java", extension: ".java" },
  { id: "cpp", name: "C++", extension: ".cpp" },
  { id: "csharp", name: "C#", extension: ".cs" },
  { id: "go", name: "Go", extension: ".go" },
  { id: "rust", name: "Rust", extension: ".rs" },
] as const;

export type SupportedLanguage = typeof supportedLanguages[number]["id"];

// Default code templates for each language
export const codeTemplates: Record<SupportedLanguage, string> = {
  javascript: `// JavaScript Interview
// Write your solution below

function solution(input) {
  // Your code here
  return input;
}

// Test your solution
console.log(solution("Hello, World!"));
`,
  typescript: `// TypeScript Interview
// Write your solution below

function solution(input: string): string {
  // Your code here
  return input;
}

// Test your solution
console.log(solution("Hello, World!"));
`,
  python: `# Python Interview
# Write your solution below

def solution(input):
    # Your code here
    return input

# Test your solution
print(solution("Hello, World!"))
`,
  java: `// Java Interview
// Write your solution below

public class Solution {
    public static String solution(String input) {
        // Your code here
        return input;
    }
    
    public static void main(String[] args) {
        System.out.println(solution("Hello, World!"));
    }
}
`,
  cpp: `// C++ Interview
// Write your solution below

#include <iostream>
#include <string>

std::string solution(std::string input) {
    // Your code here
    return input;
}

int main() {
    std::cout << solution("Hello, World!") << std::endl;
    return 0;
}
`,
  csharp: `// C# Interview
// Write your solution below

using System;

class Solution {
    static string Solve(string input) {
        // Your code here
        return input;
    }
    
    static void Main() {
        Console.WriteLine(Solve("Hello, World!"));
    }
}
`,
  go: `// Go Interview
// Write your solution below

package main

import "fmt"

func solution(input string) string {
    // Your code here
    return input
}

func main() {
    fmt.Println(solution("Hello, World!"))
}
`,
  rust: `// Rust Interview
// Write your solution below

fn solution(input: &str) -> String {
    // Your code here
    input.to_string()
}

fn main() {
    println!("{}", solution("Hello, World!"));
}
`,
};

// Participant colors for visual distinction
export const participantColors = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316", // Orange
];
