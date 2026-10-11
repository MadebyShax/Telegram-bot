import JSZip from 'jszip';
import { PYTHON_CODEBASE_FILES } from '../data/pythonCodebase';

export async function downloadPythonProjectZip(): Promise<void> {
  const zip = new JSZip();

  // Add all Python project files
  for (const file of PYTHON_CODEBASE_FILES) {
    zip.file(file.path, file.content);
  }

  // Add .env.example
  zip.file('.env.example', `# Telegram Bot Configuration
BOT_TOKEN="YOUR_BOT_TOKEN_HERE"
DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/ecommerce_bot"
CLICK_PROVIDER_TOKEN="398061629:TEST:999999"
PAYME_PROVIDER_TOKEN="371317599:TEST:999999"
OPENAI_API_KEY="sk-proj-..."
REPLICATE_API_TOKEN="r8_..."
PACKAGE_PRICE_UZS=15000
CARDS_PER_PACKAGE=5
USE_MOCK_SERVICES=false
`);

  // Add README.md
  zip.file('README.md', `# EcommerceAICardBot

Zero-prompt AI product card generator Telegram bot for Uzum, Wildberries, and Instagram sellers in Uzbekistan.

## Tech Stack
- **Python 3.11+**
- **Aiogram 3.x**
- **PostgreSQL / Supabase** (Asyncpg & SQLAlchemy 2.0)
- **OpenAI GPT-4o Vision** / Google Gemini Vision
- **Flux.1** (via Replicate API / Fal.ai)
- **Click & Payme** (Telegram Native Payments in UZS)
- **Docker & Docker Compose**

## Quick Start
1. Clone or extract this archive
2. Copy environment variables:
   \`\`\`bash
   cp .env.example .env
   \`\`\`
3. Start with Docker Compose:
   \`\`\`bash
   docker-compose up -d --build
   \`\`\`
   Or run locally:
   \`\`\`bash
   python -m venv venv
   source venv/bin/activate  # on Windows: venv\\Scripts\\activate
   pip install -r requirements.txt
   python bot/main.py
   \`\`\`
`);

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'EcommerceAICardBot-Aiogram3-Template.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
