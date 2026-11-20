
const API_BASE_URL = "http://127.0.0.1:8000";

// Common API request handler
async function apiRequest(endpoint, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  } catch (error) {
    throw new Error(
      "Unable to connect to NagrikAI backend. Please check whether the server is running."
    );
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    let message = errorData.detail || `API request failed: ${response.status}`;

    if (Array.isArray(message)) {
      message = message
        .map((item) => item.msg || JSON.stringify(item))
        .join(", ");
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// ---------------- APPLICATION APIs ----------------

export function getApplications() {
  return apiRequest("/applications");
}

export function getApplicationById(id) {
  return apiRequest(`/applications/${id}`);
}

export function createApplication(applicationData) {
  return apiRequest("/applications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(applicationData),
  });
}

export function updateApplication(id, applicationData) {
  return apiRequest(`/applications/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(applicationData),
  });
}

export function deleteApplication(id) {
  return apiRequest(`/applications/${id}`, {
    method: "DELETE",
  });
}

// ---------------- DOCUMENT APIs ----------------

export function getDocuments() {
  return apiRequest("/documents");
}

export function getDocumentById(id) {
  return apiRequest(`/documents/${id}`);
}

export function uploadDocument(file) {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest("/upload", {
    method: "POST",
    body: formData,
  });
}

export function updateDocument(id, documentData) {
  return apiRequest(`/documents/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(documentData),
  });
}

export function deleteDocument(id) {
  return apiRequest(`/documents/${id}`, {
    method: "DELETE",
  });
}

// ---------------- PASSPORT CHECKLIST API ----------------

export function getPassportChecklist(checklistData) {
  return apiRequest("/passport/checklist", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(checklistData),
  });
}
