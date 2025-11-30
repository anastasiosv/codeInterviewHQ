import { type Session, type Participant, type SupportedLanguage, codeTemplates, participantColors } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Session operations
  getSession(id: string): Promise<Session | undefined>;
  createSession(id: string): Promise<Session>;
  updateSessionCode(id: string, code: string): Promise<void>;
  updateSessionLanguage(id: string, language: SupportedLanguage): Promise<void>;
  
  // Participant operations
  getParticipants(sessionId: string): Promise<Participant[]>;
  addParticipant(sessionId: string, name: string): Promise<Participant>;
  removeParticipant(participantId: string): Promise<void>;
  updateParticipantCursor(participantId: string, line: number, column: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private sessions: Map<string, Session>;
  private participants: Map<string, Participant>;
  private colorIndex: Map<string, number>;

  constructor() {
    this.sessions = new Map();
    this.participants = new Map();
    this.colorIndex = new Map();
  }

  async getSession(id: string): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async createSession(id: string): Promise<Session> {
    const session: Session = {
      id,
      code: codeTemplates.javascript,
      language: "javascript",
      createdAt: Date.now(),
    };
    this.sessions.set(id, session);
    this.colorIndex.set(id, 0);
    return session;
  }

  async updateSessionCode(id: string, code: string): Promise<void> {
    const session = this.sessions.get(id);
    if (session) {
      session.code = code;
    }
  }

  async updateSessionLanguage(id: string, language: SupportedLanguage): Promise<void> {
    const session = this.sessions.get(id);
    if (session) {
      session.language = language;
    }
  }

  async getParticipants(sessionId: string): Promise<Participant[]> {
    return Array.from(this.participants.values()).filter(
      (p) => p.sessionId === sessionId
    );
  }

  async addParticipant(sessionId: string, name: string): Promise<Participant> {
    const id = randomUUID();
    const colorIdx = this.colorIndex.get(sessionId) || 0;
    const color = participantColors[colorIdx % participantColors.length];
    this.colorIndex.set(sessionId, colorIdx + 1);

    const participant: Participant = {
      id,
      sessionId,
      name,
      color,
      cursorLine: null,
      cursorColumn: null,
    };
    this.participants.set(id, participant);
    return participant;
  }

  async removeParticipant(participantId: string): Promise<void> {
    this.participants.delete(participantId);
  }

  async updateParticipantCursor(participantId: string, line: number, column: number): Promise<void> {
    const participant = this.participants.get(participantId);
    if (participant) {
      participant.cursorLine = line;
      participant.cursorColumn = column;
    }
  }
}

export const storage = new MemStorage();
