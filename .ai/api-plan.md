# REST API Plan for PresMinder

## 1. Resources

| Resource | Database Table | Description                                                       |
|----------|---------------|-------------------------------------------------------------------|
| Account | auth.users | User account management operations - managed throuh Supabase Auth |
| Relations | relations | Dictionary of relationship types                                  |
| Occasions | occasions | Dictionary of occasion types                                      |
| Ideas | ideas | Gift ideas with metadata                                          |

## 2. Endpoints

### 2.2 Dictionary Resources

#### GET /api/relations
Retrieve all available relationship types.

**Authentication:** Required (JWT)

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "friend"
    },
    {
      "id": 2,
      "name": "parent"
    }
  ]
}
```

**Error Responses:**
- 401 Unauthorized: Missing or invalid token
  ```json
  {
    "error": "Authentication required"
  }
  ```

#### GET /api/occasions
Retrieve all available occasion types.

**Authentication:** Required (JWT)

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "birthday"
    },
    {
      "id": 2,
      "name": "anniversary"
    }
  ]
}
```

**Error Responses:**
- 401 Unauthorized: Missing or invalid token
  ```json
  {
    "error": "Authentication required"
  }
  ```

---

### 2.3 Gift Ideas

#### GET /api/ideas
Retrieve paginated list of user's gift ideas.

**Authentication:** Required (JWT)

**Query Parameters:**
- `page` (integer, optional, default: 1): Page number
- `limit` (integer, optional, default: 20, max: 100): Items per page
- `sort` (string, optional, default: "created_at"): Sort field (created_at, updated_at, name)
- `order` (string, optional, default: "desc"): Sort order (asc, desc)
- `relation_id` (integer, optional): Filter by relation ID
- `occasion_id` (integer, optional): Filter by occasion ID
- `source` (string, optional): Filter by source (manual, ai, edited-ai)

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": 123,
      "name": "Gaming headset for John",
      "content": "High-quality wireless gaming headset with noise cancellation...",
      "age": 25,
      "interests": "gaming, technology",
      "person_description": "Avid gamer, plays competitive FPS",
      "budget_min": 100,
      "budget_max": 200,
      "relation_id": 1,
      "relation_name": "friend",
      "occasion_id": 1,
      "occasion_name": "birthday",
      "source": "ai",
      "created_at": "2025-10-01T10:30:00Z",
      "updated_at": "2025-10-01T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

**Error Responses:**
- 401 Unauthorized: Missing or invalid token
- 400 Bad Request: Invalid query parameters
  ```json
  {
    "error": "Validation error",
    "details": ["limit must be between 1 and 100"]
  }
  ```

#### GET /api/ideas/:id
Retrieve a specific gift idea by ID.

**Authentication:** Required (JWT)

**URL Parameters:**
- `id` (integer, required): Idea ID

**Success Response (200 OK):**
```json
{
  "data": {
    "id": 123,
    "name": "Gaming headset for John",
    "content": "High-quality wireless gaming headset with noise cancellation...",
    "age": 25,
    "interests": "gaming, technology",
    "person_description": "Avid gamer, plays competitive FPS",
    "budget_min": 100,
    "budget_max": 200,
    "relation_id": 1,
    "relation_name": "friend",
    "occasion_id": 1,
    "occasion_name": "birthday",
    "source": "ai",
    "created_at": "2025-10-01T10:30:00Z",
    "updated_at": "2025-10-01T10:30:00Z"
  }
}
```

**Error Responses:**
- 401 Unauthorized: Missing or invalid token
- 404 Not Found: Idea does not exist or does not belong to user
  ```json
  {
    "error": "Idea not found"
  }
  ```

