# Security Policy

## Supported Versions

Currently, only the latest version of the Lung Nodule Follow-Up Decision Support Tool is supported.

| Version | Supported          |
|---------|--------------------|
| Latest  | :white_check_mark: |

## :memo: How to Use GitHub Security Advisories

We use **GitHub Security Advisories** for managing vulnerability reports privately.

### For Users: Reporting a Vulnerability

**Step 1: Go to Security Tab**
1. Navigate to: `https://github.com/[owner]/lungnodules/security/advisories`
2. Click **"Report a vulnerability"**
3. This creates a **private** advisory visible only to you and maintainers

**Step 2: Fill the Report Form**

Required fields:
- **Title:** Brief description of the vulnerability
- **Description:** Detailed explanation including:
  - Steps to reproduce
  - Impact assessment
  - Proof of concept (if applicable)
  - Suggested severity level

**Step 3: Submit Privately**
- The report is **NOT public**
- Only maintainers can see it
- You can track progress privately

### For Maintainers: Managing a Vulnerability Report

**When you receive a report:**

1. **Review and Acknowledge** (within 48 hours)
   - Confirm receipt to reporter
   - Ask clarifying questions if needed
   - Assess severity with reporter

2. **Fix and Validate**
   - Create fix in private branch if needed
   - Add tests for the vulnerability
   - Verify fix doesn't break existing functionality

3. **Coordinate Disclosure**
   - Agree on disclosure date with reporter
   - Prepare security advisory content
   - Coordinate with dependent projects if critical

4. **Publish Advisory**
   - Merge the fix
   - Publish the security advisory
   - GitHub automatically alerts dependents
   - Credit the reporter (if they wish)

**What GitHub Does Automatically:**
- ✅ Sends alerts to users of your repository
- ✅ Generates CVE numbers for eligible vulnerabilities
- ✅ Shows advisories in your repository's Security tab
- ✅ Includes advisories in Dependabot alerts

## Reporting a Vulnerability

The Lung Nodule Follow-Up Decision Support Tool team takes security seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please send an email to the repository maintainer:

**Email:** security@[repository-owner-email]

*(Note: Repository owner should update this with their actual email address)*

### What to Include

Please include as much of the following information in your report as possible:

- **Description**: A clear description of the vulnerability
- **Steps to Reproduce**: Detailed steps to reproduce the issue
- **Impact**: Assessment of the security impact and severity
- **Proof of Concept**: If possible, include a proof-of-concept or exploit code
- **Suggested Fix** (optional): Any suggestions for fixing the vulnerability

### What to Expect

- **Response Time**: We will acknowledge receipt of your report within **48 hours**
- **Resolution Timeline**: We aim to provide a detailed response with a fix timeline within **7 days**
- **Coordination**: We will work with you to understand and validate the issue
- **Disclosure**: We will disclose the vulnerability once it is fixed, giving credit to you (if desired)

### Security Guarantees

- :white_check_mark: We will respond to your report within 48 hours
- :white_check_mark: We will handle your report with strict confidentiality
- :white_check_mark: We will work with you on a fix timeline before public disclosure
- :white_check_mark: We will credit you for the discovery (if you wish)

## Security Best Practices

### For Users

This application follows these security best practices:

1. **No Data Collection**
   - No Personally Identifiable Information (PII) is collected
   - No data is stored server-side
   - All processing happens client-side

2. **Secure Communication**
   - All connections use HTTPS (enforced by Vercel)
   - Strict Transport Security headers enabled
   - Content Security Policy configured

3. **No Third-Party Tracking**
   - No third-party analytics or tracking services
   - No external dependencies that could compromise privacy

4. **Code Integrity**
   - Open source code available for audit
   - Dependencies regularly updated
   - Automated security scanning enabled

### For Developers

If you fork or contribute to this project, please follow these security practices:

1. **Dependencies**
   ```bash
   # Regularly audit dependencies
   npm audit
   npm audit fix

   # Keep dependencies updated
   npm update
   ```

2. **Pre-commit Hooks** (Recommended)
   - Run linter before commits
   - Run tests before pushing
   - Check for sensitive data in staged files

3. **Environment Variables**
   - Never commit `.env` files
   - Use `.env.example` as a template
   - Document required environment variables

4. **Code Review**
   - All code changes should be reviewed
   - Security-sensitive changes require additional review

## Security Features

### Implemented Security Measures

| Feature | Status | Description |
|---------|--------|-------------|
| **HTTPS Enforcement** | :white_check_mark: Enabled | All traffic encrypted via TLS |
| **Content Security Policy** | :white_check_mark: Enabled | Restricts resource loading sources |
| **X-Frame-Options** | :white_check_mark: DENY | Prevents clickjacking attacks |
| **X-Content-Type-Options** | :white_check_mark: nosniff | Prevents MIME-sniffing |
| **X-XSS-Protection** | :white_check_mark: Enabled | XSS filtering in browsers |
| **Referrer-Policy** | :white_check_mark: strict-origin-when-cross-origin | Controls referrer information |
| **Permissions-Policy** | :white_check_mark: Configured | Restricts browser features |
| **Strict-Transport-Security** | :white_check_mark: Enabled | Enforces HTTPS connections |
| **No Server-Side Storage** | :white_check_mark: N/A | Client-side only architecture |
| **No PII Collection** | :white_check_mark: Enforced | No personal data collected |

### Private Data Handling

This application is designed with privacy in mind:

- :lock: **No user authentication required**
- :lock: **No data persistence**
- :lock: **No cookies or local storage for sensitive data**
- :lock: **No third-party services or APIs**
- :lock: **All calculations performed locally in browser**

## Severity Classification

We use the following severity classification for vulnerabilities:

| Severity | Description | Example |
|----------|-------------|---------|
| **Critical** | High risk to patient safety or data | Incorrect medical recommendations, data exposure |
| **High** | Significant security impact | XSS attacks, CSRF vulnerabilities |
| **Medium** | Moderate security impact | Information disclosure, minor bypasses |
| **Low** | Minor security issues | Best practice violations, informational issues |

## Related Documentation

- [Medical Disclaimer](MEDICAL_DISCLAIMER.md) - Important information about medical decision support
- [Privacy Policy](#) - How we handle user data (N/A - no data collected)
- [Contributing Guidelines](CONTRIBUTING.md) - Security considerations for contributors

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Content Security Policy Level 3](https://w3c.github.io/webappsec-csp/)

---

**Last Updated:** January 2026

For questions about this security policy, please contact the repository maintainers.
