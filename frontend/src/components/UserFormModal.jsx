import React, { useState, useEffect } from "react";

const UserFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  mode = "add",
  initialData = null,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setFormData({
        name: initialData.name || "",
        email: initialData.email || "",
        password: "", // Leave blank to keep current password
        role: initialData.role || "user",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "user",
      });
    }
    setError("");
  }, [mode, initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const { name, email, password, role } = formData;

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (mode === "add" && (!password || password.length < 6)) {
      setError("Password is required and must be at least 6 characters.");
      return;
    }

    if (mode === "edit" && password && password.length < 6) {
      setError("New password must be at least 6 characters if provided.");
      return;
    }

    onSubmit({
      name: name.trim(),
      email: email.trim(),
      password: password ? password.trim() : undefined,
      role,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3 className="modal-title">
            {mode === "add" ? "➕ Add New User" : "✏️ Edit User Details"}
          </h3>
          <button onClick={onClose} className="modal-close-btn" type="button">
            &times;
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="modal-name">Full Name</label>
            <input
              type="text"
              id="modal-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Swathi"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="modal-email">Email Address</label>
            <input
              type="email"
              id="modal-email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. user@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="modal-password">
              {mode === "add"
                ? "Password"
                : "New Password (leave blank to keep current)"}
            </label>
            <input
              type="password"
              id="modal-password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={
                mode === "add"
                  ? "Minimum 6 characters"
                  : "Optional new password"
              }
              required={mode === "add"}
            />
          </div>

          <div className="form-group">
            <label htmlFor="modal-role">User Role</label>
            <select
              id="modal-role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="modal-select"
            >
              <option value="user">User (Standard)</option>
              <option value="admin">Admin (Administrator)</option>
            </select>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading
                ? mode === "add"
                  ? "Saving User..."
                  : "Updating User..."
                : mode === "add"
                ? "Add User"
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;
