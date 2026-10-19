# TOOLS.md -- Marketing Operator Tools

## Social Media APIs

### Twitter/X
- **Post tweet:** `POST https://api.twitter.com/2/tweets` with Bearer token
- **Post thread:** Chain tweets with `reply.in_reply_to_tweet_id`
- **Get metrics:** `GET https://api.twitter.com/2/tweets/{id}?tweet.fields=public_metrics`
- Auth: OAuth 2.0 Bearer Token (env: `TWITTER_BEARER_TOKEN`)

### LinkedIn
- **Post:** `POST https://api.linkedin.com/v2/ugcPosts` with access token
- **Get analytics:** `GET https://api.linkedin.com/v2/organizationalEntityShareStatistics`
- Auth: OAuth 2.0 (env: `LINKEDIN_ACCESS_TOKEN`)

### Meta/Facebook
- Available via Composio MCP integration (`facebook-automation` skill)
- **Create post:** Use Composio tool for Facebook Page posts
- **Schedule post:** Set `scheduled_publish_time` in post creation
- **Upload video:** Supported via Composio

## Content Generation

### Image Prompts
- Write detailed prompts for AI image generation
- Save prompts to `$AGENT_HOME/content/image-prompts/`
- Reference SOUL.md visual style: dark, premium, technical

### Carousel/Slide Decks
- Generate carousel content as structured markdown
- Format: slide-by-slide with headline, body, visual direction

## MCP Tools Available

These are available in your Claude Code environment:
- `facebook-automation` -- Facebook Page management
- `twitter-algorithm-optimizer` -- Tweet optimization
- `elevenlabs-automation` -- Text-to-speech for video content
- `heygen-automation` -- AI video generation

## File System

- Content drafts: `$AGENT_HOME/content/`
- Published archive: `$AGENT_HOME/content/published/`
- Image prompts: `$AGENT_HOME/content/image-prompts/`
- Analytics reports: `$AGENT_HOME/analytics/`
- Calendar: `$AGENT_HOME/calendar.md`

## Notes

- Add tool-specific notes here as you discover rate limits, quirks, or best practices.
- Track API version changes and deprecations.
