import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { wsMessageSchema, type WsMessage, type SupportedLanguage } from "@shared/schema";

// Map of WebSocket connections to their participant info
interface ClientInfo {
  sessionId: string;
  participantId: string;
}

const clients = new Map<WebSocket, ClientInfo>();

// Get all clients in a session
function getSessionClients(sessionId: string): WebSocket[] {
  const sessionClients: WebSocket[] = [];
  clients.forEach((info, ws) => {
    if (info.sessionId === sessionId && ws.readyState === WebSocket.OPEN) {
      sessionClients.push(ws);
    }
  });
  return sessionClients;
}

// Broadcast message to all clients in a session except sender
function broadcastToSession(sessionId: string, message: WsMessage, excludeWs?: WebSocket) {
  const sessionClients = getSessionClients(sessionId);
  const messageStr = JSON.stringify(message);
  
  sessionClients.forEach((ws) => {
    if (ws !== excludeWs) {
      ws.send(messageStr);
    }
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // REST API endpoints
  app.post("/api/sessions", async (req, res) => {
    try {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: "Session ID is required" });
      }
      
      let session = await storage.getSession(id);
      if (!session) {
        session = await storage.createSession(id);
      }
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to get session" });
    }
  });

  // WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws: WebSocket) => {
    console.log("New WebSocket connection");

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        const parsed = wsMessageSchema.safeParse(message);
        
        if (!parsed.success) {
          ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
          return;
        }

        const msg = parsed.data;

        switch (msg.type) {
          case "join": {
            // Create session if it doesn't exist
            let session = await storage.getSession(msg.sessionId);
            if (!session) {
              session = await storage.createSession(msg.sessionId);
            }

            // Add participant
            const participant = await storage.addParticipant(msg.sessionId, msg.name);
            clients.set(ws, { sessionId: msg.sessionId, participantId: participant.id });

            // Send current session state to the new participant with their participant ID
            const participants = await storage.getParticipants(msg.sessionId);
            const stateMessage: WsMessage = {
              type: "session_state",
              code: session.code,
              language: session.language,
              participants,
              myParticipantId: participant.id,
            };
            ws.send(JSON.stringify(stateMessage));

            // Notify others about new participant
            broadcastToSession(msg.sessionId, {
              type: "participant_joined",
              participant,
            }, ws);
            break;
          }

          case "code_update": {
            const clientInfo = clients.get(ws);
            if (!clientInfo) return;

            await storage.updateSessionCode(clientInfo.sessionId, msg.code);
            broadcastToSession(clientInfo.sessionId, msg, ws);
            break;
          }

          case "language_change": {
            const clientInfo = clients.get(ws);
            if (!clientInfo) return;

            await storage.updateSessionLanguage(clientInfo.sessionId, msg.language as SupportedLanguage);
            broadcastToSession(clientInfo.sessionId, msg, ws);
            break;
          }

          case "cursor_update": {
            const clientInfo = clients.get(ws);
            if (!clientInfo) return;

            await storage.updateParticipantCursor(clientInfo.participantId, msg.line, msg.column);
            broadcastToSession(clientInfo.sessionId, {
              type: "participant_cursor",
              participantId: clientInfo.participantId,
              line: msg.line,
              column: msg.column,
            }, ws);
            break;
          }
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
        ws.send(JSON.stringify({ type: "error", message: "Failed to process message" }));
      }
    });

    ws.on("close", async () => {
      const clientInfo = clients.get(ws);
      if (clientInfo) {
        await storage.removeParticipant(clientInfo.participantId);
        broadcastToSession(clientInfo.sessionId, {
          type: "participant_left",
          participantId: clientInfo.participantId,
        });
        clients.delete(ws);
      }
      console.log("WebSocket connection closed");
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  return httpServer;
}
