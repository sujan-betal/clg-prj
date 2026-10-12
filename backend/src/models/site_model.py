from sqlalchemy import Column, Integer, String, Date, DateTime, Text, ForeignKey
from sqlalchemy.sql import func

from src.config.base import Base, GUID, new_uuid


class Event(Base):

    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    public_id = Column(GUID, unique=True, index=True, default=new_uuid, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    event_date = Column(Date, nullable=True)
    venue = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class GalleryItem(Base):

    __tablename__ = "gallery_items"

    id = Column(Integer, primary_key=True, index=True)
    public_id = Column(GUID, unique=True, index=True, default=new_uuid, nullable=False)
    title = Column(String(255), nullable=False)
    album = Column(String(150), nullable=True)
    image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class SiteContent(Base):

    __tablename__ = "site_contents"

    id = Column(Integer, primary_key=True, index=True)
    public_id = Column(GUID, unique=True, index=True, default=new_uuid, nullable=False)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(Text, nullable=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Certificate(Base):

    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    public_id = Column(GUID, unique=True, index=True, default=new_uuid, nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    title = Column(String(255), nullable=False)
    certificate_no = Column(String(100), nullable=True)
    issued_on = Column(Date, nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class ContactMessage(Base):

    __tablename__ = "contact_messages"

    id = Column(Integer, primary_key=True, index=True)
    public_id = Column(GUID, unique=True, index=True, default=new_uuid, nullable=False)
    name = Column(String(150), nullable=False)
    email = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())