#### POST /api/ideas
Create a new gift idea.

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "name": "string (required, min 2 characters)",
  "content": "string (required)",
  "age": "integer (optional, 1-500)",
  "interests": "string (optional)",
  "person_description": "string (optional)",
  "budget_min": "number (optional, >= 0)",
  "budget_max": "number (optional, >= budget_min)",
  "relation_id": "integer (optional)",
  "occasion_id": "integer (optional)",
  "source": "enum: manual|ai|edited-ai (required, default: manual)"
}
```

**Success Response (201 Created):**
```json
{
  "data": {
    "id": 124,
    "name": "Gaming headset for John",
    "content": "High-quality wireless gaming headset...",
    "age": 25,
    "interests": "gaming, technology",
    "person_description": "Avid gamer",
    "budget_min": 100,
    "budget_max": 200,
    "relation_id": 1,
    "relation_name": "friend",
    "occasion_id": 1,
    "occasion_name": "birthday",
    "source": "manual",
    "created_at": "2025-10-13T14:20:00Z",
    "updated_at": "2025-10-13T14:20:00Z"
  }
}
```

**Error Responses:**
- 401 Unauthorized: Missing or invalid token
- 400 Bad Request: Validation errors
  ```json
  {
    "error": "Validation error",
    "details": [
      "name must be at least 2 characters",
      "budget_max must be greater than or equal to budget_min"
    ]
  }
  ```

#### PUT /api/ideas/:id
Update an existing gift idea.

**Authentication:** Required (JWT)

**URL Parameters:**
- `id` (integer, required): Idea ID

**Request Body:**
```json
{
  "name": "string (optional, min 2 characters)",
  "content": "string (optional)",
  "age": "integer (optional, 1-500)",
  "interests": "string (optional)",
  "person_description": "string (optional)",
  "budget_min": "number (optional, >= 0)",
  "budget_max": "number (optional, >= budget_min)",
  "relation_id": "integer (optional, null to remove)",
  "occasion_id": "integer (optional, null to remove)"
}
```

**Business Logic:**
- If `content` field is updated and the new content is completely different from the old content (not just an edit), and the old `source` was "ai" or "edited-ai", the source may need to be changed to "manual" based on business rules.
- If content is edited but appears to be a modification rather than complete replacement, source changes from "ai" to "edited-ai".

**Success Response (200 OK):**
```json
{
  "data": {
    "id": 124,
    "name": "Updated Gaming headset for John",
    "content": "Updated content...",
    "age": 25,
    "interests": "gaming, technology, music",
    "person_description": "Avid gamer",
    "budget_min": 100,
    "budget_max": 250,
    "relation_id": 1,
    "relation_name": "friend",
    "occasion_id": 1,
    "occasion_name": "birthday",
    "source": "edited-ai",
    "created_at": "2025-10-13T14:20:00Z",
    "updated_at": "2025-10-13T14:25:00Z"
  }
}
```

**Error Responses:**
- 401 Unauthorized: Missing or invalid token
- 404 Not Found: Idea does not exist or does not belong to user
- 400 Bad Request: Validation errors
  ```json
  {
    "error": "Validation error",
    "details": ["budget_max must be greater than or equal to budget_min"]
  }
  ```

#### DELETE /api/ideas/:id
Delete a gift idea.

**Authentication:** Required (JWT)

**URL Parameters:**
- `id` (integer, required): Idea ID

**Success Response (200 OK):**
```json
{
  "message": "Idea deleted successfully"
}
```

**Error Responses:**
- 401 Unauthorized: Missing or invalid token
- 404 Not Found: Idea does not exist or does not belong to user
  ```json
  {
    "error": "Idea not found"
  }
  ```

#### POST /api/ideas/generate
Generate gift idea suggestions using AI without saving them.

**Authentication:** Required (JWT)

**Rate Limiting:** 10 requests per minute per user

**Request Body:**
```json
{
  "age": "integer (optional, 1-500)",
  "interests": "string (optional)",
  "person_description": "string (optional)",
  "budget_min": "number (optional, >= 0)",
  "budget_max": "number (optional, >= budget_min)",
  "relation_id": "integer (optional)",
  "occasion_id": "integer (optional)"
}
```

**Success Response (200 OK):**
```json
{
  "data": {
    "suggestions": [
      {
        "content": "Wireless gaming headset with 7.1 surround sound and noise cancellation, perfect for competitive gaming sessions..."
      },
      {
        "content": "Mechanical RGB keyboard with custom keycaps, ideal for gaming and programming enthusiasts..."
      },
      {
        "content": "Gaming chair with lumbar support and adjustable armrests for long gaming sessions..."
      },
      {
        "content": "High-performance gaming mouse with programmable buttons and adjustable DPI..."
      },
      {
        "content": "Large gaming mousepad with LED lighting and non-slip rubber base..."
      }
    ],
    "metadata": {
      "model": "string",
      "generated_at": "2025-10-13T14:30:00Z"
    }
  }
}
```

**Error Responses:**
- 401 Unauthorized: Missing or invalid token
- 400 Bad Request: Validation errors
  ```json
  {
    "error": "Validation error",
    "details": ["budget_max must be greater than or equal to budget_min"]
  }
  ```
- 429 Too Many Requests: Rate limit exceeded
  ```json
  {
    "error": "Rate limit exceeded",
    "message": "Maximum 10 requests per minute. Please try again later.",
    "retry_after": 45
  }
  ```
- 503 Service Unavailable: AI service error
  ```json
  {
    "error": "AI service unavailable",
    "message": "Unable to generate suggestions at this time. Please try again later."
  }
  ```

---

## 3. Authentication and Authorization

### 3.1 Authentication Method

The API uses **JWT (JSON Web Token)** authentication provided by Supabase Auth.

### 3.2 Implementation Details

- **Client-side authentication:** Registration, login, and logout are handled directly through Supabase Auth SDK on the client side.
- **Token management:** After successful authentication, Supabase provides a JWT token that must be included in all authenticated API requests.
- **Token format:** Bearer token in Authorization header: `Authorization: Bearer <jwt_token>`
- **Token validation:** All protected endpoints validate the JWT token using Supabase's built-in validation.

### 3.3 Row Level Security (RLS)

- **User data isolation:** Database-level RLS policies ensure users can only access their own data.
- **Ideas table:** Users can only SELECT, INSERT, UPDATE, and DELETE their own ideas (where `user_id = auth.uid()`).
- **Dictionary tables:** All authenticated users can read relations and occasions tables.
- **Cascade deletion:** When a user account is deleted, all associated ideas are automatically deleted via CASCADE constraint.

### 3.4 Protected Endpoints

All endpoints require authentication except:
- Supabase Auth endpoints (handled by Supabase SDK)

### 3.5 Token Expiration

- Tokens expire according to Supabase Auth configuration (default: 1 hour).
- Refresh tokens are used to obtain new access tokens without re-authentication.
- Client should implement automatic token refresh logic.

---

## 4. Validation and Business Logic

### 4.1 Validation Rules

#### Ideas Resource

| Field | Validation Rules |
|-------|-----------------|
| name | Required, minimum 2 characters |
| content | Required, string |
| age | Optional, integer between 1 and 500 |
| interests | Optional, string |
| person_description | Optional, string |
| budget_min | Optional, numeric, must be >= 0 |
| budget_max | Optional, numeric, must be >= 0 and >= budget_min if both provided |
| relation_id | Optional, must reference existing relation.id |
| occasion_id | Optional, must reference existing occasion.id |
| source | Required, must be one of: 'manual', 'ai', 'edited-ai' |

#### Account Management

| Field | Validation Rules |
|-------|-----------------|
| email | Required, valid email format, unique |
| password | Required, minimum 8 characters |
| currentPassword | Required for password change |
| newPassword | Required for password change, minimum 8 characters, must be different from current |
| confirmation | Required for account deletion, must equal "DELETE_MY_ACCOUNT" |

### 4.2 Business Logic Implementation

#### Source Flag Management

The `source` field tracks the origin of idea content:

1. **Manual creation:**
   - When user creates an idea without using AI generation: `source = 'manual'`

2. **AI-generated:**
   - When user accepts AI suggestion and saves without editing: `source = 'ai'`

3. **Edited AI:**
   - When user accepts AI suggestion and makes modifications before saving: `source = 'edited-ai'`
   - When user edits an existing AI-generated idea: `source` changes from 'ai' to 'edited-ai'

4. **Complete rewrite:**
   - When user completely deletes AI-generated content and writes new content from scratch: `source` changes to 'manual'
   - Detection: Compare new content with old content using similarity algorithm (e.g., Levenshtein distance or simple length/character comparison)
   - Threshold: If less than 10% similarity or completely empty then rewritten, change to 'manual'

#### AI Generation Logic

1. **Input preparation:**
   - Collect all form fields except 'name'
   - Format data for AI prompt

2. **AI prompt structure:**
   ```
   Generate 5 gift ideas for:
   - Age: {age}
   - Interests: {interests}
   - Relation: {relation_name}
   - Occasion: {occasion_name}
   - Budget: ${budget_min} - ${budget_max}
   - Description: {person_description}

   Provide creative, specific, and practical gift suggestions.
   ```

3. **Response handling:**
   - Parse AI response into 5 separate suggestions
   - Return as structured JSON array
   - Handle errors gracefully with user-friendly messages

4. **Cost control:**
   - Implement rate limiting: 10 requests per minute per user
   - Monitor OpenRouter API usage and costs
   - Set spending limits on OpenRouter API key

#### Automatic Timestamps

- `created_at`: Automatically set to current timestamp on creation
- `updated_at`: Automatically updated to current timestamp on any modification via database trigger

#### Data Consistency

- Foreign key constraints ensure data integrity for `relation_id` and `occasion_id`
- Null values allowed for optional foreign keys (relation, occasion)
- On deletion of relation or occasion, set referenced fields to NULL (not CASCADE)

### 4.3 Error Handling

- **Validation errors:** Return 400 Bad Request with detailed field-level errors
- **Authentication errors:** Return 401 Unauthorized
- **Authorization errors:** Return 403 Forbidden (when authenticated but not authorized)
- **Not found errors:** Return 404 Not Found
- **Rate limit errors:** Return 429 Too Many Requests with retry-after header
- **Server errors:** Return 500 Internal Server Error with generic message (log details server-side)
- **AI service errors:** Return 503 Service Unavailable when OpenRouter API is down

### 4.4 Performance Optimizations

- **Pagination:** Required for GET /api/ideas to prevent large result sets
- **Indexing:** Leverage database indexes for efficient queries:
  - `idx_ideas_user_created` for user's chronological idea lists
  - `idx_ideas_relation` for filtering by relation
  - `idx_ideas_occasion` for filtering by occasion
  - `idx_ideas_source` for analytics and filtering

- **Caching:** Dictionary tables (relations, occasions) can be cached client-side as they rarely change

- **Query optimization:** Join relations and occasions tables in idea queries to reduce round trips
