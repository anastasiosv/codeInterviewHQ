from pydantic import BaseModel, Field
from typing import Optional, Literal, Union
from datetime import datetime
from uuid import UUID

# Supported programming languages
SUPPORTED_LANGUAGES = Literal[
    "javascript",
    "typescript", 
    "python",
    "java",
    "cpp",
    "csharp",
    "go",
    "rust"
]

# Code templates for each language
CODE_TEMPLATES = {
    "javascript": """// JavaScript Interview
// Write your solution below

function solution(input) {
  // Your code here
  return input;
}

// Test your solution
console.log(solution("Hello, World!"));
""",
    "typescript": """// TypeScript Interview
// Write your solution below

function solution(input: string): string {
  // Your code here
  return input;
}

// Test your solution
console.log(solution("Hello, World!"));
""",
    "python": """# Python Interview
# Write your solution below

def solution(input):
    # Your code here
    return input

# Test your solution
print(solution("Hello, World!"))
""",
    "java": """// Java Interview
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
""",
    "cpp": """// C++ Interview
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
""",
    "csharp": """// C# Interview
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
""",
    "go": """// Go Interview
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
""",
    "rust": """// Rust Interview
// Write your solution below

fn solution(input: &str) -> String {
    // Your code here
    input.to_string()
}

fn main() {
    println!("{}", solution("Hello, World!"));
}
"""
}

# Participant colors
PARTICIPANT_COLORS = [
    "#3B82F6",  # Blue
    "#10B981",  # Emerald
    "#F59E0B",  # Amber
    "#EF4444",  # Red
    "#8B5CF6",  # Violet
    "#EC4899",  # Pink
    "#06B6D4",  # Cyan
    "#F97316",  # Orange
]

# Session Schemas
class SessionBase(BaseModel):
    code: str
    language: SUPPORTED_LANGUAGES

class SessionCreate(BaseModel):
    id: str

class SessionResponse(BaseModel):
    id: str
    code: str
    language: str
    createdAt: int

    class Config:
        from_attributes = True

# Participant Schemas
class ParticipantBase(BaseModel):
    name: str

class ParticipantResponse(BaseModel):
    id: str
    sessionId: str
    name: str
    color: str
    cursorLine: Optional[int] = None
    cursorColumn: Optional[int] = None

    class Config:
        from_attributes = True

# WebSocket Message Schemas
class WsJoinMessage(BaseModel):
    type: Literal["join"]
    sessionId: str
    name: str

class WsCodeUpdateMessage(BaseModel):
    type: Literal["code_update"]
    code: str

class WsLanguageChangeMessage(BaseModel):
    type: Literal["language_change"]
    language: SUPPORTED_LANGUAGES

class WsCursorUpdateMessage(BaseModel):
    type: Literal["cursor_update"]
    line: int
    column: int

class WsSessionStateMessage(BaseModel):
    type: Literal["session_state"]
    code: str
    language: str
    participants: list[ParticipantResponse]
    myParticipantId: str

class WsParticipantJoinedMessage(BaseModel):
    type: Literal["participant_joined"]
    participant: ParticipantResponse

class WsParticipantLeftMessage(BaseModel):
    type: Literal["participant_left"]
    participantId: str

class WsParticipantCursorMessage(BaseModel):
    type: Literal["participant_cursor"]
    participantId: str
    line: int
    column: int

class WsErrorMessage(BaseModel):
    type: Literal["error"]
    message: str

# Union type for all WebSocket messages
WsMessage = Union[
    WsJoinMessage,
    WsCodeUpdateMessage,
    WsLanguageChangeMessage,
    WsCursorUpdateMessage,
    WsSessionStateMessage,
    WsParticipantJoinedMessage,
    WsParticipantLeftMessage,
    WsParticipantCursorMessage,
    WsErrorMessage
]
