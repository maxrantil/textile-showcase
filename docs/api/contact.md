# Contact Form API

The contact form API handles email submissions from the portfolio website.

## Endpoint

```
POST /api/contact
```

## Authentication

None required - this is a public endpoint.

## Rate Limiting

- **Limit**: 5 requests per minute per IP address
- **Window**: 60 seconds (sliding)
- **Storage**: In-memory (resets on server restart)

When rate limited, the API returns HTTP 429.

## Request

### Headers

```
Content-Type: application/json
```

### Body

| Field     | Type   | Required | Constraints                          |
|-----------|--------|----------|--------------------------------------|
| `name`    | string | Yes      | 1-100 characters, trimmed            |
| `email`   | string | Yes      | Valid email format, max 254 chars    |
| `message` | string | Yes      | 10-5000 characters, trimmed          |

### Example Request

```bash
curl -X POST https://idaromme.dk/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "message": "I love your textile work! Would you be available for a commission?"
  }'
```

### JavaScript Example

```javascript
const response = await fetch('/api/contact', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    message: 'I love your textile work! Would you be available for a commission?',
  }),
});

const data = await response.json();
```

## Responses

### Success (200 OK)

```json
{
  "success": true,
  "message": "Your message has been sent successfully!"
}
```

### Validation Error (400 Bad Request)

Returned when input validation fails.

```json
{
  "error": "Name is required"
}
```

Possible validation errors:
- `"Name is required"`
- `"Name is too long"` (>100 chars)
- `"Invalid email address"`
- `"Email is too long"` (>254 chars)
- `"Message must be at least 10 characters"`
- `"Message is too long"` (>5000 chars)

### Rate Limited (429 Too Many Requests)

```json
{
  "error": "Too many requests. Please try again later."
}
```

### Service Unavailable (503)

Returned when the email service (Resend) is not configured.

```json
{
  "error": "Contact form is temporarily unavailable. Please try again later."
}
```

### Server Error (500)

```json
{
  "error": "Failed to send message. Please try again."
}
```

Or for unexpected errors:

```json
{
  "error": "An unexpected error occurred. Please try again."
}
```

## Security

### Input Sanitization

All input fields are sanitized to prevent XSS attacks:
- `<` becomes `&lt;`
- `>` becomes `&gt;`
- `"` becomes `&quot;`
- `'` becomes `&#x27;`
- `/` becomes `&#x2F;`

### Validation

Input validation uses Zod schema with:
- Automatic whitespace trimming
- Length constraints
- Email format validation
- Type checking

## Email Delivery

Emails are sent via [Resend](https://resend.com) to the configured `CONTACT_EMAIL` address.

### Email Format

The recipient receives an HTML-formatted email containing:
- Sender's name
- Sender's email address
- Message content
- Timestamp

## Environment Variables

| Variable        | Required | Description                           |
|-----------------|----------|---------------------------------------|
| `RESEND_API_KEY`| Yes      | API key from Resend                   |
| `CONTACT_EMAIL` | No       | Recipient email (defaults to configured value) |

## Testing

Run the contact API tests:

```bash
npm test tests/api/contact.test.ts
```

The test suite covers:
- Valid submissions
- Input validation
- Rate limiting
- XSS prevention
- Error handling
