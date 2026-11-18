
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
} from "lucide-react";

import { getApplications, getDocuments } from "./services/api";

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "My Applications", icon: FileText },
  { label: "Documents", icon: FolderOpen },
  { label: "AI Assistant", icon: Bot },
  { label: "Document Checklist", icon: ClipboardCheck },
];

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

function App() {
  const [activePage, setActivePage] = useState("Overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [applications, setApplications] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  const changePage = (page) => {
    setActivePage(page);
    setMobileMenuOpen(false);
  };

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
                <h2 className="text-sm font-semibold">
                  {activePage}
                </h2>
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

            {error && (
              <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <span>Unable to load dashboard data: {error}</span>

                <button
                  onClick={loadDashboardData}
                  className="inline-flex shrink-0 items-center gap-2 font-semibold"
                >
                  <RefreshCw size={15} /> Retry
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
                      View and track applications saved in your NagrikAI account.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      alert("Application creation will be connected in the next step.")
                    }
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
                          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
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
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 sm:justify-end">
                              <div className="text-right">
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold ${getStatusClasses(
                                    item.application_status
                                  )}`}
                                >
                                  {getStatusLabel(item.application_status)}
                                </span>

                                <p className="mt-2 text-[10px] capitalize text-[#929B90]">
                                  {item.processing_type || "Processing not specified"}{" "}
                                  processing
                                </p>
                              </div>

                              <ArrowUpRight
                                size={17}
                                className="text-[#9AA496]"
                              />
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

                <h1 className="text-2xl font-semibold">
                  {activePage}
                </h1>

                <p className="mt-2 max-w-xl text-sm leading-6 text-[#849083]">
                  This section is the next part of the NagrikAI workspace.
                  The My Applications page is now connected to your live
                  application records.
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
    </div>
  );
}

export default App;
