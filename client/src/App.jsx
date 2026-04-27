import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "./api";

const navByRole = {
  Admin: ["dashboard", "employees", "audit-logs", "security-alerts", "my-profile"],
  "HR Manager": ["employees", "my-profile"],
  Employee: ["my-profile"],
};

const useAuth = () => {
  const [auth, setAuth] = useState(() => {
    const raw = localStorage.getItem("hrms_auth");
    return raw ? JSON.parse(raw) : { token: "", user: null };
  });
  useEffect(() => localStorage.setItem("hrms_auth", JSON.stringify(auth)), [auth]);
  return [auth, setAuth];
};

const fmtTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};
const fmtIp = (log) => {
  const ip = log?.ip || log?.metadata?.ip || "";
  if (!ip) return "unknown";
  return ip === "::1" ? "127.0.0.1" : ip;
};

const isCritical = (severity) => String(severity || "").toUpperCase() === "CRITICAL";
const isHighOrCritical = (severity) => ["HIGH", "CRITICAL", "WARNING", "critical", "warning"].includes(String(severity));

function LoginPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "", mfaCode: "123456" });
  const [signupForm, setSignupForm] = useState({ name: "", email: "", password: "", role: "Employee" });
  const [forgotForm, setForgotForm] = useState({ email: "", resetToken: "", newPassword: "", mfaCode: "123456" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const submitLogin = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const data = await apiRequest("/auth/login", { method: "POST", body: loginForm });
      onAuth({ token: data.token, user: data.user });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const submitSignup = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const data = await apiRequest("/auth/signup", { method: "POST", body: signupForm });
      onAuth({ token: data.token, user: data.user });
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const submitForgot = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const data = await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: { email: forgotForm.email },
      });
      setInfo(`${data.message}${data.resetToken ? ` Reset token: ${data.resetToken}` : ""}`);
      if (data.resetToken) {
        setForgotForm((prev) => ({ ...prev, resetToken: data.resetToken }));
      }
      setMode("reset");
    } catch (err) {
      setError(err.message || "Failed to process forgot password");
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const data = await apiRequest("/auth/reset-password", {
        method: "POST",
        body: {
          resetToken: forgotForm.resetToken,
          newPassword: forgotForm.newPassword,
          mfaCode: forgotForm.mfaCode,
        },
      });
      setInfo(data.message || "Password reset successful. Please login.");
      setMode("login");
      setLoginForm((prev) => ({ ...prev, email: forgotForm.email }));
    } catch (err) {
      setError(err.message || "Reset password failed");
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : mode === "forgot" ? "Forgot password" : "Reset password";
  const subtitle =
    mode === "login"
      ? "Use your registered credentials."
      : mode === "signup"
        ? "Create account / signup to access the platform."
        : mode === "forgot"
          ? "Enter your registered email to generate a reset token."
          : "Use reset token and new password to restore access.";

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#f7f7f7]">
      <section className="hidden lg:flex bg-[#05070d] text-white p-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 hr-grid" />
        <div className="relative z-10 max-w-md">
          <p className="text-sm tracking-[0.35em] text-slate-400">HRMS / SECURE</p>
          <h1 className="mt-14 text-6xl font-bold leading-[0.95]">
            Cloud HR
            <br />
            Management.
            <br />
            <span className="text-[#ff3b3b]">Hardened.</span>
          </h1>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <form
          onSubmit={mode === "login" ? submitLogin : mode === "signup" ? submitSignup : mode === "forgot" ? submitForgot : submitReset}
          className="w-full max-w-xl border border-[#dbdbdb] bg-white p-8 shadow-sm"
        >
          <p className="text-[11px] tracking-[0.3em] text-slate-500 uppercase">Secure Login</p>
          <h2 className="mt-2 text-4xl font-bold">{title}</h2>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>

          {mode === "signup" ? (
            <>
              <label className="block mt-8 text-[10px] tracking-[0.24em] uppercase text-slate-500">Full name</label>
              <input
                className="mt-1 w-full border border-[#d6d6d6] px-3 py-2"
                value={signupForm.name}
                onChange={(e) => setSignupForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />

              <label className="block mt-4 text-[10px] tracking-[0.24em] uppercase text-slate-500">Email</label>
              <input
                className="mt-1 w-full border border-[#d6d6d6] px-3 py-2"
                value={signupForm.email}
                onChange={(e) => setSignupForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />

              <label className="block mt-4 text-[10px] tracking-[0.24em] uppercase text-slate-500">Password</label>
              <input
                type="password"
                minLength={8}
                className="mt-1 w-full border border-[#d6d6d6] px-3 py-2"
                value={signupForm.password}
                onChange={(e) => setSignupForm((prev) => ({ ...prev, password: e.target.value }))}
                required
              />

              <label className="block mt-4 text-[10px] tracking-[0.24em] uppercase text-slate-500">Role</label>
              <select
                className="mt-1 w-full border border-[#d6d6d6] px-3 py-2"
                value={signupForm.role}
                onChange={(e) => setSignupForm((prev) => ({ ...prev, role: e.target.value }))}
              >
                <option value="Employee">Employee</option>
                <option value="HR Manager">HR Manager</option>
                <option value="Admin">Admin</option>
              </select>

            </>
          ) : null}

          {mode === "login" ? (
            <>
              <label className="block mt-8 text-[10px] tracking-[0.24em] uppercase text-slate-500">Email</label>
              <input
                className="mt-1 w-full border border-[#d6d6d6] px-3 py-2"
                value={loginForm.email}
                onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />

              <label className="block mt-4 text-[10px] tracking-[0.24em] uppercase text-slate-500">Password</label>
              <input
                type="password"
                className="mt-1 w-full border border-[#d6d6d6] px-3 py-2"
                value={loginForm.password}
                onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
              <input type="hidden" value={loginForm.mfaCode} />
            </>
          ) : null}

          {mode === "forgot" ? (
            <>
              <label className="block mt-8 text-[10px] tracking-[0.24em] uppercase text-slate-500">Registered email</label>
              <input
                className="mt-1 w-full border border-[#d6d6d6] px-3 py-2"
                value={forgotForm.email}
                onChange={(e) => setForgotForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            </>
          ) : null}

          {mode === "reset" ? (
            <>
              <label className="block mt-8 text-[10px] tracking-[0.24em] uppercase text-slate-500">Reset token</label>
              <input
                className="mt-1 w-full border border-[#d6d6d6] px-3 py-2"
                value={forgotForm.resetToken}
                onChange={(e) => setForgotForm((prev) => ({ ...prev, resetToken: e.target.value }))}
                required
              />

              <label className="block mt-4 text-[10px] tracking-[0.24em] uppercase text-slate-500">New password</label>
              <input
                type="password"
                minLength={8}
                className="mt-1 w-full border border-[#d6d6d6] px-3 py-2"
                value={forgotForm.newPassword}
                onChange={(e) => setForgotForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                required
              />

              <label className="block mt-4 text-[10px] tracking-[0.24em] uppercase text-slate-500">MFA code</label>
              <input
                className="mt-1 w-full border border-[#d6d6d6] px-3 py-2"
                value={forgotForm.mfaCode}
                onChange={(e) => setForgotForm((prev) => ({ ...prev, mfaCode: e.target.value }))}
                required
              />
            </>
          ) : null}

          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          {info ? <p className="mt-3 text-sm text-emerald-700">{info}</p> : null}

          <button disabled={loading} className="mt-6 w-full bg-black text-white py-2.5 border border-black disabled:opacity-60">
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Login"
                : mode === "signup"
                  ? "Create account"
                  : mode === "forgot"
                    ? "Generate reset token"
                    : "Reset password"}
          </button>

          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            {mode !== "login" ? (
              <button type="button" className="underline text-slate-700" onClick={() => { setMode("login"); setError(""); setInfo(""); }}>
                Login
              </button>
            ) : null}
            {mode !== "signup" ? (
              <button type="button" className="underline text-slate-700" onClick={() => { setMode("signup"); setError(""); setInfo(""); }}>
                Create account / Signup
              </button>
            ) : null}
            {mode !== "forgot" ? (
              <button type="button" className="underline text-slate-700" onClick={() => { setMode("forgot"); setError(""); setInfo(""); }}>
                Forgot password
              </button>
            ) : null}
            {mode === "reset" ? (
              <button type="button" className="underline text-slate-700" onClick={() => { setMode("login"); setError(""); }}>
                Back to login
              </button>
            ) : null}
          </div>

          {mode === "reset" ? (
            <button type="button" className="mt-3 text-xs underline text-slate-700" onClick={() => setMode("forgot")}>
              Need another reset token?
            </button>
          ) : null}
        </form>
      </section>
    </div>
  );
}

function App() {
  const [auth, setAuth] = useAuth();
  const [view, setView] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [employees, setEmployees] = useState([]);
  const [logs, setLogs] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [profile, setProfile] = useState(null);
  const [filters, setFilters] = useState({ severity: "", action: "" });
  const [lastCriticalLog, setLastCriticalLog] = useState("");
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    role: "Employee",
    salary: 0,
  });
  const [editingEmployeeId, setEditingEmployeeId] = useState("");
  const [editingEmployee, setEditingEmployee] = useState({
    name: "",
    email: "",
    department: "",
    role: "Employee",
    salary: 0,
    status: "Active",
  });

  const menu = useMemo(() => navByRole[auth.user?.role] || ["my-profile"], [auth.user?.role]);

  const loadLogs = async (nextFilters = filters) => {
    if (auth.user?.role !== "Admin") return [];
    const params = new URLSearchParams();
    if (nextFilters.severity) params.set("severity", nextFilters.severity);
    if (nextFilters.action.trim()) params.set("action", nextFilters.action.trim());
    const endpoint = `/logs${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await apiRequest(endpoint, { token: auth.token }).catch(() => []);
    setLogs(response);
    return response;
  };

  const loadData = async () => {
    if (!auth.token || !auth.user) return;
    setLoading(true);
    setError("");
    try {
      if (["Admin", "HR Manager"].includes(auth.user.role)) {
        const employeesData = await apiRequest("/employees", { token: auth.token }).catch(() => []);
        setEmployees(employeesData);
      }

      const me = await apiRequest("/employees/me", { token: auth.token }).catch(() => null);
      setProfile(me);

      if (auth.user.role === "Admin") {
        const [dashboardData, logsData] = await Promise.all([
          apiRequest("/dashboard/admin", { token: auth.token }).catch(() => null),
          loadLogs(filters),
        ]);
        setDashboard(dashboardData);
        setLogs(logsData);
      }
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const refreshLogs = async () => {
    const next = await loadLogs(filters);
    const latestCritical = next.find((entry) => isCritical(entry.severity));
    if (latestCritical?._id && latestCritical._id !== lastCriticalLog) {
      setLastCriticalLog(latestCritical._id);
      alert(`CRITICAL ALERT\n${latestCritical.action}\n${latestCritical.message || "No detail provided"}`);
    }
  };

  const createEmployee = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await apiRequest("/employees", {
        method: "POST",
        token: auth.token,
        body: {
          ...newEmployee,
          salary: Number(newEmployee.salary || 0),
        },
      });
      setShowAddEmployee(false);
      setNewEmployee({
        name: "",
        email: "",
        password: "",
        department: "",
        role: "Employee",
        salary: 0,
      });
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to add employee");
    }
  };

  const startEditEmployee = (employee) => {
    setEditingEmployeeId(employee._id);
    setEditingEmployee({
      name: employee.name || "",
      email: employee.email || "",
      department: employee.department || "",
      role: employee.role || "Employee",
      salary: employee.salary || 0,
      status: employee.status || "Active",
    });
  };

  const cancelEditEmployee = () => {
    setEditingEmployeeId("");
    setEditingEmployee({
      name: "",
      email: "",
      department: "",
      role: "Employee",
      salary: 0,
      status: "Active",
    });
  };

  const saveEditEmployee = async (employeeId) => {
    setError("");
    try {
      await apiRequest(`/employees/${employeeId}`, {
        method: "PUT",
        token: auth.token,
        body: {
          name: editingEmployee.name,
          email: editingEmployee.email,
          department: editingEmployee.department,
          role: editingEmployee.role,
          salary: Number(editingEmployee.salary || 0),
          ...(auth.user.role === "Admin" ? { status: editingEmployee.status } : {}),
        },
      });
      cancelEditEmployee();
      await loadData();
      if (String(auth.user?.id) === String(employeeId)) {
        setAuth((prev) => ({ ...prev, user: { ...prev.user, ...editingEmployee } }));
      }
    } catch (err) {
      setError(err.message || "Failed to update employee");
    }
  };

  const updateMyProfile = async (payload) => {
    setError("");
    try {
      const updated = await apiRequest("/employees/me", {
        method: "PUT",
        token: auth.token,
        body: payload,
      });
      setProfile(updated);
      setAuth((prev) => ({
        ...prev,
        user: {
          ...prev.user,
          name: updated.name,
          address: updated.address,
        },
      }));
    } catch (err) {
      setError(err.message || "Failed to update profile");
    }
  };

  useEffect(() => {
    if (!auth.user) return;
    setView(auth.user.role === "Admin" ? "dashboard" : auth.user.role === "HR Manager" ? "employees" : "my-profile");
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.token, auth.user?.role]);

  useEffect(() => {
    if (!auth.token || auth.user?.role !== "Admin") return undefined;
    refreshLogs();
    const id = setInterval(refreshLogs, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.token, auth.user?.role, filters.severity, filters.action, lastCriticalLog]);

  if (!auth.token || !auth.user) {
    return <LoginPage onAuth={setAuth} />;
  }

  return (
    <div className="min-h-screen bg-[#ededed] p-4">
      <div className="mx-auto max-w-[1600px] bg-white border border-[#bababa] min-h-[92vh] flex">
        <aside className="w-[220px] border-r border-[#bcbcbc] flex flex-col">
          <div className="p-4 border-b border-[#bcbcbc]">
            <h1 className="text-sm font-bold">HRMS / SECURE</h1>
            <p className="text-[10px] tracking-[0.24em] uppercase text-slate-500 mt-1">Admin Console</p>
          </div>

          <nav className="p-3 space-y-1">
            {menu.map((item) => (
              <button
                key={item}
                onClick={() => setView(item)}
                className={`w-full text-left px-3 py-2 border text-sm capitalize ${view === item ? "bg-[#f3f3f3] border-[#b7b7b7]" : "border-transparent hover:border-[#d3d3d3]"}`}
              >
                {item.replace("-", " ")}
              </button>
            ))}
          </nav>

          <div className="mt-auto border-t border-[#bcbcbc] p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Signed in</p>
            <p className="text-xs mt-1">{auth.user.email}</p>
            <button
              onClick={() => setAuth({ token: "", user: null })}
              className="mt-3 w-full border border-[#bcbcbc] px-3 py-2 text-sm hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </aside>

        <main className="flex-1 p-6">
          <div className="flex items-center justify-between border-b border-[#bcbcbc] pb-2">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Console</p>
              <h2 className="text-xl font-bold">HR Management System</h2>
            </div>
            <span className="border border-[#95d395] text-[10px] tracking-[0.2em] px-2 py-1 text-[#348d34] uppercase">Session active</span>
          </div>

          {loading ? <p className="mt-4 text-sm text-slate-500">Loading...</p> : null}
          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

          <div className="mt-5">
            {view === "dashboard" && auth.user.role === "Admin" ? (
              <DashboardView dashboard={dashboard} logs={logs} onRefresh={refreshLogs} />
            ) : null}
            {view === "employees" ? (
              <EmployeesView
                role={auth.user.role}
                rows={employees}
                showForm={showAddEmployee}
                onToggleForm={() => setShowAddEmployee((prev) => !prev)}
                form={newEmployee}
                onChangeForm={setNewEmployee}
                onSubmit={createEmployee}
                editingEmployeeId={editingEmployeeId}
                editingEmployee={editingEmployee}
                onStartEdit={startEditEmployee}
                onCancelEdit={cancelEditEmployee}
                onChangeEdit={setEditingEmployee}
                onSaveEdit={saveEditEmployee}
              />
            ) : null}
            {view === "audit-logs" && auth.user.role === "Admin" ? (
              <AuditLogsView logs={logs} filters={filters} setFilters={setFilters} onRefresh={refreshLogs} />
            ) : null}
            {view === "security-alerts" && auth.user.role === "Admin" ? <SecurityAlertsView logs={logs} onRefresh={refreshLogs} /> : null}
            {view === "my-profile" ? <MyProfileView user={profile || auth.user} onSave={updateMyProfile} /> : null}
          </div>
        </main>
      </div>
    </div>
  );
}

function DashboardView({ dashboard, logs, onRefresh }) {
  const alertLogs = logs.filter((entry) => isHighOrCritical(entry.severity));
  const canaryCount = logs.filter((entry) => entry.action === "CANARY_TRIGGERED").length;
  const failedCount = logs.filter((entry) => entry.action === "FAILED_LOGIN_ATTEMPT").length;
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Overview</p>
          <h3 className="text-3xl font-bold">Security & Operations</h3>
        </div>
        <button onClick={onRefresh} className="border border-[#bcbcbc] px-3 py-2 text-sm hover:bg-slate-50">Refresh</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard title="Active Alerts" value={alertLogs.length} borderClass="border-red-200" />
        <StatCard title="Canary Token Hits" value={canaryCount} borderClass="border-red-200" />
        <StatCard title="Failed Logins (24h)" value={failedCount} borderClass="border-yellow-200" />
        <StatCard title="Audit Records" value={logs.length} />
      </div>

      <div className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 border border-[#bcbcbc]">
          <div className="px-3 py-2 border-b border-[#bcbcbc] text-xs uppercase tracking-[0.22em] text-slate-500">Recent Audit Trail</div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#bcbcbc]">
                <th className="text-left p-2">Time</th>
                <th className="text-left p-2">Action</th>
                <th className="text-left p-2">User</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 8).map((log) => (
                <tr key={log._id} className="border-b border-[#efefef]">
                  <td className="p-2">{fmtTime(log.createdAt)}</td>
                  <td className="p-2">{log.action}</td>
                  <td className="p-2">{log.actor?.name || log.actor?.email || "unknown"}</td>
                  <td className="p-2"><SeverityPill severity={log.severity} /></td>
                  <td className="p-2">{fmtIp(log)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border border-red-200">
          <div className="px-3 py-2 border-b border-red-200 text-xs uppercase tracking-[0.22em] text-red-500">Security Alerts</div>
          <div className="p-3 space-y-2 text-xs">
            {alertLogs.slice(0, 5).map((log) => (
              <div key={log._id} className="border border-[#e5e5e5] p-2">
                <p className="font-semibold">{log.action}</p>
                <p className="text-slate-600 mt-1">{log.message || "No message"}</p>
                <p className="text-slate-500 mt-1">IP {fmtIp(log)}</p>
              </div>
            ))}
            {alertLogs.length === 0 ? <p className="text-slate-500">No alerts.</p> : null}
          </div>
        </div>
      </div>

      {dashboard ? (
        <p className="mt-4 text-xs text-slate-500">Employees: {dashboard.totalEmployees} · Pending leaves: {dashboard.pendingLeaves}</p>
      ) : null}
    </section>
  );
}

function EmployeesView({
  role,
  rows,
  showForm,
  onToggleForm,
  form,
  onChangeForm,
  onSubmit,
  editingEmployeeId,
  editingEmployee,
  onStartEdit,
  onCancelEdit,
  onChangeEdit,
  onSaveEdit,
}) {
  const canManage = ["Admin", "HR Manager"].includes(role);
  const canEditStatus = role === "Admin";
  const getStatusPill = (row) => {
    if (row.accountState === "System Blocked") {
      return (
        <span className="border px-2 py-0.5 text-orange-700 border-orange-200">
          SYSTEM BLOCKED
        </span>
      );
    }
    if (row.status === "Inactive") {
      return (
        <span className="border px-2 py-0.5 text-red-700 border-red-200">
          INACTIVE
        </span>
      );
    }
    return (
      <span className="border px-2 py-0.5 text-[#1f7a1f] border-[#b7dfb7]">
        ACTIVE
      </span>
    );
  };
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Directory</p>
          <h3 className="text-3xl font-bold">Employees ({rows.length})</h3>
        </div>
        {canManage ? (
          <button onClick={onToggleForm} className="bg-black text-white border border-black px-4 py-2 text-sm">
            + Add Employee
          </button>
        ) : null}
      </div>

      {showForm ? (
        <form onSubmit={onSubmit} className="border border-[#bcbcbc] p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="border p-2" placeholder="Name" value={form.name} onChange={(e) => onChangeForm((prev) => ({ ...prev, name: e.target.value }))} required />
          <input className="border p-2" placeholder="Email" value={form.email} onChange={(e) => onChangeForm((prev) => ({ ...prev, email: e.target.value }))} required />
          <input className="border p-2" type="password" placeholder="Password" value={form.password} onChange={(e) => onChangeForm((prev) => ({ ...prev, password: e.target.value }))} required />
          <input className="border p-2" placeholder="Department" value={form.department} onChange={(e) => onChangeForm((prev) => ({ ...prev, department: e.target.value }))} />
          <select className="border p-2" value={form.role} onChange={(e) => onChangeForm((prev) => ({ ...prev, role: e.target.value }))}>
            <option value="Employee">Employee</option>
            <option value="HR Manager">HR Manager</option>
            <option value="Admin">Admin</option>
          </select>
          <input className="border p-2" type="number" min="0" placeholder="Salary" value={form.salary} onChange={(e) => onChangeForm((prev) => ({ ...prev, salary: e.target.value }))} />
          <button className="md:col-span-3 bg-black text-white border border-black px-4 py-2">Create Employee</button>
        </form>
      ) : null}

      <div className="border border-[#bcbcbc] overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#bcbcbc]">
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Department</th>
              <th className="text-left p-2">Designation</th>
              <th className="text-left p-2">Salary</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="p-4 text-center text-slate-500" colSpan={7}>No employee data</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row._id} className="border-b border-[#efefef]">
                  <td className="p-2">
                    {editingEmployeeId === row._id ? (
                      <input className="border p-1 w-full" value={editingEmployee.name} onChange={(e) => onChangeEdit((prev) => ({ ...prev, name: e.target.value }))} />
                    ) : (
                      row.name
                    )}
                  </td>
                  <td className="p-2">
                    {editingEmployeeId === row._id ? (
                      <input className="border p-1 w-full" value={editingEmployee.email} onChange={(e) => onChangeEdit((prev) => ({ ...prev, email: e.target.value }))} />
                    ) : (
                      row.email
                    )}
                  </td>
                  <td className="p-2">
                    {editingEmployeeId === row._id ? (
                      <input className="border p-1 w-full" value={editingEmployee.department} onChange={(e) => onChangeEdit((prev) => ({ ...prev, department: e.target.value }))} />
                    ) : (
                      row.department || "-"
                    )}
                  </td>
                  <td className="p-2">
                    {editingEmployeeId === row._id ? (
                      <select className="border p-1 w-full" value={editingEmployee.role} onChange={(e) => onChangeEdit((prev) => ({ ...prev, role: e.target.value }))}>
                        <option value="Employee">Employee</option>
                        <option value="HR Manager">HR Manager</option>
                        <option value="Admin">Admin</option>
                      </select>
                    ) : (
                      row.role
                    )}
                  </td>
                  <td className="p-2">
                    {editingEmployeeId === row._id ? (
                      <input
                        className="border p-1 w-full"
                        type="number"
                        min="0"
                        value={editingEmployee.salary}
                        onChange={(e) => onChangeEdit((prev) => ({ ...prev, salary: e.target.value }))}
                      />
                    ) : (
                      `INR ${row.salary || 0}`
                    )}
                  </td>
                  <td className="p-2">
                    {editingEmployeeId === row._id && canEditStatus ? (
                      <select className="border p-1 w-full" value={editingEmployee.status} onChange={(e) => onChangeEdit((prev) => ({ ...prev, status: e.target.value }))}>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    ) : (
                      getStatusPill(row)
                    )}
                  </td>
                  <td className="p-2 text-slate-500">
                    {canManage ? (
                      editingEmployeeId === row._id ? (
                        <div className="flex gap-2">
                          <button onClick={() => onSaveEdit(row._id)} className="border border-[#bcbcbc] px-2 py-0.5 hover:bg-slate-100">Save</button>
                          <button onClick={onCancelEdit} className="border border-[#bcbcbc] px-2 py-0.5 hover:bg-slate-100">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => onStartEdit(row)} className="border border-[#bcbcbc] px-2 py-0.5 hover:bg-slate-100">Edit</button>
                      )
                    ) : "--"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AuditLogsView({ logs, filters, setFilters, onRefresh }) {
  return (
    <section>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Monitoring</p>
          <h3 className="text-3xl font-bold">Audit Logs</h3>
        </div>
        <div className="flex gap-2">
          <select className="border p-2 text-sm" value={filters.severity} onChange={(e) => setFilters((prev) => ({ ...prev, severity: e.target.value }))}>
            <option value="">All severities</option>
            <option value="LOW">LOW</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
          <input
            className="border p-2 text-sm"
            placeholder="Action"
            value={filters.action}
            onChange={(e) => setFilters((prev) => ({ ...prev, action: e.target.value }))}
          />
          <button onClick={onRefresh} className="border border-[#bcbcbc] px-3 py-2 text-sm hover:bg-slate-50">Refresh</button>
        </div>
      </div>
      <LogsTable logs={logs} />
    </section>
  );
}

function SecurityAlertsView({ logs, onRefresh }) {
  const rows = logs.filter((entry) => isHighOrCritical(entry.severity));
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-red-500">Intrusion & Anomaly</p>
          <h3 className="text-3xl font-bold">Security Alerts ({rows.length})</h3>
          <p className="text-sm text-slate-500 mt-1">Canary token hits, brute-force lockouts, rapid request bursts, large data accesses.</p>
        </div>
        <button onClick={onRefresh} className="border border-[#bcbcbc] px-3 py-2 text-sm hover:bg-slate-50">Refresh</button>
      </div>
      <LogsTable logs={rows} />
    </section>
  );
}

function LogsTable({ logs }) {
  return (
    <div className="border border-[#bcbcbc] overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#bcbcbc]">
            <th className="text-left p-2">Time</th>
            <th className="text-left p-2">Type</th>
            <th className="text-left p-2">Severity</th>
            <th className="text-left p-2">Message</th>
            <th className="text-left p-2">IP</th>
            <th className="text-left p-2">User</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr>
              <td className="p-4 text-center text-slate-500" colSpan={6}>No logs found</td>
            </tr>
          ) : (
            logs.map((log) => (
              <tr key={log._id} className="border-b border-[#efefef]">
                <td className="p-2">{fmtTime(log.createdAt)}</td>
                <td className="p-2">{log.action}</td>
                <td className="p-2"><SeverityPill severity={log.severity} /></td>
                <td className="p-2">{log.message || "-"}</td>
                <td className="p-2">{fmtIp(log)}</td>
                <td className="p-2">{log.actor?.name || log.actor?.email || "unknown"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function MyProfileView({ user, onSave }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || "", address: user?.address || "" });

  useEffect(() => {
    setForm({ name: user?.name || "", address: user?.address || "" });
  }, [user?.name, user?.address]);

  const submit = async (event) => {
    event.preventDefault();
    await onSave({ name: form.name, address: form.address });
    setEditing(false);
  };

  return (
    <section className="border border-[#bcbcbc] p-4 max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Account</p>
          <h3 className="text-3xl font-bold mt-1">My Profile</h3>
        </div>
        {editing ? null : (
          <button className="border border-[#bcbcbc] px-3 py-2 text-sm hover:bg-slate-50" onClick={() => setEditing(true)}>
            Edit profile
          </button>
        )}
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <InfoRow
          label="Name"
          value={
            editing ? (
              <input className="mt-1 w-full border border-[#d6d6d6] px-2 py-1" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            ) : (
              user?.name
            )
          }
        />
        <InfoRow label="Email" value={user?.email} />
        <InfoRow label="Role" value={user?.role} />
        <InfoRow label="Department" value={user?.department} />
        <InfoRow label="Salary" value={user?.salary ? `INR ${user.salary}` : "-"} />
        <InfoRow
          label="Address"
          value={
            editing ? (
              <input className="mt-1 w-full border border-[#d6d6d6] px-2 py-1" value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} placeholder="Add your address" />
            ) : (
              user?.address
            )
          }
        />
      </div>
      {editing ? (
        <form onSubmit={submit} className="mt-4 flex gap-2">
          <button className="bg-black text-white border border-black px-4 py-2 text-sm">Save changes</button>
          <button
            type="button"
            className="border border-[#bcbcbc] px-4 py-2 text-sm"
            onClick={() => {
              setEditing(false);
              setForm({ name: user?.name || "", address: user?.address || "" });
            }}
          >
            Cancel
          </button>
        </form>
      ) : null}
    </section>
  );
}

function SeverityPill({ severity }) {
  const value = String(severity || "LOW").toUpperCase();
  const cls = value === "CRITICAL" ? "text-red-700 bg-red-100" : value === "HIGH" ? "text-orange-700 bg-orange-100" : "text-green-700 bg-green-100";
  return <span className={`px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{value}</span>;
}

function StatCard({ title, value, borderClass = "border-[#bcbcbc]" }) {
  return (
    <div className={`border ${borderClass} p-4`}>
      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <p className="text-4xl font-bold mt-2">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="border border-[#dbdbdb] p-3">
      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</p>
      {typeof value === "string" || typeof value === "number" ? <p className="mt-1 font-medium">{value || "-"}</p> : value}
    </div>
  );
}

export default App;
