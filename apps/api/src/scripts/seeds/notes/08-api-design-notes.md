# API Design Principles

Notes from building and using various APIs.

## URL Structure

```
GET    /api/users           # List
POST   /api/users           # Create
GET    /api/users/:id       # Read
PUT    /api/users/:id       # Update
DELETE /api/users/:id       # Delete
```

## Response Format

Always consistent:

```json
{
  "success": true,
  "data": { },
  "error": null
}
```

## Status Codes

- 200: Success
- 201: Created
- 400: Bad request
- 401: Unauthorized
- 404: Not found
- 500: Server error

## Best Practices

- Use nouns, not verbs in URLs
- Version your API (`/api/v1/`)
- Paginate list endpoints
- Include rate limit headers
- Return useful error messages

## Common Mistakes

- Inconsistent naming
- Missing validation
- No pagination
- Overly nested resources
- Not documenting errors

Good APIs are boring and predictable. That's the point.
