# Course catalog

`GET /api/courses` searches the training course catalog. The Hono route in `@axc/rest` delegates filtering, pagination, and sorting to `@axc/application-services`, using the seeded catalog in `@axc/persistence`.

## Request

```http
GET /api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title
```

All query parameters are optional.

| Parameter | Default | Allowed values | Notes |
| --- | --- | --- | --- |
| `q` | none | any string | Case-insensitive keyword match against title, summary, or tags. |
| `modality` | none | `online`, `in-person`, `hybrid` | Exact match. |
| `status` | none | `draft`, `active`, `retired` | Exact match. |
| `tag` | none | any string | Case-insensitive exact match against a course tag. |
| `page` | `1` | integer ≥ 1 | Page number. |
| `pageSize` | `10` | integer 1–50 | Page size. Maximum is 50. |
| `sort` | `title` | `title`, `createdAt`, `updatedAt` | Ascending sort. |

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
| `items` | Courses for the requested page after filters and sorting. Empty when nothing matches. |
| `page` | Echo of the resolved page number. |
| `pageSize` | Echo of the resolved page size. |
| `totalItems` | Number of courses matching the filters. |
| `totalPages` | Number of pages at the resolved page size, or `0` when `totalItems` is `0`. |

Each course includes `id`, `title`, `summary`, `modality`, `status`, `tags`, `createdAt`, and `updatedAt`.

## Error response

Invalid `modality`, `status`, `page`, `pageSize`, or `sort` values return `400`:

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

No matching courses return `200` with `"items": []` and pagination metadata. That is not an error.

## Example

```bash
curl -s "https://api.agentcourses.localhost/api/courses?q=security&status=active&pageSize=5"
```
