# Netlify Deployment Guide

## Prerequisites
1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Have a Netlify account (free tier is sufficient)

## Required Environment Variables

Set these environment variables in your Netlify dashboard under Site Settings > Environment Variables:

### Required
```
DATABASE_URL=file:./dev.db
NEXTAUTH_URL=https://your-site-name.netlify.app
NEXTAUTH_SECRET=your-production-secret-key-generate-a-secure-one
```

### Optional (if using OpenAI features)
```
OPENAI_API_KEY=your-openai-api-key
```

## Deployment Steps

### Option 1: Deploy via Netlify Dashboard
1. Log in to [Netlify](https://netlify.com)
2. Click "Add new site" > "Import an existing project"
3. Connect your Git provider and select your repository
4. Netlify will auto-detect the build settings from `netlify.toml`
5. Add the environment variables listed above
6. Click "Deploy site"

### Option 2: Deploy via Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize site
netlify init

# Deploy
netlify deploy --prod
```

## Build Configuration

The `netlify.toml` file includes:
- Build command: `npm run build`
- Publish directory: `.next` (SSR build)
- Functions directory: `.netlify/functions`
- Node.js version: 18
- Next.js plugin for optimal performance
- Security headers
- SPA routing redirects

## Important Notes

1. **Server-Side Rendering**: This app is configured with SSR support for Netlify:
   - API routes will work via Netlify Functions
   - Database operations use mock data (no persistent database needed initially)
   - NextAuth.js works with server-side configuration

2. **Database**: Currently using mock data. For production:
   - Consider migrating to a cloud database (Supabase, PlanetScale, etc.)
   - Update environment variables accordingly
   - Modify API routes to use real database connections

3. **Authentication**: NextAuth.js is configured but you'll need to add:
   - Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
   - Facebook OAuth credentials (FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET)
   - Or remove unused providers from the configuration

## Troubleshooting

- **Build fails**: Check Node.js version compatibility
- **Routes not working**: Ensure redirects are properly configured in `netlify.toml`
- **Environment variables**: Double-check they're set in Netlify dashboard
- **Database issues**: Consider migrating to a cloud database solution

## Performance Optimizations

The configuration includes:
- Image optimization disabled (required for static export)
- SWC minification enabled
- Security headers
- Proper caching headers
