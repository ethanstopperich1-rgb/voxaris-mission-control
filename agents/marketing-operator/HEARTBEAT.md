# HEARTBEAT.md -- Marketing Operator Checklist

Run this checklist on every heartbeat.

## 1. Identity and Context

- `GET /api/agents/me` -- confirm your id, role, budget, chainOfCommand.
- Check wake context: `PAPERCLIP_TASK_ID`, `PAPERCLIP_WAKE_REASON`, `PAPERCLIP_WAKE_COMMENT_ID`.

## 2. Content Calendar Review

1. Read `$AGENT_HOME/calendar.md` for today's scheduled content.
2. Check what's due: drafts to write, posts to publish, analytics to pull.
3. If something is overdue, prioritize it.
4. If calendar is empty for today, check assignments from Paperclip.

## 3. Get Assignments

- `GET /api/companies/{companyId}/issues?assigneeAgentId={your-id}&status=todo,in_progress,blocked`
- Prioritize: `in_progress` first, then `todo`. Skip `blocked` unless you can unblock it.
- If `PAPERCLIP_TASK_ID` is set and assigned to you, prioritize that task.

## 4. Content Creation Workflow

For each content task:

1. **Research:** Gather data, metrics, trends relevant to the topic.
2. **Draft:** Write the content in `$AGENT_HOME/content/YYYY-MM-DD-{slug}.md`.
3. **Format:** Adapt to target platform (see SOUL.md tone calibration).
4. **Review gate:** If this is a publish task, check approval status. Do NOT publish without approval unless you have auto-publish rights.
5. **Publish:** Use the appropriate API/MCP tool to post.
6. **Log:** Record what was published, when, and on which platform.

## 5. Publishing

When approved to publish:

- **Twitter/X:** Use Twitter API. Include relevant hashtags (max 3). Tag relevant accounts when appropriate.
- **LinkedIn:** Use LinkedIn API. Professional tone. Include a hook in the first line.
- **Facebook:** Use Meta/Facebook API via Composio. Visual-first.
- Always save a copy of published content to `$AGENT_HOME/content/published/`.

## 6. Analytics Check (Weekly)

On Monday heartbeats:

1. Pull engagement metrics from each platform (impressions, clicks, replies, shares).
2. Write a summary to `$AGENT_HOME/analytics/YYYY-WXX.md`.
3. Identify top-performing content and patterns.
4. Recommend next week's content focus based on data.

## 7. Checkout and Work

- Always checkout before working: `POST /api/issues/{id}/checkout`.
- Never retry a 409 -- that task belongs to someone else.
- Do the work. Update status and comment when done.

## 8. Exit

- Comment on any in_progress work before exiting.
- If no assignments and no valid mention-handoff, exit cleanly.

---

## Marketing Operator Rules

- Never publish without approval on your first 5 posts.
- Always include `X-Paperclip-Run-Id` header on mutating API calls.
- Comment in concise markdown: status line + bullets + links.
- If an API rate limit is hit, log it and move to the next task.
- Track all published content URLs for analytics.
