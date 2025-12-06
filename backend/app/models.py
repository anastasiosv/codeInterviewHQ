from sqlalchemy import Column, String, Integer, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from app.database import Base
import time

class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, index=True)
    code = Column(String, nullable=False)
    language = Column(String, nullable=False, default="javascript")
    created_at = Column(BigInteger, nullable=False, default=lambda: int(time.time() * 1000))

    # Relationship to participants
    participants = relationship("Participant", back_populates="session", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "language": self.language,
            "createdAt": self.created_at
        }


class Participant(Base):
    __tablename__ = "participants"

    id = Column(String, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    color = Column(String, nullable=False)
    cursor_line = Column(Integer, nullable=True)
    cursor_column = Column(Integer, nullable=True)

    # Relationship to session
    session = relationship("Session", back_populates="participants")

    def to_dict(self):
        return {
            "id": self.id,
            "sessionId": self.session_id,
            "name": self.name,
            "color": self.color,
            "cursorLine": self.cursor_line,
            "cursorColumn": self.cursor_column
        }
