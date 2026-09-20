# Deployment Guide

OceanEmbed-X is a Next.js frontend application that can be deployed to various cloud providers or containerized with Docker.

## Vercel (Recommended)

1. Push your code to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Vercel automatically detects Next.js configuration.
4. Click **Deploy**.

## Netlify

1. Connect your repository to Netlify.
2. Build command: `npm run build`
3. Publish directory: `.next`

## Docker Deployment

Build and run using the multi-stage Docker setup:

```bash
docker build -t oceanembed-x .
docker run -p 3000:3000 oceanembed-x
```
