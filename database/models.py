import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Any
from sqlalchemy import (
    BigInteger,
    String,
    Integer,
    Numeric,
    Text,
    DateTime,
    ForeignKey,
    func
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.types import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database.db import Base


class User(Base):
    """
    Telegram users registered with the bot.
    Tracks credit balance for generating 5-card marketplace packs.
    """
    __tablename__ = "users"

    telegram_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    username: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    credits: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relationships
    transactions: Mapped[List["Transaction"]] = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    card_generations: Mapped[List["CardGeneration"]] = relationship("CardGeneration", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User telegram_id={self.telegram_id} username={self.username} credits={self.credits}>"


class Transaction(Base):
    """
    Click & Payme native Telegram payment transactions.
    """
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.telegram_id", ondelete="CASCADE"),
        nullable=False
    )
    amount_uzs: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False
    )
    provider: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )  # 'CLICK', 'PAYME'
    status: Mapped[str] = mapped_column(
        String(50),
        default="PENDING",
        nullable=False
    )  # 'PENDING', 'SUCCESS', 'FAILED'
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="transactions")

    def __repr__(self) -> str:
        return f"<Transaction id={self.id} user_id={self.user_id} amount_uzs={self.amount_uzs} status={self.status}>"


class CardGeneration(Base):
    """
    Records of zero-prompt product card generations.
    Contains raw photo link, GPT-4o vision metadata, generated Flux card image links, and SEO copy.
    """
    __tablename__ = "card_generations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.telegram_id", ondelete="CASCADE"),
        nullable=False
    )
    original_image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    product_metadata: Mapped[Optional[dict[str, Any]]] = mapped_column(
        JSONB().with_variant(JSON(), "sqlite"),
        nullable=True
    )
    generated_image_urls: Mapped[Optional[List[str]]] = mapped_column(
        ARRAY(Text).with_variant(JSON(), "sqlite"),
        nullable=True
    )
    generated_seo_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cost_usd: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(6, 4),
        default=Decimal("0.0240"),
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="card_generations")

    def __repr__(self) -> str:
        return f"<CardGeneration id={self.id} user_id={self.user_id} created_at={self.created_at}>"
