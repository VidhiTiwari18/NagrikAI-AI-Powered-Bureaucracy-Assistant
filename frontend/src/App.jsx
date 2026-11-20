
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Bot,
  ClipboardCheck,
  Settings,
  Search,
  Bell,
  ChevronDown,
  ArrowUpRight,
  Plus,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Upload,
  Menu,
  Landmark,
  Sparkles,
  ArrowRight,
  CircleHelp,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Save,
} from "lucide-react";

import {
  getApplications,
  getDocuments,
  createApplication,
  updateApplication,
  deleteApplication,
} from "./services/api";

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "My Applications", icon: FileText },
  { label: "Documents", icon: FolderOpen },
  { label: "AI Assistant", icon: Bot },
  { label: "Document Checklist", icon: ClipboardCheck },
];

const APPLICATION_STATUSES = [
  "draft",
  "submitted",
  "pending",
  "in_progress",
  "completed",
  "approved",
  "rejected",
];

const emptyForm = {
  applicant_name: "",
  date_of_birth: "",
  service_type: "fresh",
  processing_type: "normal",
  citizenship_basis: "birth",
};

function formatDate(dateString) {
  if (!dateString) return "Date unavailable";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getApplicationTitle(serviceType) {
  if (serviceType === "fresh") return "Fresh Passport Application";
  if (serviceType === "reissue") return "Passport Reissue";

  return serviceType
    ? serviceType.charAt(0).toUpperCase() + serviceType.slice(1)
    : "Government Service Application";
}

function getStatusLabel(status) {
  const labels = {
    draft: "Draft",
    submitted: "Submitted",
    pending: "Pending",
    in_progress: "In progress",
    completed: "Completed",
    approved: "Approved",
    rejected: "Rejected",
  };

  return labels[status?.toLowerCase()] || status || "Unknown";
}

function getStatusClasses(status) {
  const value = status?.toLowerCase();

  if (["completed", "approved"].includes(value)) {
    return "bg-[#E6EFE6] text-[#39735B]";
  }

  if (value === "rejected") {
    return "bg-red-50 text-red-700";
  }

  if (["submitted", "pending", "in_progress"].includes(value)) {
    return "bg-[#F4EBD8] text-[#96783F]";
  }

  return "bg-[#EAF0E9] text-[#39735B]";
}

function getMaximumDateOfBirth() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  return date.toISOString().split("T")[0];
}

