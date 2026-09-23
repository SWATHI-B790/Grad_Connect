import React from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Users, ShieldCheck } from "lucide-react";

const Footer = () => {
  return (
    <footer className="public-footer">
      <div className="footer-container">
        {/* Brand Column */}
        <div className="footer-col brand-col">
          <div className="footer-brand">
            <div className="footer-logo-icon-box">
              <GraduationCap size={20} className="footer-logo-icon" />
            </div>
            <span className="footer-logo-text">GradConnect</span>
          </div>
          <p className="footer-description">
            The dedicated professional networking platform bridging graduates, students, and alumni. Mentorship, career mobility, and verified alumni intelligence.
          </p>
          <div className="emergency-callout">
            <Users size={18} className="phone-icon" />
            <div>
              <span className="callout-label">Official Alumni Community</span>
              <strong className="callout-number">Connect. Discover. Grow.</strong>
            </div>
          </div>
        </div>

        {/* Career Hub Column */}
        <div className="footer-col">
          <h4 className="footer-title">Career Hub</h4>
          <ul className="footer-links">
            <li><Link to="/domains?category=Career%20Advice">Career Advice &amp; Tips</Link></li>
            <li><Link to="/jobs">Job Opportunities</Link></li>
            <li><Link to="/domains?category=Internship">Internship Listings</Link></li>
            <li><Link to="/events">Networking Events</Link></li>
            <li><Link to="/blogs">Alumni Insights &amp; Articles</Link></li>
          </ul>
        </div>

        {/* Platform Column */}
        <div className="footer-col">
          <h4 className="footer-title">Platform</h4>
          <ul className="footer-links">
            <li><Link to="/">Home Portal</Link></li>
            <li><Link to="/people">Discover Alumni</Link></li>
            <li><Link to="/profile">My Member Profile</Link></li>
            <li><Link to="/domains">Career Domains</Link></li>
            <li><Link to="/register">Create Free Account</Link></li>
            <li><Link to="/notifications">Community Alerts</Link></li>
          </ul>
        </div>

        {/* About GradConnect Column */}
        <div className="footer-col">
          <h4 className="footer-title">About GradConnect</h4>
          <p className="disclaimer-text">
            Empowering students and alumni worldwide to build lifelong professional relationships, share career milestones, and mentor the next generation of industry leaders.
          </p>
          <div className="footer-status-pill">
            <ShieldCheck size={14} className="status-shield-icon" />
            <span>Campus Network Active &amp; Verified</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <div className="footer-copyright">
            &copy; {new Date().getFullYear()} GradConnect Platform. All rights reserved.
          </div>
          <div className="footer-bottom-links">
            <span className="footer-credit">
              Built for Students &amp; Alumni Worldwide &bull; Official Campus Network
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
