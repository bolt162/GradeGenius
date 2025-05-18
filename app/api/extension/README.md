# Grade Genius Chrome Extension API

This directory contains API endpoints specifically designed for the Grade Genius Chrome extension. These endpoints allow the extension to authenticate, grade assignments, and interact with the Grade Genius backend.

## Authentication Flow

1. User must be logged in to the Grade Genius web application first
2. The Chrome extension calls `/api/extension/auth` with the extension ID
3. The server returns a JWT token that the extension should store in Chrome's storage API
4. All subsequent API calls should include this token in the Authorization header

## API Endpoints

### Authentication

**POST /api/extension/auth**
Authenticates the extension and returns a JWT token.

```
POST /api/extension/auth
Content-Type: application/json

{
  "extensionId": "your-extension-id"
}
```

Response:
```json
{
  "success": true,
  "token": "jwt-token",
  "userId": "user-id",
  "username": "user-email"
}
```

### Token Management

**GET /api/extension/tokens**
Returns the user's token balance.

```
GET /api/extension/tokens
Authorization: Bearer your-jwt-token
```

Response:
```json
{
  "success": true,
  "tokens": 10000
}
```

### Rubrics

**GET /api/extension/rubrics**
Returns the user's saved rubrics.

```
GET /api/extension/rubrics
Authorization: Bearer your-jwt-token
```

Response:
```json
{
  "success": true,
  "rubrics": [
    {
      "key": "rubric-key",
      "name": "CS101 Assignment",
      "lastModified": "2023-01-01T00:00:00Z"
    }
  ]
}
```

### Grading

**POST /api/extension/grade**
Grades student work using the AI. Note that a saved rubric is **mandatory** for the extension API.

```
POST /api/extension/grade
Content-Type: application/json
Authorization: Bearer your-jwt-token

{
  "studentWork": "Student's assignment content",
  "submissionType": "code|essay", // Optional, will be auto-detected if not provided
  "selectedRubricKey": "saved-rubric-key" // Required, must use a saved rubric from the web app
}
```

Response:
```json
{
  "success": true,
  "feedback": "Detailed feedback from AI",
  "type": "code|essay",
  "tokensUsed": 1000,
  "tokensRemaining": 9000
}
```

## Usage Example

```javascript
// Authenticate the extension
async function authenticate() {
  const response = await fetch('https://your-gradegenius-domain.com/api/extension/auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      extensionId: chrome.runtime.id
    })
  });
  
  const data = await response.json();
  if (data.success) {
    // Store the token for future use
    chrome.storage.local.set({ token: data.token });
    return data.token;
  } else {
    throw new Error(data.error);
  }
}

// Grade an assignment
async function gradeAssignment(text, rubricKey, token) {
  const response = await fetch('https://your-gradegenius-domain.com/api/extension/grade', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      studentWork: text,
      selectedRubricKey: rubricKey
    })
  });
  
  const data = await response.json();
  if (data.success) {
    return data.feedback;
  } else {
    throw new Error(data.error);
  }
}
```

## Error Handling

All API endpoints return appropriate HTTP status codes:

- 200: Success
- 400: Bad request (missing parameters or invalid parameters)
- 401: Unauthorized (missing or invalid token)
- 403: Forbidden (insufficient tokens)
- 404: Not found (rubric not found)
- 500: Server error

Error responses include an `error` field with a description of the error.

## Security Considerations

- The extension should store the JWT token securely using Chrome's storage API
- The token has a limited lifetime (30 days by default)
- In production, you should restrict CORS to your extension's origin
- Consider implementing rate limiting to prevent abuse

## Implementation Notes

- The extension uses JWT-based authentication while the web app uses cookie-based authentication
- The API strictly enforces parameter validation, returning 400 Bad Request for any non-allowed parameters
- The grading API now processes each question in the selected rubric individually:
  - Each question gets its own AI-generated response
  - The RAG (Retrieval Augmented Generation) service enhances responses with relevant context
  - Multiple responses are combined with separators between each question
- Graded submissions are stored in S3 with a virtual path: `{username}/extension/{timestamp}-submission.txt`
- CORS headers are configured in Next.js to allow requests from the extension 