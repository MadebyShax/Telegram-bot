---
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
2. **Space Name:** `EcommerceAICardBot`
3. **License:** `apache-2.0` or `mit`
4. **Select the Space SDK:** Choose **Docker** -> **Blank**
5. **Space Hardware:** CPU Basic (Free) is sufficient!

### 2. Configure Environment Secrets
In your Hugging Face Space settings (**Settings > Variables and secrets > New secret**):
* `BOT_TOKEN`: Your Telegram Bot Token from `@BotFather`
* `GEMINI_API_KEY`: Your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
* `CLICK_PROVIDER_TOKEN`: Click payment token (from `@BotFather` -> Payments)
* `PAYME_PROVIDER_TOKEN`: Payme payment token (from `@BotFather` -> Payments)
* `DATABASE_URL`: Your PostgreSQL / Supabase connection URL (e.g. `postgresql+asyncpg://postgres:...@...supabase.co:5432/postgres`)

Optional variables:
* `GEMINI_IMAGE_MODEL`: Gemini image model that turns the seller's photo into studio cards (default `gemini-2.5-flash-image`; check its quota/pricing for your key in Google AI Studio)
* `IMAGE_GEN_CONCURRENCY`: how many cards are generated in parallel (default `2`)

See `.env.example` for the full list.

### 3. Push Code to Hugging Face
```bash
git remote add space https://huggingface.co/spaces/YOUR_USERNAME/EcommerceAICardBot
git add .
git commit -m "Deploy EcommerceAICardBot to Hugging Face Spaces"
git push space main
```

Your space will automatically build the Docker container, run the healthcheck on port `7860`, and start the Telegram bot!