function App() {
  const [activePage, setActivePage] = useState("Overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [applications, setApplications] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError("");

      const [applicationData, documentData] = await Promise.all([
        getApplications(),
        getDocuments(),
      ]);

      setApplications(
        Array.isArray(applicationData) ? applicationData : []
      );

      setDocuments(
        Array.isArray(documentData) ? documentData : []
      );
    } catch (err) {
      console.error("Dashboard loading error:", err);
      setError(err.message || "Unable to load dashboard information.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  function showSuccess(message) {
    setSuccess(message);
    setError("");
  }

  function changePage(page) {
    setActivePage(page);
    setMobileMenuOpen(false);
    setError("");
    setSuccess("");
  }

  function openCreateModal() {
    setEditingApplication(null);
    setFormData(emptyForm);
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(application) {
    setEditingApplication(application);
    setFormData({
      applicant_name: application.applicant_name || "",
      date_of_birth: application.date_of_birth || "",
      service_type: application.service_type || "fresh",
      processing_type: application.processing_type || "normal",
      citizenship_basis: application.citizenship_basis || "birth",
    });
    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingApplication(null);
    setFormData(emptyForm);
    setFormError("");
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleApplicationSubmit(event) {
    event.preventDefault();
    setFormError("");

    const applicantName = formData.applicant_name.trim();

    if (applicantName.length < 2) {
      setFormError("Applicant name must contain at least 2 characters.");
      return;
    }

    if (!formData.date_of_birth) {
      setFormError("Please enter the date of birth.");
      return;
    }

    const dob = new Date(`${formData.date_of_birth}T00:00:00`);
    const today = new Date();
    const minimumDate = new Date(
      `${getMaximumDateOfBirth()}T00:00:00`
    );

    if (
      Number.isNaN(dob.getTime()) ||
      dob >= today ||
      dob > minimumDate
    ) {
      setFormError("Applicant must be at least 18 years old.");
      return;
    }

    const payload = {
      applicant_name: applicantName,
      date_of_birth: formData.date_of_birth,
      service_type: formData.service_type,
      processing_type: formData.processing_type,
      citizenship_basis: formData.citizenship_basis,
    };

    try {
      setSaving(true);

      if (editingApplication) {
        await updateApplication(editingApplication.id, payload);
        showSuccess("Application updated successfully.");
      } else {
        await createApplication(payload);
        showSuccess("New application created successfully.");
      }

      setModalOpen(false);
      setEditingApplication(null);
      setFormData(emptyForm);

      await loadDashboardData();
    } catch (err) {
      console.error("Application save error:", err);
      setFormError(err.message || "Unable to save application.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(application, newStatus) {
    if (!newStatus || newStatus === application.application_status) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await updateApplication(application.id, {
        application_status: newStatus,
      });

      showSuccess(
        `Application #${application.id} status updated successfully.`
      );

      await loadDashboardData();
    } catch (err) {
      console.error("Status update error:", err);
      setError(err.message || "Unable to update application status.");
    }
  }

  async function handleDeleteApplication(application) {
    const confirmed = window.confirm(
      `Are you sure you want to delete application #${application.id} belonging to ${application.applicant_name}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await deleteApplication(application.id);

      showSuccess(
        `Application #${application.id} deleted successfully.`
      );

      await loadDashboardData();
    } catch (err) {
      console.error("Application deletion error:", err);
      setError(err.message || "Unable to delete application.");
    }
  }

  const totalApplications = applications.length;

  const completedApplications = applications.filter((item) =>
    ["completed", "approved"].includes(
      item.application_status?.toLowerCase()
    )
  ).length;

  const inProgressApplications = applications.filter((item) =>
    ["submitted", "pending", "in_progress"].includes(
      item.application_status?.toLowerCase()
    )
  ).length;

  const stats = [
    {
      label: "Total applications",
      value: totalApplications,
      icon: FileText,
      note: "Across all services",
    },
    {
      label: "In progress",
      value: inProgressApplications,
      icon: Clock3,
      note: "Currently active",
    },
    {
      label: "Completed",
      value: completedApplications,
      icon: CheckCircle2,
      note: "Successfully finished",
    },
    {
      label: "Documents stored",
      value: documents.length,
      icon: FolderOpen,
      note: "In your document vault",
    },
  ];

  const filteredApplications = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return applications.filter((item) => {
      const matchesSearch =
        !term ||
        String(item.id).includes(term) ||
        (item.applicant_name || "").toLowerCase().includes(term) ||
        getApplicationTitle(item.service_type)
          .toLowerCase()
          .includes(term);

      const status =
        item.application_status?.toLowerCase() || "unknown";

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "in_progress" &&
          ["submitted", "pending", "in_progress"].includes(status)) ||
        (statusFilter === "completed" &&
          ["completed", "approved"].includes(status)) ||
        (statusFilter === "draft" && status === "draft") ||
        (statusFilter === "rejected" && status === "rejected");

      return matchesSearch && matchesStatus;
    });
  }, [applications, searchTerm, statusFilter]);

  return (
    <div className="min-h-screen bg-[#F8F5EC] text-[#183D32]">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[#E7E3D8] bg-[#FFFCF5] px-5 py-6 transition-transform lg:static lg:translate-x-0 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-12 flex items-center gap-3 px-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#183D32] text-[#F8F5EC]">
              <Landmark size={23} />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight">
                NagrikAI
              </h1>
              <p className="text-[10px] font-semibold tracking-[0.18em] text-[#819083]">
                CITIZEN SERVICES
              </p>
            </div>
          </div>

          <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#A0A99E]">
            Workspace
          </p>

          <nav className="flex-1 space-y-1">
            {navigation.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => changePage(label)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                  activePage === label
                    ? "bg-[#EAF0E9] text-[#183D32]"
                    : "text-[#788579] hover:bg-[#F4F2EA] hover:text-[#183D32]"
                }`}
              >
                <Icon size={18} />
                {label}

                {label === "AI Assistant" && (
                  <span className="ml-auto rounded-full bg-[#D6C29B] px-2 py-0.5 text-[9px] font-bold text-[#493E2D]">
                    AI
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="rounded-2xl bg-[#183D32] p-4 text-[#FFFCF5]">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={17} className="text-[#D6C29B]" />
              <span className="text-sm font-semibold">
                Need assistance?
              </span>
            </div>

            <p className="mb-4 text-xs leading-5 text-[#D4E0D5]">
              Let NagrikAI guide you through your government paperwork.
            </p>

            <button
              onClick={() => changePage("AI Assistant")}
              className="flex w-full items-center justify-between rounded-lg bg-[#F8F5EC] px-3 py-2.5 text-xs font-semibold text-[#183D32] hover:bg-white"
            >
              Ask AI Assistant <ArrowRight size={15} />
            </button>
          </div>

          <button
            onClick={() => changePage("Settings")}
            className="mt-5 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#788579] hover:bg-[#F4F2EA]"
          >
            <Settings size={18} /> Settings
          </button>
        </aside>

        {/* Main area */}
        <main className="min-w-0 flex-1">
          {/* Header */}
          <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#E7E3D8] bg-[#FFFCF5]/95 px-5 backdrop-blur md:px-9">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="rounded-lg p-2 hover:bg-[#F0EEE5] lg:hidden"
                aria-label="Toggle navigation"
              >
                <Menu size={21} />
              </button>

              <div>
                <p className="text-xs text-[#8A968A]">
                  Workspace / {activePage}
                </p>
                <h2 className="text-sm font-semibold">{activePage}</h2>
              </div>
            </div>

            <div className="flex items-center gap-3 md:gap-5">
              <div className="hidden items-center gap-2 rounded-xl border border-[#E7E3D8] bg-white px-3 py-2 text-xs text-[#879286] sm:flex">
                <Search size={15} /> NagrikAI workspace
              </div>

              <button
                className="relative rounded-xl p-2 text-[#607466] hover:bg-[#F0EEE5]"
                aria-label="Notifications"
              >
                <Bell size={19} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full border border-white bg-[#B76D57]" />
              </button>

              <div className="flex items-center gap-2 border-l border-[#E7E3D8] pl-3 md:pl-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DDE7D9] text-sm font-bold text-[#315A42]">
                  V
                </div>

                <div className="hidden sm:block">
                  <p className="text-xs font-semibold">Welcome back</p>
                  <p className="text-[10px] text-[#8A968A]">
                    Citizen account
                  </p>
                </div>

                <ChevronDown
                  size={15}
                  className="hidden text-[#879286] sm:block"
                />
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1450px] px-5 py-8 md:px-9 md:py-10">
            {/* Notifications */}
            {error && (
              <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <span>{error}</span>
                <button
                  onClick={loadDashboardData}
                  className="inline-flex shrink-0 items-center gap-2 font-semibold"
                >
                  <RefreshCw size={15} /> Retry
                </button>
              </div>
            )}

            {success && (
              <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={17} />
                  {success}
                </span>
                <button
                  onClick={() => setSuccess("")}
                  aria-label="Dismiss success message"
                >
                  <X size={17} />
                </button>
              </div>
            )}

            {/* MY APPLICATIONS PAGE */}
            {activePage === "My Applications" ? (
              <section>
                <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.17em] text-[#849283]">
                      APPLICATION WORKSPACE
                    </p>

                    <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                      My Applications
                      <span className="text-[#B69A6A]">.</span>
                    </h1>

                    <p className="mt-2 text-sm text-[#849083]">
                      View and manage applications saved in your NagrikAI account.
                    </p>
                  </div>

                  <button
                    onClick={openCreateModal}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#183D32] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#285643]"
                  >
                    <Plus size={17} /> New application
                  </button>
                </div>

                {/* Application statistics */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {[
                    {
                      label: "All applications",
                      value: totalApplications,
                    },
                    {
                      label: "In progress",
                      value: inProgressApplications,
                    },
                    {
                      label: "Completed",
                      value: completedApplications,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-[#E9E5DA] bg-[#FFFCF5] p-5"
                    >
                      <p className="text-xs text-[#899387]">
                        {item.label}
                      </p>
                      <p className="mt-2 text-3xl font-semibold">
                        {loading
                          ? "—"
                          : String(item.value).padStart(2, "0")}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Application records */}
                <div className="rounded-2xl border border-[#E9E5DA] bg-[#FFFCF5] p-5 md:p-6">
                  <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="font-semibold">
                        Application records
                      </h3>
                      <p className="mt-1 text-xs text-[#929B90]">
                        Live information retrieved from the backend database
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <div className="flex items-center gap-2 rounded-xl border border-[#E7E3D8] bg-white px-3 py-2">
                        <Search size={16} className="text-[#899387]" />
                        <input
                          value={searchTerm}
                          onChange={(event) =>
                            setSearchTerm(event.target.value)
                          }
                          placeholder="Search applications..."
                          className="w-full bg-transparent text-sm outline-none sm:w-52"
                        />
                      </div>

                      <select
                        value={statusFilter}
                        onChange={(event) =>
                          setStatusFilter(event.target.value)
                        }
                        className="rounded-xl border border-[#E7E3D8] bg-white px-3 py-2 text-sm text-[#52675A] outline-none"
                      >
                        <option value="all">All statuses</option>
                        <option value="draft">Draft</option>
                        <option value="in_progress">In progress</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                      </select>

                      <button
                        onClick={loadDashboardData}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 rounded-xl border border-[#E7E3D8] bg-white px-3 py-2 text-sm hover:bg-[#F4F2EA] disabled:opacity-50"
                      >
                        <RefreshCw
                          size={15}
                          className={loading ? "animate-spin" : ""}
                        />
                        Refresh
                      </button>
                    </div>
                  </div>

                  {loading ? (
                    <p className="py-12 text-center text-sm text-[#929B90]">
                      Loading your applications...
                    </p>
                  ) : filteredApplications.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#D9DED4] px-5 py-12 text-center">
                      <FileText
                        size={34}
                        className="mx-auto mb-3 text-[#9AA496]"
                      />
                      <p className="text-sm font-semibold">
                        No matching applications
                      </p>
                      <p className="mt-1 text-xs text-[#929B90]">
                        Try changing your search or status filter.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredApplications.map((item) => (
                        <article
                          key={item.id}
                          className="rounded-xl border border-[#EEEAE0] p-4 transition hover:border-[#B8C9B8] hover:bg-[#FEFDF8]"
                        >
                          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                            <div className="flex items-start gap-3">
                              <div className="rounded-xl bg-[#EAF0E9] p-3 text-[#39735B]">
                                <FileText size={20} />
                              </div>

                              <div>
                                <h4 className="text-sm font-semibold">
                                  {getApplicationTitle(item.service_type)}
                                </h4>

                                <p className="mt-1 text-xs text-[#849083]">
                                  Applicant: {item.applicant_name || "Name unavailable"}
                                </p>

                                <p className="mt-1 text-[11px] text-[#929B90]">
                                  Application #{item.id} · Created{" "}
                                  {formatDate(item.created_at)}
                                </p>

                                <p className="mt-1 text-[11px] text-[#929B90]">
                                  Date of birth: {formatDate(item.date_of_birth)}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                              <div className="min-w-32">
                                <label
                                  htmlFor={`status-${item.id}`}
                                  className="mb-1 block text-[10px] text-[#929B90]"
                                >
                                  Application status
                                </label>

                                <select
                                  id={`status-${item.id}`}
                                  value={item.application_status || "draft"}
                                  onChange={(event) =>
                                    handleStatusChange(item, event.target.value)
                                  }
                                  className={`w-full rounded-lg border border-[#E7E3D8] px-3 py-2 text-xs font-semibold outline-none ${getStatusClasses(item.application_status)}`}
                                >
                                  {APPLICATION_STATUSES.map((status) => (
                                    <option key={status} value={status}>
                                      {getStatusLabel(status)}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <button
                                onClick={() => openEditModal(item)}
                                className="inline-flex items-center gap-2 rounded-lg border border-[#DDE5D9] px-3 py-2 text-xs font-semibold text-[#39735B] transition hover:bg-[#EAF0E9]"
                                title="Edit application"
                              >
                                <Pencil size={14} /> Edit
                              </button>

                              <button
                                onClick={() => handleDeleteApplication(item)}
                                className="inline-flex items-center gap-2 rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                title="Delete application"
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            ) : activePage === "Overview" ? (
              /* OVERVIEW DASHBOARD */
              <>
                <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.17em] text-[#849283]">
                      NAGRIKAI DASHBOARD
                    </p>

                    <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                      Good evening
                      <span className="text-[#B69A6A]">.</span>
                    </h1>

                    <p className="mt-2 text-sm text-[#849083]">
                      Your government services, organised in one place.
                    </p>
                  </div>

                  <button
                    onClick={() => changePage("My Applications")}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#183D32] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#285643]"
                  >
                    <Plus size={17} /> View applications
                  </button>
                </div>

                {/* Welcome banner */}
                <section className="relative mb-8 overflow-hidden rounded-2xl bg-[#183D32] p-6 text-white md:p-8">
                  <div className="relative z-10 max-w-xl">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-semibold tracking-wider text-[#E1D5B7]">
                      <Sparkles size={13} /> YOUR AI-POWERED CITIZEN COMPANION
                    </div>

                    <h2 className="text-2xl font-semibold leading-snug md:text-3xl">
                      Government paperwork,
                      <br />
                      made simpler.
                    </h2>

                    <p className="mt-3 max-w-md text-sm leading-6 text-[#D0DDD2]">
                      Understand requirements, organise documents and navigate
                      government services with intelligent assistance.
                    </p>

                    <button
                      onClick={() => changePage("AI Assistant")}
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#F4EBD8] px-4 py-3 text-xs font-bold text-[#183D32] transition hover:bg-white"
                    >
                      Explore AI assistance <ArrowUpRight size={15} />
                    </button>
                  </div>

                  <div className="pointer-events-none absolute -right-10 -top-24 h-80 w-80 rounded-full border border-white/10" />
                  <div className="pointer-events-none absolute -right-2 -top-16 h-64 w-64 rounded-full border border-white/10" />
                  <div className="pointer-events-none absolute -bottom-32 right-36 h-64 w-64 rounded-full bg-[#39735B]/40 blur-2xl" />

                  <Landmark className="absolute bottom-7 right-10 hidden h-36 w-36 text-[#F4EBD8]/10 md:block" />
                </section>

                {/* Statistics */}
                <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {stats.map(({ label, value, icon: Icon, note }) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-[#E9E5DA] bg-[#FFFCF5] p-5"
                    >
                      <div className="mb-5 flex items-center justify-between">
                        <span className="text-xs font-medium text-[#899387]">
                          {label}
                        </span>

                        <div className="rounded-xl bg-[#EAF0E9] p-2 text-[#39735B]">
                          <Icon size={17} />
                        </div>
                      </div>

                      <p className="text-3xl font-semibold">
                        {loading ? "—" : String(value).padStart(2, "0")}
                      </p>

                      <p className="mt-1 text-[11px] text-[#929B90]">
                        {note}
                      </p>
                    </div>
                  ))}
                </section>

                {/* Recent applications and quick actions */}
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.65fr_1fr]">
                  <section className="rounded-2xl border border-[#E9E5DA] bg-[#FFFCF5] p-5 md:p-6">
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">
                          Recent applications
                        </h3>
                        <p className="mt-1 text-xs text-[#929B90]">
                          Live records from your NagrikAI database
                        </p>
                      </div>

                      <button
                        onClick={() => changePage("My Applications")}
                        className="flex items-center gap-1 text-xs font-semibold text-[#39735B]"
                      >
                        View all <ArrowUpRight size={14} />
                      </button>
                    </div>

                    {loading ? (
                      <p className="py-8 text-center text-sm text-[#929B90]">
                        Fetching applications...
                      </p>
                    ) : applications.length === 0 ? (
                      <p className="py-8 text-center text-sm text-[#929B90]">
                        No applications yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {applications.slice(0, 5).map((item) => (
                          <div
                            key={item.id}
                            className="rounded-xl border border-[#EEEAE0] p-4"
                          >
                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                              <div>
                                <h4 className="text-sm font-semibold">
                                  {getApplicationTitle(item.service_type)}
                                </h4>

                                <p className="mt-1 text-[11px] text-[#939B91]">
                                  {item.applicant_name} ·{" "}
                                  {formatDate(item.created_at)}
                                </p>
                              </div>

                              <span
                                className={`w-fit rounded-full px-3 py-1 text-[10px] font-semibold ${getStatusClasses(
                                  item.application_status
                                )}`}
                              >
                                {getStatusLabel(item.application_status)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="space-y-5">
                    <div className="rounded-2xl border border-[#E9E5DA] bg-[#FFFCF5] p-5 md:p-6">
                      <h3 className="font-semibold">Quick actions</h3>

                      <p className="mt-1 text-xs text-[#929B90]">
                        What would you like to do today?
                      </p>

                      <div className="mt-5 space-y-2">
                        {[
                          {
                            title: "Upload a document",
                            subtitle: "Extract information using AI",
                            icon: Upload,
                            page: "Documents",
                          },
                          {
                            title: "Check document requirements",
                            subtitle: "Find what you need to apply",
                            icon: ClipboardCheck,
                            page: "Document Checklist",
                          },
                          {
                            title: "Ask AI Assistant",
                            subtitle: "Get help with your paperwork",
                            icon: Bot,
                            page: "AI Assistant",
                          },
                        ].map(({ title, subtitle, icon: Icon, page }) => (
                          <button
                            key={title}
                            onClick={() => changePage(page)}
                            className="flex w-full items-center gap-3 rounded-xl border border-[#EEEAE0] p-3 text-left transition hover:border-[#B8C9B8] hover:bg-[#F6F6EF]"
                          >
                            <div className="rounded-lg bg-[#EAF0E9] p-2 text-[#39735B]">
                              <Icon size={17} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold">
                                {title}
                              </p>

                              <p className="mt-1 text-[10px] text-[#929B90]">
                                {subtitle}
                              </p>
                            </div>

                            <ArrowRight
                              size={15}
                              className="text-[#9AA496]"
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#E8DEC9] bg-[#F4EBD8] p-5">
                      <div className="mb-3 flex items-center gap-2 text-[#816A42]">
                        <AlertCircle size={17} />
                        <span className="text-xs font-semibold">
                          A helpful reminder
                        </span>
                      </div>

                      <p className="text-sm font-medium leading-6 text-[#574B38]">
                        Keep your documents up to date before starting a new
                        application.
                      </p>

                      <button
                        onClick={() => changePage("Documents")}
                        className="mt-3 flex items-center gap-1 text-xs font-bold text-[#39735B]"
                      >
                        Open document vault <ArrowRight size={14} />
                      </button>
                    </div>
                  </section>
                </div>
              </>
            ) : (
              /* Other workspace sections */
              <section className="rounded-2xl border border-[#E9E5DA] bg-[#FFFCF5] p-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF0E9] text-[#39735B]">
                  {activePage === "Documents" ? (
                    <FolderOpen />
                  ) : activePage === "AI Assistant" ? (
                    <Bot />
                  ) : activePage === "Document Checklist" ? (
                    <ClipboardCheck />
                  ) : (
                    <Settings />
                  )}
                </div>

                <h1 className="text-2xl font-semibold">{activePage}</h1>

                <p className="mt-2 max-w-xl text-sm leading-6 text-[#849083]">
                  This section is the next part of the NagrikAI workspace.
                  Your My Applications page is now connected to the live
                  application management APIs.
                </p>

                {activePage === "Documents" && (
                  <p className="mt-4 text-sm font-medium text-[#39735B]">
                    {loading
                      ? "Loading documents..."
                      : `${documents.length} document record(s) found in your database.`}
                  </p>
                )}

                <button
                  onClick={() => changePage("Overview")}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#183D32] px-4 py-3 text-sm font-semibold text-white"
                >
                  Back to overview <ArrowRight size={16} />
                </button>
              </section>
            )}

            {/* Footer */}
            <footer className="mt-9 flex flex-col justify-between gap-2 border-t border-[#E7E3D8] pt-5 text-[10px] text-[#929B90] sm:flex-row">
              <p>© 2026 NagrikAI. Your citizen services companion.</p>

              <p className="flex items-center gap-1">
                <CircleHelp size={12} />
                AI-generated guidance is subject to official verification.
              </p>
            </footer>
          </div>
        </main>
      </div>

      {/* CREATE / EDIT APPLICATION MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-auto w-full max-w-xl rounded-2xl border border-[#E9E5DA] bg-[#FFFCF5] p-6 shadow-2xl md:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#849283]">
                  APPLICATION WORKSPACE
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  {editingApplication
                    ? "Edit application"
                    : "Create application"}
                </h2>

                <p className="mt-1 text-xs text-[#929B90]">
                  Enter the applicant information below.
                </p>
              </div>

              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-[#849083] transition hover:bg-[#F0EEE5] disabled:opacity-50"
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleApplicationSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="applicant_name"
                  className="mb-2 block text-xs font-semibold text-[#52675A]"
                >
                  Applicant full name
                </label>

                <input
                  id="applicant_name"
                  name="applicant_name"
                  type="text"
                  minLength={2}
                  maxLength={120}
                  required
                  value={formData.applicant_name}
                  onChange={handleFormChange}
                  placeholder="Enter applicant's full name"
                  className="w-full rounded-xl border border-[#E7E3D8] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#39735B]"
                />
              </div>

              <div>
                <label
                  htmlFor="date_of_birth"
                  className="mb-2 block text-xs font-semibold text-[#52675A]"
                >
                  Date of birth
                </label>

                <input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  required
                  max={getMaximumDateOfBirth()}
                  value={formData.date_of_birth}
                  onChange={handleFormChange}
                  className="w-full rounded-xl border border-[#E7E3D8] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#39735B]"
                />

                <p className="mt-1 text-[10px] text-[#929B90]">
                  Applicant must be at least 18 years old.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="service_type"
                    className="mb-2 block text-xs font-semibold text-[#52675A]"
                  >
                    Service type
                  </label>

                  <select
                    id="service_type"
                    name="service_type"
                    value={formData.service_type}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-[#E7E3D8] bg-white px-4 py-3 text-sm outline-none focus:border-[#39735B]"
                  >
                    <option value="fresh">Fresh passport</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="processing_type"
                    className="mb-2 block text-xs font-semibold text-[#52675A]"
                  >
                    Processing type
                  </label>

                  <select
                    id="processing_type"
                    name="processing_type"
                    value={formData.processing_type}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-[#E7E3D8] bg-white px-4 py-3 text-sm outline-none focus:border-[#39735B]"
                  >
                    <option value="normal">Normal</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="citizenship_basis"
                  className="mb-2 block text-xs font-semibold text-[#52675A]"
                >
                  Citizenship basis
                </label>

                <select
                  id="citizenship_basis"
                  name="citizenship_basis"
                  value={formData.citizenship_basis}
                  onChange={handleFormChange}
                  className="w-full rounded-xl border border-[#E7E3D8] bg-white px-4 py-3 text-sm outline-none focus:border-[#39735B]"
                >
                  <option value="birth">By birth</option>
                </select>
              </div>

              {editingApplication && (
                <div className="rounded-xl bg-[#F0F2E9] p-4">
                  <p className="text-xs font-semibold text-[#52675A]">
                    Application ID: {editingApplication.id}
                  </p>
                  <p className="mt-1 text-xs text-[#849083]">
                    Current status:{" "}
                    {getStatusLabel(editingApplication.application_status)}
                  </p>
                  <p className="mt-1 text-[10px] text-[#929B90]">
                    Use the status selector on the application card to update its status.
                  </p>
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-[#E7E3D8] px-5 py-3 text-sm font-semibold text-[#607466] transition hover:bg-[#F4F2EA] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#183D32] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#285643] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {editingApplication
                        ? "Save changes"
                        : "Create application"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
