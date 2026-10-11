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
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
