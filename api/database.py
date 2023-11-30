from sqlalchemy import create_engine
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

engine = create_engine('sqlite:///:memory:', echo=True)

Session = sessionmaker(bind=engine)
session = Session()
Base = declarative_base()

class Project(Base):
    __tablename__ = 'projects'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String)
    settings = Column(String)
    last_output = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    allowed_properties = ["name", "settings"]

    def __repr__(self):
        return f'Project {self.name}'

    def as_small_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "last_output": self.last_output,
            "updated_at": self.updated_at.timestamp() * 1000,
            "created_at": self.created_at.timestamp() * 1000
        }

    def as_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "settings": self.settings,
            "last_output": self.last_output,
            "updated_at": self.updated_at.timestamp() * 1000,
            "created_at": self.created_at.timestamp() * 1000
        }

class Model(Base):
    __tablename__ = 'models'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String)
    description = Column(String)
    image_url = Column(String)
    model_type = Column(String)
    filename = Column(String)
    source = Column(String)
    source_id = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    allowed_properties = ["name", "description", "image_url", "model_type", "filename", "source", "source_id"]

    def __repr__(self):
        return f'Model {self.name}'

    def as_small_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "image_url": self.image_url,
            "type": self.model_type,
            "filename": self.filename
        }

    def as_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "image_url": self.image_url,
            "type": self.model_type,
            "filename": self.filename,
            "source": self.source,
            "source_id": self.source_id,
            "updated_at": self.updated_at.timestamp() * 1000,
            "created_at": self.created_at.timestamp() * 1000
        }

Base.metadata.create_all(engine)