import React, { useEffect, useState, useRef } from "react";
import { FileText, RefreshCw, Download, CheckCircle2, X } from "lucide-react";
import API from "../api/axios";
import AdminPageContainer from "../components/admin/AdminPageContainer";
import PermissionAlert from "../components/admin/PermissionAlert";
import ErrorAlert from "../components/admin/ErrorAlert";

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState("");
  const [downloadingKey, setDownloadingKey] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const fetchedRef = useRef(false);

  const fetchReports = async () => {
    setLoading(true);
    setError("");
    setPermissionDenied(false);
    setPermissionMessage("");

    try {
      const response = await API.get("/admin/reports");
      setReports(response.data.reports || []);
    } catch (err) {
      if (err.response?.status === 403 || err.response?.data?.menuBlocked) {
        setPermissionDenied(true);
        setPermissionMessage(
          err.response?.data?.msg ||
          err.response?.data?.message ||
          "You do not have permission to access System Reports."
        );
      } else {
        setError(
          err.response?.data?.msg ||
          err.response?.data?.message ||
          "Failed to load system reports"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchReports();
  }, []);

  const handleDownloadPdf = async (report) => {
    const reportKey = report.key || report.id;
    if (downloadingKey) return; // Guard against multiple simultaneous clicks

    setDownloadingKey(reportKey);
    setDownloadError("");
    setDownloadSuccess("");

    try {
      const downloadEndpoint = report.downloadUrl || `/admin/reports/${reportKey}/pdf`;
      const response = await API.get(downloadEndpoint, {
        responseType: "blob",
      });

      // Extract filename from header or fallback to report metadata
      let filename = report.filename || `${reportKey}.pdf`;
      const disposition = response.headers?.["content-disposition"];
      if (disposition && disposition.includes("filename=")) {
        const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].trim();
        }
      }

      // Create blob download trigger
      const blob = new Blob([response.data], { type: "application/pdf" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setDownloadSuccess(`Successfully generated and downloaded "${filename}"`);
      setTimeout(() => setDownloadSuccess(""), 6000);
    } catch (err) {
      console.error("Report PDF download error:", err);
      let errorMsg = "Unable to generate this report. Please try again.";

      if (err.response?.status === 403) {
        errorMsg =
          err.response?.data?.message ||
          err.response?.data?.msg ||
          "You do not have administrative permission to download this report.";
      } else if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          if (parsed.message || parsed.msg) {
            errorMsg = parsed.message || parsed.msg;
          }
        } catch {
          // Keep default message
        }
      }

      setDownloadError(errorMsg);
    } finally {
      setDownloadingKey(null);
    }
  };

  return (
    <AdminPageContainer>
      <div className="admin-page-header">
        <div className="header-info">
          <h1 className="admin-page-title">
            <FileText size={26} className="text-primary" />
            System Analytical Reports
          </h1>
          <p className="admin-page-subtitle">
            Generate and review analytical system telemetry and platform usage reports.
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="admin-btn-refresh"
          disabled={loading || !!downloadingKey}
          title="Reload reports"
        >
          <RefreshCw size={15} className={loading ? "spin-icon" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Download Success Banner */}
      {downloadSuccess && (
        <div className="blog-alert-box success" style={{ marginBottom: "1rem" }}>
          <div className="blog-alert-content">
            <CheckCircle2 size={18} />
            <span>{downloadSuccess}</span>
          </div>
          <button
            type="button"
            className="blog-alert-close"
            onClick={() => setDownloadSuccess("")}
            title="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Download Error Alert */}
      {downloadError && (
        <div style={{ marginBottom: "1rem" }}>
          <ErrorAlert
            title="Report Generation Error"
            message={downloadError}
            onRetry={() => setDownloadError("")}
            retryLoading={false}
          />
        </div>
      )}

      {/* Permission Denied Alert - Rendered strictly inside container */}
      {permissionDenied && (
        <PermissionAlert
          title="Access Restricted"
          message={permissionMessage}
          onRetry={fetchReports}
          retryLoading={loading}
        />
      )}

      {/* Non-403 Error Alert */}
      {error && !permissionDenied && (
        <ErrorAlert
          title="Failed to load reports"
          message={error}
          onRetry={fetchReports}
          retryLoading={loading}
        />
      )}

      {!permissionDenied && (
        <div className="admin-table-card">
          <div className="card-header-bar" style={{ padding: "1.25rem", borderBottom: "1px solid var(--border-color)" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 800 }}>Available Analytical Reports</h3>
          </div>
          {loading ? (
            <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-muted)" }}>
              <RefreshCw size={22} className="spin-icon" style={{ margin: "0 auto 0.5rem" }} />
              Loading analytical reports...
            </div>
          ) : (
            <div className="reports-list" style={{ padding: "1rem" }}>
              {reports.map((report) => {
                const isThisDownloading = downloadingKey === (report.key || report.id);

                return (
                  <div
                    key={report.id || report.key}
                    className="report-item-card"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "1.1rem 1.35rem",
                      border: "1px solid var(--border-color)",
                      borderRadius: "10px",
                      marginBottom: "0.75rem",
                      backgroundColor: "var(--card-bg)",
                      gap: "1rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <div className="report-info" style={{ display: "flex", alignItems: "center", gap: "0.85rem", minWidth: "220px", flex: 1 }}>
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "8px",
                          backgroundColor: "#eff6ff",
                          color: "#2563eb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0, color: "var(--dark-color)" }}>
                          {report.name}
                        </h4>
                        {report.detail && (
                          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "3px 0 2px" }}>
                            {report.detail}
                          </p>
                        )}
                        <span style={{ fontSize: "0.725rem", color: "var(--text-muted)" }}>
                          Generated: {new Date(report.generatedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="admin-btn-download-pdf"
                      onClick={() => handleDownloadPdf(report)}
                      disabled={!!downloadingKey}
                      title={`Download ${report.name} as PDF`}
                    >
                      {isThisDownloading ? (
                        <>
                          <RefreshCw size={13} className="spin-icon" />
                          <span>Generating PDF...</span>
                        </>
                      ) : (
                        <>
                          <Download size={13} />
                          <span>Download PDF</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </AdminPageContainer>
  );
};

export default Reports;
