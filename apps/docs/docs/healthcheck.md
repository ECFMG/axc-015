# Healthcheck

`GET /health` reports that the API process composed by `@apps/api` is running.

## Request

```http
GET /health
```

## Response

`200` with this JSON body:

```json
{
  "status": "ok",
  "service": "agentCourses-api",
  "projectCode": "axc",
  "environment": "<local|test|production>",
  "timestamp": "<ISO-8601 string>"
}
```

| Field | Meaning |
| --- | --- |
| `status` | Always `ok` when the route is served. |
| `service` | Always `agentCourses-api`. |
| `projectCode` | Always `axc`. |
| `environment` | `production` when `NODE_ENV` is `production`, `test` when `NODE_ENV` is `test`, otherwise `local`. |
| `timestamp` | ISO-8601 time when the response was created. |

## Example

```bash
curl -s https://api.agentcourses.localhost/health
```

Local `pnpm run dev` publishes the API through portless at `https://api.agentcourses.localhost`. A git worktree named `feature-a` uses `https://api.agentcourses.feature-a.localhost` when `WORKTREE_NAME=feature-a`.
