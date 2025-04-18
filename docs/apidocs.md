# 📘 Evaluation Tool API Documentation

## Endpoint: `POST /evaluate-exam`

Evaluate the provided PDF using the TeacherService.

---

### 🔗 URL


---

### 🔐 Authentication

No authentication required.

---

### 📤 Request Body (JSON)

| Field     | Type   | Required | Description                      |
|-----------|--------|----------|----------------------------------|
| `pdf_url` | string | ✅ Yes    | Public URL of the uploaded PDF file |

#### Example

```json
{
  "pdf_url": "https://res.cloudinary.com/.../your-pdf.pdf"
}
