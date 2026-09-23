import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  User,
  Mail,
  Lock,
  Briefcase,
  BookOpen,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Award,
  Globe,
  MapPin,
  Heart,
  Check,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const STEP_LABELS = [
  "01 Account",
  "02 Identity",
  "03 Education",
  "04 Career",
  "05 Profile",
  "06 Interests",
  "07 Networking",
];

const INTEREST_OPTIONS = [
  "Software Development",
  "Data Science",
  "AI & Machine Learning",
  "Cybersecurity",
  "Cloud Computing",
  "UI/UX Design",
  "Product Management",
  "Finance",
  "Marketing",
  "Human Resources",
  "Entrepreneurship",
  "Research",
  "Consulting",
];

const GOAL_OPTIONS = [
  "Find a mentor",
  "Find jobs",
  "Find internships",
  "Connect with alumni",
  "Help students",
  "Hire talent",
  "Share knowledge",
  "Attend events",
  "Explore career opportunities",
];

const Register = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const roleParam = searchParams.get("role");
  const initialUserType = roleParam === "student" ? "Current Student" : "Alumni";

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: initialUserType,
    college: "GradConnect Central University",
    department: "",
    degree: "B.Tech",
    batch: "2024",
    jobTitle: "",
    company: "",
    industry: "",
    skills: "",
    bio: "",
    city: "",
    country: "",
    linkedIn: "",
    portfolio: "",
    interests: [],
    networkingGoals: [],
    willingToMentor: false,
    openToReferrals: true,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [submittedUser, setSubmittedUser] = useState(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const role = searchParams.get("role");
    if (role === "student" || roleParam === "student") {
      setFormData((prev) => ({ ...prev, userType: "Current Student" }));
    } else if (role === "alumni" || roleParam === "alumni") {
      setFormData((prev) => ({ ...prev, userType: "Alumni" }));
    }
  }, [location.search]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    setError("");
  };

  const toggleInterest = (interest) => {
    setFormData((prev) => {
      const exists = prev.interests.includes(interest);
      return {
        ...prev,
        interests: exists
          ? prev.interests.filter((i) => i !== interest)
          : [...prev.interests, interest],
      };
    });
  };

  const toggleGoal = (goal) => {
    setFormData((prev) => {
      const exists = prev.networkingGoals.includes(goal);
      return {
        ...prev,
        networkingGoals: exists
          ? prev.networkingGoals.filter((g) => g !== goal)
          : [...prev.networkingGoals, goal],
      };
    });
  };

  const validateStep = (step) => {
    setError("");
    if (step === 1) {
      if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
        setError("Please enter your full name, email, and password.");
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        setError("Please enter a valid email address.");
        return false;
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters.");
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return false;
      }
    }

    if (step === 2) {
      if (!formData.userType && !formData.role) {
        setError("Please select your identity (Alumni or Current Student) to continue.");
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 7));
    }
  };

  const handlePrevStep = () => {
    setError("");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(1)) return;

    setLoading(true);
    setError("");

    try {
      const res = await register(formData);
      if (res?.status === "PENDING" || res?.user?.status === "PENDING") {
        setSubmittedUser(res?.user || { name: formData.name, email: formData.email, userType: formData.userType });
        setSubmittedSuccess(true);
      } else {
        navigate("/login", {
          state: { message: "Registration successful! Please login to your GradConnect account." },
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submittedSuccess) {
    return (
      <div className="auth-container py-12 bg-alt min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="auth-card max-w-xl w-full mx-auto card-bg rounded-2xl border border-slate-200 p-8 shadow-xl text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-sm">
            <Clock size={32} />
          </div>

          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 mb-3 border border-amber-200">
            Pending Admin Approval
          </span>

          <h2 className="text-2xl font-black text-slate-900 mb-2">
            Registration Submitted Successfully
          </h2>

          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            Thank you for joining <strong>GradConnect</strong>,{" "}
            <span className="font-bold text-slate-900">{submittedUser?.name || formData.name}</span>!
            Your application for a <strong>{submittedUser?.userType || formData.userType}</strong> account has been safely registered and is waiting for administrator approval.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left mb-6 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>What happens next:</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-700">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">1</span>
              <span><strong>Verification:</strong> An administrator will review your campus credentials and affiliation.</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-700">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">2</span>
              <span><strong>Activation:</strong> Once approved, your account status will transition to <em>Active</em>.</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-700">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">3</span>
              <span><strong>Login:</strong> You can then log in with <strong>{submittedUser?.email || formData.email}</strong> to connect with alumni and students.</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/login"
              className="btn btn-primary px-6 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow"
            >
              <span>Go to Login Screen</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/"
              className="btn btn-secondary px-6 py-2.5 rounded-lg text-sm font-semibold border border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              <span>Back to Home</span>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="auth-container py-6 bg-alt min-h-screen">
      <div className="auth-card max-w-2xl mx-auto card-bg rounded-xl border p-6 shadow-md">
        <div className="auth-header text-center mb-4">
          <div className="auth-logo-badge mx-auto mb-2 p-3 rounded-circle bg-primary-gradient text-white">
            <GraduationCap size={32} />
          </div>
          <h2 className="auth-title text-2xl font-black text-dark">Join GradConnect</h2>
          <p className="auth-subtitle text-xs text-muted">
            Connect. Discover. Grow. — Multi-Step Professional Onboarding
          </p>
        </div>

        {/* Wizard Progress Bar */}
        <div className="wizard-progress-bar flex-between gap-1 mb-5 border-bottom pb-3">
          {STEP_LABELS.map((label, idx) => {
            const stepNum = idx + 1;
            const isActive = currentStep === stepNum;
            const isCompleted = currentStep > stepNum;

            return (
              <div
                key={label}
                onClick={() => isCompleted && setCurrentStep(stepNum)}
                className={`wizard-step-pill flex-1 text-center cursor-pointer transition ${
                  isActive
                    ? "font-bold text-primary border-bottom-2 border-primary"
                    : isCompleted
                    ? "text-emerald font-semibold"
                    : "text-muted"
                }`}
                style={{ fontSize: "0.7rem" }}
              >
                <div className="step-num text-xs mb-0.5">
                  {isCompleted ? "✓" : stepNum}
                </div>
                <span className="hidden md:inline">{label.split(" ")[1]}</span>
              </div>
            );
          })}
        </div>

        {error && <div className="alert alert-error mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <AnimatePresence mode="wait">
            {/* STEP 1: Account Credentials */}
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="step-content flex-column gap-3"
              >
                <h4 className="font-bold text-sm text-dark mb-1">Step 1: Account Credentials</h4>
                <div className="form-group">
                  <label className="font-semibold text-xs">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Swathi Sharma"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="font-semibold text-xs">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. swathi@example.com"
                    required
                  />
                </div>

                <div className="form-row-2col">
                  <div className="form-group">
                    <label className="font-semibold text-xs">Password *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min 6 characters"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="font-semibold text-xs">Confirm Password *</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter password"
                      required
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Identity */}
            {currentStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="step-content flex-column gap-3"
              >
                <h4 className="font-bold text-sm text-dark mb-1">Step 2: Choose Your Identity</h4>
                <p className="text-xs text-slate-500 mb-2">Select your current status on GradConnect (this will be displayed on your profile):</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setFormData((prev) => ({ ...prev, userType: "Alumni" }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setFormData((prev) => ({ ...prev, userType: "Alumni" }));
                      }
                    }}
                    style={{ pointerEvents: "auto", cursor: "pointer" }}
                    className={`identity-option-card p-5 rounded-2xl border-2 text-center transition-all relative select-none ${
                      formData.userType === "Alumni"
                        ? "border-red-600 bg-red-50/70 shadow-md ring-2 ring-red-500/20"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    {formData.userType === "Alumni" && (
                      <div className="absolute top-3 right-3 bg-red-600 text-white p-1 rounded-full shadow">
                        <Check size={14} />
                      </div>
                    )}
                    <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl flex-center ${formData.userType === "Alumni" ? "bg-red-600 text-white" : "bg-red-100 text-red-600"}`}>
                      <GraduationCap size={32} />
                    </div>
                    <h5 className="font-bold text-base text-dark mb-1">Alumni / Graduate</h5>
                    <p className="text-xs text-slate-500 leading-relaxed">Graduated and working in the professional industry.</p>
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setFormData((prev) => ({ ...prev, userType: "Current Student" }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setFormData((prev) => ({ ...prev, userType: "Current Student" }));
                      }
                    }}
                    style={{ pointerEvents: "auto", cursor: "pointer" }}
                    className={`identity-option-card p-5 rounded-2xl border-2 text-center transition-all relative select-none ${
                      formData.userType === "Current Student"
                        ? "border-blue-600 bg-blue-50/70 shadow-md ring-2 ring-blue-500/20"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    {formData.userType === "Current Student" && (
                      <div className="absolute top-3 right-3 bg-blue-600 text-white p-1 rounded-full shadow">
                        <Check size={14} />
                      </div>
                    )}
                    <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl flex-center ${formData.userType === "Current Student" ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-600"}`}>
                      <BookOpen size={32} />
                    </div>
                    <h5 className="font-bold text-base text-dark mb-1">Current Student</h5>
                    <p className="text-xs text-slate-500 leading-relaxed">Currently enrolled in college/university program.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Education */}
            {currentStep === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="step-content flex-column gap-3"
              >
                <h4 className="font-bold text-sm text-dark mb-1">Step 3: Academic Background</h4>
                <div className="form-group">
                  <label className="font-semibold text-xs">College / Institution</label>
                  <input
                    type="text"
                    name="college"
                    value={formData.college}
                    onChange={handleChange}
                    placeholder="e.g. GradConnect Central University"
                  />
                </div>

                <div className="form-row-2col">
                  <div className="form-group">
                    <label className="font-semibold text-xs">Department / Field</label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      placeholder="e.g. Computer Science & Engineering"
                    />
                  </div>

                  <div className="form-group">
                    <label className="font-semibold text-xs">Batch / Grad Year</label>
                    <input
                      type="text"
                      name="batch"
                      value={formData.batch}
                      onChange={handleChange}
                      placeholder="e.g. 2024"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Career */}
            {currentStep === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="step-content flex-column gap-3"
              >
                <h4 className="font-bold text-sm text-dark mb-1">Step 4: Professional Info &amp; Focus</h4>
                <div className="form-row-2col">
                  <div className="form-group">
                    <label className="font-semibold text-xs">Job Title / Target Focus</label>
                    <input
                      type="text"
                      name="jobTitle"
                      value={formData.jobTitle}
                      onChange={handleChange}
                      placeholder="e.g. Software Engineer"
                    />
                  </div>

                  <div className="form-group">
                    <label className="font-semibold text-xs">Company / Industry</label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      placeholder="e.g. Tech Corp / Fintech"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="font-semibold text-xs">Key Skills (comma separated)</label>
                  <input
                    type="text"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    placeholder="e.g. React, Node.js, Python, Leadership"
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 5: Profile & Links */}
            {currentStep === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="step-content flex-column gap-3"
              >
                <h4 className="font-bold text-sm text-dark mb-1">Step 5: Bio &amp; Online Links</h4>
                <div className="form-group">
                  <label className="font-semibold text-xs">Short Bio / Headline</label>
                  <input
                    type="text"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="e.g. Passionate web developer & open source enthusiast."
                  />
                </div>

                <div className="form-row-2col">
                  <div className="form-group">
                    <label className="font-semibold text-xs">LinkedIn Profile URL</label>
                    <input
                      type="text"
                      name="linkedIn"
                      value={formData.linkedIn}
                      onChange={handleChange}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>

                  <div className="form-group">
                    <label className="font-semibold text-xs">Portfolio / GitHub</label>
                    <input
                      type="text"
                      name="portfolio"
                      value={formData.portfolio}
                      onChange={handleChange}
                      placeholder="https://github.com/username"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 6: Interests */}
            {currentStep === 6 && (
              <motion.div
                key="step-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="step-content flex-column gap-3"
              >
                <h4 className="font-bold text-sm text-dark mb-1">Step 6: Select Professional Interests</h4>
                <div className="interests-chip-grid flex-wrap gap-2 flex">
                  {INTEREST_OPTIONS.map((interest) => {
                    const isSelected = formData.interests.includes(interest);

                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`btn btn-xs rounded-circle transition ${
                          isSelected ? "btn-primary" : "btn-secondary"
                        }`}
                      >
                        {isSelected && <Check size={12} />}
                        <span>{interest}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 7: Networking Preferences */}
            {currentStep === 7 && (
              <motion.div
                key="step-7"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="step-content flex-column gap-3"
              >
                <h4 className="font-bold text-sm text-dark mb-1">Step 7: Networking Goals</h4>
                <p className="text-xs text-muted mb-2">What would you like to use GradConnect for?</p>

                <div className="grid-2-col gap-2">
                  {GOAL_OPTIONS.map((goal) => {
                    const isSelected = formData.networkingGoals.includes(goal);

                    return (
                      <label
                        key={goal}
                        onClick={() => toggleGoal(goal)}
                        className={`checkbox-card p-2.5 rounded border text-xs font-semibold cursor-pointer flex-items-center gap-2 transition ${
                          isSelected ? "border-primary bg-primary-light text-primary" : "card-bg text-dark"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="hidden-checkbox"
                        />
                        <Check size={14} className={isSelected ? "opacity-100" : "opacity-0"} />
                        <span>{goal}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="form-group checkbox-group mt-2">
                  <label className="checkbox-label flex-items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      name="willingToMentor"
                      checked={formData.willingToMentor}
                      onChange={handleChange}
                    />
                    <span>Available to mentor students / offer career advice</span>
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="wizard-controls-bar flex-between gap-3 mt-5 pt-3 border-top">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="btn btn-secondary btn-sm"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
            ) : <div />}

            {currentStep < 7 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="btn btn-primary btn-sm"
              >
                <span>Continue</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-sm shadow-md"
                style={{ background: "linear-gradient(135deg, #dc2626, #2563eb)", border: "none" }}
              >
                {loading ? "Registering..." : "Complete Registration & Join"}
              </button>
            )}
          </div>
        </form>

        <div className="auth-footer text-center mt-4 pt-2 border-top">
          <p className="text-xs text-muted">
            Already have an account? <Link to="/login" className="text-primary font-bold">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
