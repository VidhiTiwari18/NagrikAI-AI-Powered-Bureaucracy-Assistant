
const API_BASE_URL = "http://127.0.0.1:8000";

// Common API request handler
async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.detail || `API request failed: ${response.status}`
    );
  }

  return response.json();
}

// Get all applications
export function getApplications() {
  return apiRequest("/applications");
}

// Get one application
export function getApplicationById(id) {
  return apiRequest(`/applications/${id}`);
}

// Create a new application
export function createApplication(applicationData) {
  return apiRequest("/applications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(applicationData),
  });
}

// Get all documents
export function getDocuments() {
  return apiRequest("/documents");
}

// Get one document
export function getDocumentById(id) {
  return apiRequest(`/documents/${id}`);
}

// Upload a document
export function uploadDocument(file) {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest("/upload", {
    method: "POST",
    body: formData,
  });
}

// Update a document
export function updateDocument(id, documentData) {
  return apiRequest(`/documents/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(documentData),
  });
}

// Delete a document
export function deleteDocument(id) {
  return apiRequest(`/documents/${id}`, {
    method: "DELETE",
  });
}

// Generate passport checklist
export function getPassportChecklist(checklistData) {
  return apiRequest("/passport/checklist", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(checklistData),
  });
}
