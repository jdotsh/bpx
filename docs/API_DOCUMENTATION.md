# **API Documentation**
## **BPMN Studio Web - REST API Reference**

---

## **Authentication**

All API endpoints require authentication unless specified otherwise.

### **Headers**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-CSRF-Token: <csrf_token> (for state-changing operations)
```

---

## **Endpoints**

### **Diagrams**

#### **GET /api/diagrams**
Get user's diagrams with pagination.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20, max: 50) - Items per page
- `projectId` (string, optional) - Filter by project

**Response:**
```json
{
  "data": [
    {
      "id": "diagram_123",
      "title": "Process Flow",
      "projectId": "project_456",
      "thumbnailUrl": "https://...",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `400` - Invalid parameters

---

#### **POST /api/diagrams**
Create a new diagram.

**Request Body:**
```json
{
  "title": "New Process",
  "projectId": "project_456",
  "bpmnXml": "<bpmn:definitions>...</bpmn:definitions>",
  "metadata": {
    "description": "Process description"
  }
}
```

**Response:**
```json
{
  "id": "diagram_789",
  "title": "New Process",
  "projectId": "project_456",
  "version": 1,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Status Codes:**
- `201` - Created
- `400` - Validation error
- `401` - Unauthorized

---

#### **GET /api/diagrams/:id**
Get a specific diagram.

**Response:**
```json
{
  "id": "diagram_123",
  "title": "Process Flow",
  "bpmnXml": "<bpmn:definitions>...</bpmn:definitions>",
  "projectId": "project_456",
  "version": 3,
  "metadata": {},
  "project": {
    "id": "project_456",
    "name": "My Project"
  },
  "versions": [
    {
      "revNumber": 3,
      "createdAt": "2024-01-01T00:00:00Z",
      "authorId": "user_123"
    }
  ]
}
```

---

#### **PUT /api/diagrams/:id**
Update a diagram.

**Request Body:**
```json
{
  "title": "Updated Title",
  "bpmnXml": "<bpmn:definitions>...</bpmn:definitions>",
  "metadata": {}
}
```

**Response:**
```json
{
  "id": "diagram_123",
  "title": "Updated Title",
  "version": 4,
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

#### **DELETE /api/diagrams/:id**
Soft delete a diagram.

**Response:**
```json
{
  "success": true,
  "message": "Diagram deleted"
}
```

---

#### **GET /api/diagrams/:id/xml**
Get diagram BPMN XML content.

**Response:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions>
  ...
</bpmn:definitions>
```

---

#### **GET /api/diagrams/:id/summary**
Get AI-generated diagram summary.

**Response:**
```json
{
  "summary": "This process handles customer orders...",
  "elements": {
    "tasks": 5,
    "gateways": 2,
    "events": 3
  },
  "complexity": "medium"
}
```

---

### **Projects**

#### **GET /api/projects**
Get user's projects.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)

**Response:**
```json
{
  "data": [
    {
      "id": "project_456",
      "name": "My Project",
      "description": "Project description",
      "diagrams": [
        {
          "id": "diagram_123",
          "title": "Process 1"
        }
      ],
      "_count": {
        "diagrams": 3
      }
    }
  ]
}
```

---

#### **POST /api/projects**
Create a new project.

**Request Body:**
```json
{
  "name": "New Project",
  "description": "Description",
  "metadata": {}
}
```

---

#### **PUT /api/projects/:id**
Update a project.

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

---

#### **DELETE /api/projects/:id**
Soft delete a project.

---

### **Authentication**

#### **POST /api/auth/signin**
Sign in with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_at": 1234567890
  }
}
```

---

#### **POST /api/auth/signup**
Create a new account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

---

#### **POST /api/auth/signout**
Sign out current user.

---

#### **GET /api/auth/session**
Get current session.

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "role": "user"
  }
}
```

---

### **Webhooks**

#### **POST /api/webhooks/stripe**
Stripe webhook endpoint.

**Headers:**
```http
Stripe-Signature: stripe_signature
```

**Handled Events:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

---

## **Error Responses**

All errors follow this format:

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": {} // Optional additional details
}
```

### **Common Error Codes**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Validation Error | Invalid request data |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## **Rate Limiting**

API requests are limited to:
- **60 requests per minute** for authenticated users
- **20 requests per minute** for unauthenticated requests

Rate limit headers:
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 2024-01-01T00:00:00Z
```

---

## **Pagination**

Paginated endpoints accept:
- `page` - Page number (starts at 1)
- `limit` - Items per page (max 50)

Response includes:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "hasMore": true,
    "total": 100 // When available
  }
}
```

---

## **Filtering & Sorting**

### **Filtering**
Use query parameters:
```
GET /api/diagrams?projectId=123&isPublic=true
```

### **Sorting**
Use `sort` parameter:
```
GET /api/diagrams?sort=updatedAt:desc
```

---

## **Webhooks**

Configure webhooks to receive real-time updates:

```json
{
  "url": "https://your-domain.com/webhook",
  "events": ["diagram.created", "diagram.updated"],
  "secret": "webhook_secret"
}
```

---

## **SDK Examples**

### **JavaScript/TypeScript**
```typescript
const response = await fetch('https://api.bpmn-studio.com/api/diagrams', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})

const { data, pagination } = await response.json()
```

### **cURL**
```bash
curl -X GET https://api.bpmn-studio.com/api/diagrams \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### **Python**
```python
import requests

response = requests.get(
  'https://api.bpmn-studio.com/api/diagrams',
  headers={
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
  }
)

data = response.json()
```

---

## **Changelog**

### **v2.0.0** (Current)
- Added diagram versioning
- Improved error responses
- Added rate limiting
- Enhanced security with CSRF tokens

### **v1.0.0**
- Initial API release
- Basic CRUD operations
- Authentication via JWT