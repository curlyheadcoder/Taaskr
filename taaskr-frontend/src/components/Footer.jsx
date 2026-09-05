import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Sparkles, Phone, Mail, MapPin, 
  ArrowUpRight, Star, Heart, CheckCircle2, Award
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="taaskr-footer" style={{
      backgroundColor: 'var(--bg-card)',
      borderTop: '1px solid var(--border-light)',
      marginTop: 'auto',
      paddingTop: '3.5rem',
      paddingBottom: '2.5rem',
      color: 'var(--text-secondary)',
      fontSize: '0.875rem',
      position: 'relative',
      zIndex: 10
    }}>
      <div className="app-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        
        {/* Top Brand & Value Proposition Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          paddingBottom: '2.5rem',
          borderBottom: '1px solid var(--border-light)',
          marginBottom: '3rem'
        }}>
          <div>
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 50%, #4F46E5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: '1.25rem',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
              }}>
                T
              </div>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
                Taaskr
              </span>
            </Link>
            <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              India's trusted on-demand home maintenance & emergency logistics marketplace.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem' }}>
              <ShieldCheck size={18} color="var(--success)" />
              <span>100% Background Verified</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem' }}>
              <Award size={18} color="#f59e0b" />
              <span>Upfront Transparent Pricing</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem' }}>
              <CheckCircle2 size={18} color="#38bdf8" />
              <span>Dedicated Partner Insurance</span>
            </div>
          </div>
        </div>

        {/* 4 Main Urban Company-Style Navigation Columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '2.5rem',
          marginBottom: '3.5rem'
        }}>
          {/* Column 1: Company */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.2rem', letterSpacing: '-0.01em' }}>
              Company
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li>
                <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s ease' }} className="footer-link">
                  About us
                </Link>
              </li>
              <li>
                <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s ease' }} className="footer-link">
                  Investor Relations
                </Link>
              </li>
              <li>
                <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s ease' }} className="footer-link">
                  Terms & conditions
                </Link>
              </li>
              <li>
                <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s ease' }} className="footer-link">
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s ease' }} className="footer-link">
                  Anti-discrimination policy
                </Link>
              </li>
              <li>
                <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s ease' }} className="footer-link">
                  Careers & Hiring <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 700, marginLeft: '0.3rem' }}>HIRING</span>
                </Link>
              </li>
              <li>
                <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s ease' }} className="footer-link">
                  ESG & Sustainability Report
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: For Customers */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.2rem', letterSpacing: '-0.01em' }}>
              For customers
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li>
                <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }} className="footer-link">
                  Taaskr reviews (4.8 ★ / 50k+ reviews)
                </Link>
              </li>
              <li>
                <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }} className="footer-link">
                  Categories near you
                </Link>
              </li>
              <li>
                <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }} className="footer-link">
                  Emergency AC & Electrical Repairs
                </Link>
              </li>
              <li>
                <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }} className="footer-link">
                  Safety & Damage Protection Plan
                </Link>
              </li>
              <li>
                <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }} className="footer-link">
                  Help Center & Dispute Resolution
                </Link>
              </li>
              <li>
                <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }} className="footer-link">
                  Contact us
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: For Professionals */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.2rem', letterSpacing: '-0.01em' }}>
              For professionals
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li>
                <Link to="/register?role=PROVIDER" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }} className="footer-link">
                  Register as a professional ⚡
                </Link>
              </li>
              <li>
                <Link to="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }} className="footer-link">
                  Partner Console Login
                </Link>
              </li>
              <li>
                <Link to="/register?role=PROVIDER" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }} className="footer-link">
                  Skill Certification & ITI Verification
                </Link>
              </li>
              <li>
                <Link to="/register?role=PROVIDER" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }} className="footer-link">
                  Weekly Instant Payouts Guarantee
                </Link>
              </li>
              <li>
                <Link to="/register?role=PROVIDER" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }} className="footer-link">
                  Partner Insurance & Safety Benefits
                </Link>
              </li>
              <li>
                <Link to="/register?role=PROVIDER" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }} className="footer-link">
                  Partner Code of Conduct
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Social Links & App Download */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.2rem', letterSpacing: '-0.01em' }}>
              Social links
            </h4>

            {/* Social Media Circular Buttons */}
            <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
              {/* X / Twitter */}
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="social-icon-btn"
                title="X / Twitter"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              {/* Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="social-icon-btn"
                title="Facebook"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="social-icon-btn"
                title="Instagram"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="social-icon-btn"
                title="LinkedIn"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.762-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>

            {/* App Store Download Badges */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {/* App Store */}
              <a
                href="#download-app"
                onClick={(e) => e.preventDefault()}
                className="app-badge-btn"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.4c.66-.82 1.11-1.96.99-3.1-.96.04-2.12.64-2.8 1.44-.6.69-1.12 1.83-.98 2.94 1.08.08 2.18-.54 2.79-1.28z"/>
                </svg>
                <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                  <div style={{ fontSize: '0.625rem', textTransform: 'uppercase', opacity: 0.8 }}>Download on the</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>App Store</div>
                </div>
              </a>

              {/* Google Play */}
              <a
                href="#download-app"
                onClick={(e) => e.preventDefault()}
                className="app-badge-btn"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186c-.37-.367-.61-.884-.61-1.46V3.274c0-.576.24-1.093.609-1.46zm11.24 11.24l2.585 2.586-12.82 7.373 10.235-9.959zm0-2.108L4.614 1.026l12.82 7.373-2.585 2.547zm1.447 1.054l3.967 2.285c.928.533.928 1.407 0 1.94l-3.967 2.285-2.274-2.255 2.274-2.255z"/>
                </svg>
                <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                  <div style={{ fontSize: '0.625rem', textTransform: 'uppercase', opacity: 0.8 }}>GET IT ON</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Google Play</div>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Copyright Notice */}
        <div style={{
          borderTop: '1px solid var(--border-light)',
          paddingTop: '1.75rem',
          fontSize: '0.775rem',
          color: 'var(--text-muted)',
          lineHeight: 1.6
        }}>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            * As on 2026. All service professionals on Taaskr undergo multi-point background verification, Aadhaar identity check, and skill qualification testing.
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginTop: '0.75rem'
          }}>
            <div>
              © Copyright 2026 Taaskr Technologies India Limited (formerly Taaskr App & Logistics Private Limited). All rights reserved | CIN: U74140MP2026PTC012345
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <span>Indore (HQ)</span>
              <span>•</span>
              <span>Bhopal</span>
              <span>•</span>
              <span>Ujjain</span>
              <span>•</span>
              <span>Gwalior</span>
              <span>•</span>
              <span>Jabalpur</span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
