import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import Home from "./pages/Home";
import Domains from "./pages/Domains";
import DomainDetail from "./pages/DomainDetail";
import Jobs from "./pages/Jobs";
import Blogs from "./pages/Blogs";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import CreateEvent from "./pages/CreateEvent";
import MyEvents from "./pages/MyEvents";
import EventRegistrations from "./pages/EventRegistrations";
import BlogDetail from "./pages/BlogDetail";
import CreateBlog from "./pages/CreateBlog";
import MyBlogs from "./pages/MyBlogs";
import CreateJob from "./pages/CreateJob";
import AdminJobManagement from "./pages/admin/AdminJobManagement";
import Register from "./pages/Register";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import Unauthorized from "./pages/Unauthorized";
import Profile from "./pages/Profile";
import People from "./pages/People";
import Notifications from "./pages/Notifications";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRegistrations from "./pages/admin/AdminRegistrations";
import AdminUserManagement from "./pages/admin/AdminUserManagement";
import AdminUserDetail from "./pages/admin/AdminUserDetail";
import AdminDomainManagement from "./pages/admin/AdminDomainManagement";
import AdminEventManagement from "./pages/admin/AdminEventManagement";
import BlogList from "./pages/admin/BlogList";
import BlogForm from "./pages/admin/BlogForm";
import BannerList from "./pages/admin/BannerList";
import BannerForm from "./pages/admin/BannerForm";
import Reports from "./pages/Reports";
import ActivityLogs from "./pages/ActivityLogs";
import Settings from "./pages/Settings";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          <div className="app-viewport">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/domains" element={<Domains />} />
              <Route path="/domains/:slug" element={<DomainDetail />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/blogs" element={<Blogs />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/events/slug/:slug" element={<EventDetail />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/student-login" element={<Login defaultRole="student" />} />
              <Route path="/alumni-login" element={<Login defaultRole="alumni" />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin-login" element={<Navigate to="/admin/login" replace />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/people" element={<People />} />

              {/* Protected Read More Article Detail Route (Login Required) */}
              <Route element={<ProtectedRoute redirectMessage="Please log in to read the full article." />}>
                <Route path="/blog/:slug" element={<BlogDetail />} />
              </Route>

              {/* Protected User Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/my-events" element={<MyEvents />} />
                <Route path="/events/create" element={<CreateEvent />} />
                <Route path="/events/edit/:id" element={<CreateEvent />} />
                <Route path="/events/:id/registrations" element={<EventRegistrations />} />
                {/* Alumni Experience Hub Routes */}
                <Route path="/blogs/create" element={<CreateBlog />} />
                <Route path="/blogs/edit/:id" element={<CreateBlog />} />
                <Route path="/my-blogs" element={<MyBlogs />} />
                {/* Career Portal Job Routes */}
                <Route path="/jobs/create" element={<CreateJob />} />
                <Route path="/jobs/edit/:id" element={<CreateJob />} />
              </Route>

              {/* Protected Admin Routes with Sidebar Layout */}
              <Route element={<ProtectedRoute adminOnly={true} roles={["subadmin", "superadmin", "admin", "admin1", "admin2"]} />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />

                  {/* Dashboard */}
                  <Route path="dashboard" element={<Dashboard />} />

                  {/* Registrations Review Queue */}
                  <Route path="registrations" element={<AdminRegistrations />} />

                  {/* Member Management Directory & User Details */}
                  <Route path="users" element={<AdminUserManagement />} />
                  <Route path="users/:id" element={<AdminUserDetail />} />

                  {/* Content Management: Blogs */}
                  <Route path="blogs" element={<BlogList />} />
                  <Route path="blogs/create" element={<BlogForm />} />
                  <Route path="blogs/edit/:id" element={<BlogForm />} />

                  {/* Content Management: Domains */}
                  <Route path="domains" element={<AdminDomainManagement />} />

                  {/* Content Management: Events */}
                  <Route path="events" element={<AdminEventManagement />} />

                  {/* Content Management: Jobs */}
                  <Route path="jobs" element={<AdminJobManagement />} />

                  {/* Hero Banners */}
                  <Route path="banners" element={<BannerList />} />
                  <Route path="banners/create" element={<BannerForm />} />
                  <Route path="banners/edit/:id" element={<BannerForm />} />

                  {/* Reports, Activity Logs & System Settings */}
                  <Route path="activity" element={<ActivityLogs />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Route>

              {/* Fallback Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
