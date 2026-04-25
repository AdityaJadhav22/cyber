import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { apiRequest } from "./api";

const navByRole = {
  Admin: ["dashboard", "employees", "payroll", "suspicious"],
  "HR Manager": ["employees", "payroll", "leaves"],
  Employee: ["my-dashboard", "my-profile", "my-leaves"],
  Auditor: ["suspicious", "payroll"],
};

const useAuth = () => {
  const [auth, setAuth] = useState(() => {
    const raw = localStorage.getItem("hrms_auth");
    return raw ? JSON.parse(raw) : { token: "", user: null };
  });
  useEffect(() => localStorage.setItem("hrms_auth", JSON.stringify(auth)), [auth]);
  return [auth, setAuth];
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginPage({ onAuth }) {
  const [authMode, setAuthMode] = useState("auth");
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    mfaCode: "123456",
    role: "Employee",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetFlow, setResetFlow] = useState({
    email: "",
    resetToken: "",
    newPassword: "",
    mfaCode: "123456",
  });

  const validate = () => {
    const errors = {};
    if (isSignup && !form.name.trim()) errors.name = "Name is required";
    if (!emailPattern.test(form.email.trim())) errors.email = "Valid email is required";
    if (form.password.length < 8) errors.password = "Password must be at least 8 characters";
    if (!/^\d{6}$/.test(form.mfaCode)) errors.mfaCode = "MFA code must be 6 digits";
    return errors;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const endpoint = isSignup ? "/auth/signup" : "/auth/login";
      const data = await apiRequest(endpoint, { method: "POST", body: form });
      onAuth({ token: data.token, user: data.user });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!emailPattern.test(resetFlow.email.trim())) {
      setError("Enter a valid registered email");
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: { email: resetFlow.email.trim() },
      });
      setInfo(`${data.message} Reset token (demo): ${data.resetToken || "check backend logs"}`);
      if (data.resetToken) {
        setResetFlow((prev) => ({ ...prev, resetToken: data.resetToken }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!resetFlow.resetToken.trim()) {
      setError("Reset token is required");
      return;
    }
    if (resetFlow.newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    if (!/^\d{6}$/.test(resetFlow.mfaCode)) {
      setError("MFA code must be 6 digits");
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest("/auth/reset-password", {
        method: "POST",
        body: {
          resetToken: resetFlow.resetToken.trim(),
          newPassword: resetFlow.newPassword,
          mfaCode: resetFlow.mfaCode,
        },
      });
      setInfo(data.message);
      setAuthMode("login");
      setIsSignup(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `mt-3 w-full border p-2 rounded ${fieldErrors[field] ? "border-red-500" : "border-slate-300"}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <form
        onSubmit={authMode === "forgot" ? submitForgotPassword : authMode === "reset" ? submitResetPassword : submit}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow"
      >
        <h1 className="text-2xl font-bold text-slate-800">Secure HRMS</h1>
        <p className="mt-1 text-sm text-slate-500">Cybersecurity-first HR platform</p>
        {authMode === "auth" && isSignup && (
          <>
            <input
              className={`mt-4 w-full border p-2 rounded ${fieldErrors.name ? "border-red-500" : "border-slate-300"}`}
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
          </>
        )}
        {authMode === "auth" && (
          <>
            <input className={inputClass("email")} placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
            <input
              className={inputClass("password")}
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
            <input className={inputClass("mfaCode")} placeholder="MFA Code (123456)" value={form.mfaCode} onChange={(e) => setForm({ ...form, mfaCode: e.target.value })} />
            {fieldErrors.mfaCode && <p className="mt-1 text-xs text-red-600">{fieldErrors.mfaCode}</p>}
          </>
        )}
        {authMode === "forgot" && (
          <input
            className="mt-4 w-full border border-slate-300 p-2 rounded"
            placeholder="Registered email"
            value={resetFlow.email}
            onChange={(e) => setResetFlow((prev) => ({ ...prev, email: e.target.value }))}
          />
        )}
        {authMode === "reset" && (
          <>
            <input
              className="mt-4 w-full border border-slate-300 p-2 rounded"
              placeholder="Reset token"
              value={resetFlow.resetToken}
              onChange={(e) => setResetFlow((prev) => ({ ...prev, resetToken: e.target.value }))}
            />
            <input
              className="mt-3 w-full border border-slate-300 p-2 rounded"
              type="password"
              placeholder="New password"
              value={resetFlow.newPassword}
              onChange={(e) => setResetFlow((prev) => ({ ...prev, newPassword: e.target.value }))}
            />
            <input
              className="mt-3 w-full border border-slate-300 p-2 rounded"
              placeholder="MFA Code (123456)"
              value={resetFlow.mfaCode}
              onChange={(e) => setResetFlow((prev) => ({ ...prev, mfaCode: e.target.value }))}
            />
          </>
        )}
        {authMode === "auth" && isSignup && (
          <select className="mt-3 w-full border p-2 rounded" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option>Admin</option>
            <option>HR Manager</option>
            <option>Employee</option>
            <option>Auditor</option>
          </select>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {info && <p className="mt-3 text-sm text-green-700">{info}</p>}
        <button disabled={loading} className="mt-4 w-full rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-60">
          {loading
            ? "Please wait..."
            : authMode === "forgot"
              ? "Generate Reset Token"
              : authMode === "reset"
                ? "Reset Password"
                : isSignup
                  ? "Sign Up"
                  : "Login"}
        </button>
        {authMode === "auth" && (
          <>
            <button type="button" className="mt-3 text-sm text-blue-600" onClick={() => setIsSignup(!isSignup)}>
              {isSignup ? "Already have an account? Login" : "New user? Sign up"}
            </button>
            <button type="button" className="mt-2 text-sm text-slate-600 underline" onClick={() => setAuthMode("forgot")}>
              Forgot password?
            </button>
          </>
        )}
        {authMode !== "auth" && (
          <button type="button" className="mt-3 text-sm text-blue-600" onClick={() => setAuthMode("auth")}>
            Back to login
          </button>
        )}
        {authMode === "forgot" && (
          <button type="button" className="mt-2 text-sm text-slate-600 underline" onClick={() => setAuthMode("reset")}>
            I already have reset token
          </button>
        )}
      </form>
    </div>
  );
}

function Layout({ auth, setAuth, children, onNav }) {
  const navigate = useNavigate();
  const menu = useMemo(() => navByRole[auth.user?.role] || [], [auth.user?.role]);
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-slate-900 text-white p-4">
        <h2 className="text-xl font-semibold">HRMS</h2>
        <p className="text-sm text-slate-300 mt-1">{auth.user?.role}</p>
        <div className="mt-6 space-y-2">
          {menu.map((item) => (
            <button key={item} onClick={() => onNav(item)} className="block w-full text-left rounded bg-slate-800 px-3 py-2 capitalize hover:bg-slate-700">
              {item.replace("-", " ")}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            setAuth({ token: "", user: null });
            navigate("/");
          }}
          className="mt-6 rounded bg-red-600 px-3 py-2 text-sm"
        >
          Logout
        </button>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

function App() {
  const [auth, setAuth] = useAuth();
  const [view, setView] = useState("dashboard");
  const [data, setData] = useState({ employees: [], payroll: [], leaves: [], suspicious: [], dashboard: null, me: null });
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    if (!auth.token) return;
    setLoadingData(true);
    setError("");
    try {
      if (["Admin", "HR Manager", "Auditor"].includes(auth.user.role)) {
        const [employees, payroll, suspicious] = await Promise.all([
          apiRequest("/employees", { token: auth.token }).catch(() => []),
          apiRequest("/payroll", { token: auth.token }).catch(() => []),
          apiRequest("/dashboard/suspicious", { token: auth.token }).catch(() => []),
        ]);
        setData((prev) => ({ ...prev, employees, payroll, suspicious }));
      }
      if (auth.user.role === "Admin") {
        const dashboard = await apiRequest("/dashboard/admin", { token: auth.token }).catch(() => null);
        setData((prev) => ({ ...prev, dashboard }));
      }
      if (auth.user.role === "Employee") {
        const [me, leaves, dashboard] = await Promise.all([
          apiRequest("/employees/me", { token: auth.token }),
          apiRequest("/leaves/mine", { token: auth.token }).catch(() => []),
          apiRequest("/dashboard/employee", { token: auth.token }).catch(() => null),
        ]);
        setData((prev) => ({ ...prev, me, leaves, dashboard }));
      }
      if (auth.user.role === "HR Manager") {
        const leaves = await apiRequest("/leaves", { token: auth.token }).catch(() => []);
        setData((prev) => ({ ...prev, leaves }));
      }
    } catch (err) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!auth.user?.role) return;
    setView(auth.user.role === "Employee" ? "my-dashboard" : auth.user.role === "HR Manager" ? "leaves" : "dashboard");
    loadData();
  }, [auth.token, auth.user?.role]);

  if (!auth.token || !auth.user) {
    return <LoginPage onAuth={setAuth} />;
  }

  return (
    <Layout auth={auth} setAuth={setAuth} onNav={setView}>
      <Routes>
        <Route path="/" element={<Navigate to="/app" />} />
        <Route
          path="/app"
          element={
            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
              {loadingData && <p className="text-sm text-slate-500">Loading data...</p>}
              {error && <p className="text-sm text-red-600">{error}</p>}
              {view === "dashboard" && data.dashboard && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card title="Total Employees" value={data.dashboard.totalEmployees} />
                  <Card title="Suspicious Activities" value={data.dashboard.suspiciousActivities} />
                  <Card title="Pending Leaves" value={data.dashboard.pendingLeaves} />
                </div>
              )}
              {view === "employees" && <List title="Employees" rows={data.employees.map((e) => `${e.name} (${e.role}) - ${e.department || "N/A"}`)} />}
              {view === "payroll" && <PayrollManager auth={auth} payroll={data.payroll} onUpdated={loadData} />}
              {view === "suspicious" && <List title="Suspicious Logs" rows={data.suspicious.map((s) => `${s.action} (${s.severity})`)} />}
              {view === "my-dashboard" && <EmployeeDashboard profile={data.dashboard?.profile || data.me} leaves={data.dashboard?.leaves || data.leaves} />}
              {view === "my-profile" && <EmployeeProfile profile={data.me} />}
              {view === "my-leaves" && <EmployeeLeaves auth={auth} leaves={data.leaves} onApplied={loadData} />}
              {view === "leaves" && <LeaveReview auth={auth} rows={data.leaves} onUpdated={loadData} />}
            </div>
          }
        />
      </Routes>
    </Layout>
  );
}

function EmployeeDashboard({ profile, leaves }) {
  if (!profile) return <EmptyState text="Profile unavailable. Please refresh." />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card title="Name" value={profile.name || "-"} />
      <Card title="Email" value={profile.email || "-"} />
      <Card title="Department" value={profile.department || "Not set"} />
      <Card title="Current Salary" value={`INR ${profile.salary || 0}`} />
      <Card title="Pending Leaves" value={leaves.filter((l) => l.status === "Pending").length} />
      <Card title="Approved Leaves" value={leaves.filter((l) => l.status === "Approved").length} />
    </div>
  );
}

function EmployeeProfile({ profile }) {
  if (!profile) return <EmptyState text="Profile not found." />;
  return (
    <div className="rounded bg-white p-4 shadow">
      <h3 className="text-lg font-semibold">My Profile</h3>
      <div className="mt-3 space-y-2 text-sm text-slate-700">
        <p><strong>Name:</strong> {profile.name}</p>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Role:</strong> {profile.role}</p>
        <p><strong>Department:</strong> {profile.department || "Not assigned"}</p>
        <p><strong>Salary:</strong> INR {profile.salary || 0}</p>
        <p><strong>Address:</strong> {profile.address || "Not updated"}</p>
      </div>
    </div>
  );
}

function EmployeeLeaves({ auth, leaves, onApplied }) {
  const [form, setForm] = useState({ fromDate: "", toDate: "", reason: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.fromDate || !form.toDate || !form.reason.trim()) {
      setError("All leave fields are required");
      return;
    }
    if (new Date(form.toDate) < new Date(form.fromDate)) {
      setError("To date cannot be before from date");
      return;
    }
    try {
      await apiRequest("/leaves", { method: "POST", token: auth.token, body: form });
      setSuccess("Leave request submitted");
      setForm({ fromDate: "", toDate: "", reason: "" });
      onApplied();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="rounded bg-white p-4 shadow space-y-3">
        <h3 className="text-lg font-semibold">Apply Leave</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input type="date" className="border rounded p-2" value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} />
          <input type="date" className="border rounded p-2" value={form.toDate} onChange={(e) => setForm({ ...form, toDate: e.target.value })} />
        </div>
        <textarea
          className="w-full border rounded p-2"
          rows="3"
          placeholder="Reason for leave"
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}
        <button className="rounded bg-slate-900 px-4 py-2 text-white">Apply</button>
      </form>
      <List title="My Leave Requests" rows={leaves.map((l) => `${l.status}: ${new Date(l.fromDate).toDateString()} to ${new Date(l.toDate).toDateString()} - ${l.reason}`)} />
    </div>
  );
}

function LeaveReview({ auth, rows, onUpdated }) {
  const updateStatus = async (leaveId, status) => {
    try {
      await apiRequest(`/leaves/${leaveId}/review`, {
        method: "PUT",
        token: auth.token,
        body: { status },
      });
      onUpdated();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="rounded bg-white p-4 shadow">
      <h3 className="text-lg font-semibold">Leave Requests</h3>
      <ul className="mt-3 space-y-2">
        {rows.length === 0 && <li className="text-slate-500 text-sm">No leave requests</li>}
        {rows.map((row) => (
          <li key={row._id} className="border rounded p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="text-sm">
              <p className="font-medium">{row.employee?.name || "Employee"}</p>
              <p>{new Date(row.fromDate).toDateString()} to {new Date(row.toDate).toDateString()}</p>
              <p className="text-slate-600">{row.reason}</p>
              <p className="text-xs mt-1">Status: {row.status}</p>
            </div>
            {row.status === "Pending" && (
              <div className="space-x-2">
                <button onClick={() => updateStatus(row._id, "Approved")} className="rounded bg-green-600 px-3 py-1 text-white text-sm">Approve</button>
                <button onClick={() => updateStatus(row._id, "Rejected")} className="rounded bg-red-600 px-3 py-1 text-white text-sm">Reject</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PayrollManager({ auth, payroll, onUpdated }) {
  const [editSalary, setEditSalary] = useState({});
  const canEdit = ["Admin", "HR Manager"].includes(auth.user.role);

  const saveSalary = async (employeeId) => {
    const value = Number(editSalary[employeeId]);
    if (Number.isNaN(value) || value < 0) {
      alert("Enter a valid salary value");
      return;
    }
    try {
      await apiRequest(`/payroll/${employeeId}`, {
        method: "PUT",
        token: auth.token,
        body: { salary: value },
      });
      onUpdated();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="rounded bg-white p-4 shadow">
      <h3 className="text-lg font-semibold">Payroll</h3>
      <ul className="mt-3 space-y-2">
        {payroll.length === 0 && <li className="text-slate-500 text-sm">No payroll records</li>}
        {payroll.map((p) => (
          <li key={p._id} className="border rounded p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="text-sm">
              <p className="font-medium">{p.name}</p>
              <p className="text-slate-600">{p.email}</p>
              <p>Current Salary: INR {p.salary || 0}</p>
            </div>
            {canEdit ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  className="border rounded p-2 w-36"
                  placeholder="New salary"
                  value={editSalary[p._id] ?? ""}
                  onChange={(e) => setEditSalary((prev) => ({ ...prev, [p._id]: e.target.value }))}
                />
                <button onClick={() => saveSalary(p._id)} className="rounded bg-slate-900 px-3 py-2 text-white text-sm">Update</button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="rounded bg-white p-4 shadow">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function List({ title, rows }) {
  return (
    <div className="rounded bg-white p-4 shadow">
      <h3 className="text-lg font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm">
        {rows.length === 0 && <li className="text-slate-500">No records</li>}
        {rows.map((row, index) => (
          <li key={index} className="rounded border px-3 py-2">
            {row}
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="rounded bg-white p-4 shadow text-sm text-slate-500">{text}</div>;
}

export default App;
