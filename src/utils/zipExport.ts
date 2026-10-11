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
GEMINI_API_KEY="AIzaSy..."
GEMINI_MODEL="gemini-2.5-flash"
PACKAGE_PRICE_UZS=15000
CARDS_PER_PACKAGE=5
USE_MOCK_SERVICES=false
PORT=7860
`);

  // Add README.md with Hugging Face Spaces frontmatter
  zip.file('README.md', `---
title: EcommerceAICardBot
emoji: 🛍️
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# 🛍️ EcommerceAICardBot

**Zero-prompt AI product card generator Telegram bot for e-commerce and online sellers.**
Powered by **Google AI Studio (Gemini 2.5 Flash)**, **Aiogram 3.x**, and **Click / Payme Telegram Native Payments**.

---

## 🚀 Hugging Face Spaces Deployment Guide

### 1. Create a New Space
1. Go to [huggingface.co/new-space](https://huggingface.co/new-space)
2. **Space Name:** \`EcommerceAICardBot\`
3. **Select the Space SDK:** Choose **Docker** -> **Blank**
4. **Space Hardware:** CPU Basic (Free)

### 2. Configure Environment Secrets
In your Hugging Face Space settings (**Settings > Variables and secrets > New secret**):
- \`BOT_TOKEN\`: Your Telegram Bot Token from \`@BotFather\`
- \`GEMINI_API_KEY\`: Your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
- \`CLICK_PROVIDER_TOKEN\`: Click payment token (from \`@BotFather\` -> Payments)
- \`PAYME_PROVIDER_TOKEN\`: Payme payment token (from \`@BotFather\` -> Payments)
- \`DATABASE_URL\`: PostgreSQL connection URL (e.g. from Supabase / Neon / Cloud SQL)

### 3. Push Code to Hugging Face
\`\`\`bash
git remote add space https://huggingface.co/spaces/YOUR_USERNAME/EcommerceAICardBot
git add .
git commit -m "Deploy EcommerceAICardBot to Hugging Face Spaces"
git push space main
\`\`\`

The space runs \`app.py\` on port \`7860\` and handles Telegram polling 24/7!
`);

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'EcommerceAICardBot-HuggingFace-Aiogram3.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
