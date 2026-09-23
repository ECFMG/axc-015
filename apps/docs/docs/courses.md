# Course catalog

`GET /api/courses` returns a page of training courses. The catalog is seeded in the API process, so the route does not call an external service.

## Request

```http
GET /api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title
```

| Query parameter | Default | Rule |
| --- | --- | --- |
| `q` | omitted | Case-insensitive substring match against `title`, `summary`, or any tag. A blank value is ignored. |
| `modality` | omitted | `online`, `in-person`, or `hybrid`. |
| `status` | omitted | `draft`, `active`, or `retired`. |
| `tag` | omitted | Case-insensitive exact tag match. Must be non-empty when present. |
| `page` | `1` | Integer greater than or equal to 1. |
| `pageSize` | `10` | Integer from 1 through 50. |
| `sort` | `title` | `title`, `createdAt`, or `updatedAt`. Sort order is ascending. |

Filters combine with AND. Unknown query parameters, repeated parameters, and values outside the rules above are rejected.

## Successful response

`200` with this JSON body:

```json
{
  "items": [
    {
      "id": "course-001",
      "title": "AI Security Foundations",
      "summary": "Introductory course on secure AI-assisted development.",
      "modality": "online",
      "status": "active",
      "tags": ["ai", "security"],
      "createdAt": "2026-01-15T00:00:00.000Z",
      "updatedAt": "2026-06-01T00:00:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 5,
  "totalItems": 1,
  "totalPages": 1
}
```

| Field | Meaning |
| --- | --- |
| `items` | Courses on this page, after filters and sorting. |
| `page` | Requested page, or `1` when omitted. |
| `pageSize` | Requested page size, or `10` when omitted. |
| `totalItems` | Number of courses that match the filters. |
| `totalPages` | `0` when `totalItems` is `0`, otherwise `ceil(totalItems / pageSize)`. |

A request that matches nothing is still `200`. `items` is an empty array and `totalItems` is `0`. A page past the end is also `200` with an empty `items` array and the real totals.

## Error response

Invalid query parameters return `400`:

```json
{
  "error": {
    "code": "INVALID_QUERY_PARAMETER",
    "message": "One or more query parameters are invalid.",
    "details": [
      {
        "field": "pageSize",
        "message": "pageSize must be between 1 and 50."
      }
    ]
  }
}
```

`details` lists every invalid parameter on the request.

## Example

```bash
curl -s "https://api.agentcourses.localhost/api/courses?q=security&modality=online&status=active"
```

Local `pnpm run dev` publishes the API through portless at `https://api.agentcourses.localhost`.
