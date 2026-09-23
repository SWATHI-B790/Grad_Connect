import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send, CheckCircle, AlertCircle, User, MessageSquare, Tag } from "lucide-react";
import API from "../api/axios";

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // Client-side Validation
    if (!formData.name.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }

    if (!formData.email.trim()) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (!formData.message.trim()) {
      setErrorMsg("Please enter your message or review.");
      return;
    }

    if (formData.message.trim().length < 10) {
      setErrorMsg("Message must be at least 10 characters long.");
      return;
    }

    setLoading(true);

    try {
      const response = await API.post("/contact", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim() || "New Contact Message - GradConnect Network",
        message: formData.message.trim(),
      });

      if (response.data.success) {
        setSuccessMsg("Message sent successfully! We'll get back to you soon.");
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
        });
      } else {
        setErrorMsg(response.data.msg || "Failed to send message. Please try again later.");
      }
    } catch (err) {
      console.error("Contact Form Submit Error:", err);
      setErrorMsg(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          "Failed to send message. Please check connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact-section" className="section-contact">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="section-header text-center"
        >
          <span className="section-subtitle">
            <Mail size={16} className="subtitle-icon" />
            <span>WE VALUE YOUR FEEDBACK</span>
          </span>
          <h2 className="section-title center-title">
            Get In Touch <span className="animated-underline center-underline" />
          </h2>
          <p className="section-intro text-center max-w-2xl">
            Have feedback, a question, or a review about this website? Send us a message and our team will be happy to assist you.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="contact-card-container"
        >
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="alert alert-success flex-items-center gap-2 mb-4"
            >
              <CheckCircle size={20} />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="alert alert-error flex-items-center gap-2 mb-4"
            >
              <AlertCircle size={20} />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-row-2col">
              {/* Visitor Name */}
              <div className="form-group">
                <label className="form-label required">
                  <User size={16} />
                  <span>Your Name</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className="form-input"
                  required
                />
              </div>

              {/* Visitor Email */}
              <div className="form-group">
                <label className="form-label required">
                  <Mail size={16} />
                  <span>Your Email Address</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. john@example.com"
                  className="form-input"
                  required
                />
              </div>
            </div>

            {/* Subject (Optional) */}
            <div className="form-group">
              <label className="form-label">
                <Tag size={16} />
                <span>Subject (Optional)</span>
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="e.g. Website Feedback / Inquiry"
                className="form-input"
              />
            </div>

            {/* Message / Review */}
            <div className="form-group">
              <label className="form-label required">
                <MessageSquare size={16} />
                <span>Message or Review</span>
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Share your feedback or review about the site..."
                rows={5}
                className="form-input form-textarea"
                required
              />
            </div>

            {/* Submit Button */}
            <div className="form-actions text-center mt-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-contact-submit"
              >
                {loading ? (
                  <span>Sending Message...</span>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Send Message</span>
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactSection;
