from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from config import settings


class Base(DeclarativeBase):
    """Base declarative class for all SQLAlchemy 2.0 async models."""
    pass


# Async engine configured for PostgreSQL with asyncpg driver
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)

# Async session factory
AsyncSessionFactory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)


async def get_session() -> AsyncSession:
    """Async session dependency generator."""
    async with AsyncSessionFactory() as session:
        yield session


async def init_db():
    """Initializes tables in database."""
    # Import models so they are registered on Base.metadata before create_all
    import database.models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # create_all never alters existing tables: add columns introduced after the first deploy
        await conn.execute(text(
            "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS telegram_charge_id VARCHAR(255)"
        ))
        await conn.execute(text(
            "CREATE UNIQUE INDEX IF NOT EXISTS ix_transactions_telegram_charge_id "
            "ON transactions (telegram_charge_id)"
        ))
