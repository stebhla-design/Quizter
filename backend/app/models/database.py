from sqlalchemy import Column, Integer, String, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

SQLALCHEMY_DATABASE_URL = "sqlite:///./quizter.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class Quiz(Base):
    __tablename__ = "quizzes"
    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    category = Column(String)
    questions = Column(JSON) # Stores list of question objects
    owner_id = Column(Integer, ForeignKey("users.id"))

class SessionResult(Base):
    __tablename__ = "results"
    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(String, ForeignKey("quizzes.id"))
    participants_count = Column(Integer)
    avg_score = Column(Integer)
    created_at = Column(String)

class LiveSession(Base):
    __tablename__ = "live_sessions"
    id = Column(String, primary_key=True, index=True) # 6-digit code
    quiz_id = Column(String, ForeignKey("quizzes.id"))
    status = Column(String, default="waiting")
    current_question_index = Column(Integer, default=0)
    current_question_start = Column(Integer, default=0) # Epoch time

Base.metadata.create_all(bind=engine)
