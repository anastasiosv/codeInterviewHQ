from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from app import database
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session as DBSession
import uuid
import json

from app import schemas, models, database

app = FastAPI(title="CodeInterviewHQ API", openapi_url="/openapi.json")

# Create tables on startup if they do not exist
@app.on_event("startup")
async def startup_event():
    # Import models to ensure they are registered with Base
    from app import models
    # Create all tables
    models.Base.metadata.create_all(bind=database.engine)

# CORS configuration – allow frontend (localhost:5173) and any origin in production
origins = [
    "http://localhost:5173",
    "http://localhost",
    "http://127.0.0.1",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get DB session
def get_db():
    db = next(database.get_db())
    try:
        return db
    finally:
        db.close()

# In‑memory connection manager for WebSocket sessions
class ConnectionManager:
    def __init__(self):
        # Mapping: session_id -> set of WebSocket connections
        self.active_connections: dict[str, set[WebSocket]] = {}
        # Mapping: websocket -> participant_id (for cleanup)
        self.ws_to_participant: dict[WebSocket, str] = {}

    async def connect(self, websocket: WebSocket, session_id: str, participant_id: str):
        await websocket.accept()
        self.active_connections.setdefault(session_id, set()).add(websocket)
        self.ws_to_participant[websocket] = participant_id

    def disconnect(self, websocket: WebSocket, session_id: str):
        self.active_connections.get(session_id, set()).discard(websocket)
        self.ws_to_participant.pop(websocket, None)
        if not self.active_connections.get(session_id):
            self.active_connections.pop(session_id, None)

    async def broadcast(self, session_id: str, message: dict):
        if session_id not in self.active_connections:
            return
        data = json.dumps(message)
        for connection in self.active_connections[session_id]:
            await connection.send_text(data)

manager = ConnectionManager()

# ---------- REST API ----------
@app.post("/api/sessions", response_model=schemas.SessionResponse)
def create_or_get_session(payload: schemas.SessionCreate, db: DBSession = Depends(get_db)):
    # Try to fetch existing session
    session = db.query(models.Session).filter(models.Session.id == payload.id).first()
    if session:
        return schemas.SessionResponse(**session.to_dict())
    # Create new session with default code template and language
    new_session = models.Session(
        id=payload.id,
        code=schemas.CODE_TEMPLATES["javascript"],
        language="javascript",
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return schemas.SessionResponse(**new_session.to_dict())

@app.get("/api/sessions/{session_id}", response_model=schemas.SessionResponse)
def get_session(session_id: str, db: DBSession = Depends(get_db)):
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return schemas.SessionResponse(**session.to_dict())

# ---------- WebSocket ----------
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    session_id = None
    participant_id = None
    try:
        # First message must be a join request
        raw = await websocket.receive_text()
        join_msg = schemas.WsJoinMessage.parse_raw(raw)
        if join_msg.type != "join":
            await websocket.send_json(schemas.WsErrorMessage(type="error", message="First message must be join").dict())
            await websocket.close()
            return
        session_id = join_msg.sessionId
        participant_name = join_msg.name
        # Create participant in DB
        db = next(database.get_db())
        participant_id = str(uuid.uuid4())
        # Choose color based on existing participants count
        existing = db.query(models.Participant).filter(models.Participant.session_id == session_id).count()
        color = schemas.PARTICIPANT_COLORS[existing % len(schemas.PARTICIPANT_COLORS)]
        participant = models.Participant(
            id=participant_id,
            session_id=session_id,
            name=participant_name,
            color=color,
        )
        db.add(participant)
        db.commit()
        db.refresh(participant)
        # Register connection
        await manager.connect(websocket, session_id, participant_id)
        # Send initial session state to the new participant
        session = db.query(models.Session).filter(models.Session.id == session_id).first()
        participants = db.query(models.Participant).filter(models.Participant.session_id == session_id).all()
        await websocket.send_json(
            schemas.WsSessionStateMessage(
                type="session_state",
                code=session.code,
                language=session.language,
                participants=[schemas.ParticipantResponse(**p.to_dict()) for p in participants],
                myParticipantId=participant_id,
            ).dict()
        )
        # Notify others about the new participant
        await manager.broadcast(
            session_id,
            schemas.WsParticipantJoinedMessage(
                type="participant_joined",
                participant=schemas.ParticipantResponse(**participant.to_dict()),
            ).dict(),
        )
        # Main loop – handle incoming messages
        while True:
            raw_msg = await websocket.receive_text()
            try:
                # Determine message type by trying each schema
                for schema in [
                    schemas.WsCodeUpdateMessage,
                    schemas.WsLanguageChangeMessage,
                    schemas.WsCursorUpdateMessage,
                ]:
                    try:
                        parsed = schema.parse_raw(raw_msg)
                        break
                    except Exception:
                        parsed = None
                if not parsed:
                    raise ValueError("Unknown message type")
                if isinstance(parsed, schemas.WsCodeUpdateMessage):
                    # Update DB
                    db.query(models.Session).filter(models.Session.id == session_id).update({"code": parsed.code})
                    db.commit()
                    # Broadcast to others
                    await manager.broadcast(
                        session_id,
                        schemas.WsCodeUpdateMessage(type="code_update", code=parsed.code).dict(),
                    )
                elif isinstance(parsed, schemas.WsLanguageChangeMessage):
                    db.query(models.Session).filter(models.Session.id == session_id).update({"language": parsed.language})
                    db.commit()
                    await manager.broadcast(
                        session_id,
                        schemas.WsLanguageChangeMessage(type="language_change", language=parsed.language).dict(),
                    )
                elif isinstance(parsed, schemas.WsCursorUpdateMessage):
                    db.query(models.Participant).filter(models.Participant.id == participant_id).update(
                        {"cursor_line": parsed.line, "cursor_column": parsed.column}
                    )
                    db.commit()
                    await manager.broadcast(
                        session_id,
                        schemas.WsParticipantCursorMessage(
                            type="participant_cursor",
                            participantId=participant_id,
                            line=parsed.line,
                            column=parsed.column,
                        ).dict(),
                    )
            except Exception as exc:
                await websocket.send_json(schemas.WsErrorMessage(type="error", message=str(exc)).dict())
    except WebSocketDisconnect:
        # Cleanup on disconnect
        if session_id and participant_id:
            manager.disconnect(websocket, session_id)
            # Remove participant from DB
            db = next(database.get_db())
            db.query(models.Participant).filter(models.Participant.id == participant_id).delete()
            db.commit()
            # Notify remaining participants
            await manager.broadcast(
                session_id,
                schemas.WsParticipantLeftMessage(type="participant_left", participantId=participant_id).dict(),
            )
    except Exception as e:
        await websocket.send_json(schemas.WsErrorMessage(type="error", message=str(e)).dict())
        await websocket.close()

# ---------- Static Files & SPA ----------
# Mount assets directory if it exists (for production/docker)
if os.path.isdir("static/assets"):
    app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")

# Catch-all route for SPA
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # If API or WS route not matched, return 404
    if full_path.startswith("api") or full_path.startswith("ws"):
        raise HTTPException(status_code=404, detail="Not Found")
    
    # Check if file exists in static directory (e.g. favicon.png)
    static_file = f"static/{full_path}"
    if os.path.isfile(static_file):
        return FileResponse(static_file)
    
    # Otherwise return index.html for client-side routing
    if os.path.isfile("static/index.html"):
        return FileResponse("static/index.html")
        
    # Fallback if static files are not present (e.g. local dev without build)
    raise HTTPException(status_code=404, detail="Static files not found. Run in Docker or build frontend.")
