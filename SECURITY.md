# Security Policy

## Supported Versions

We actively support the following versions of LanguagePeer:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability in LanguagePeer, please report it responsibly.

### How to Report

1. **Do NOT** create a public GitHub issue for security vulnerabilities
2. Email us at: security@languagepeer.com (or create a private issue)
3. Include the following information:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: We'll acknowledge receipt within 48 hours
- **Assessment**: We'll assess the vulnerability within 5 business days
- **Updates**: We'll provide regular updates on our progress
- **Resolution**: We aim to resolve critical vulnerabilities within 30 days

### AWS Security Considerations

Since LanguagePeer uses AWS services, please also consider:

- **IAM Permissions**: Report overly permissive roles or policies
- **Data Encryption**: Issues with encryption at rest or in transit
- **API Security**: Authentication or authorization bypasses
- **Voice Data**: Privacy concerns with audio processing

### Responsible Disclosure

We follow responsible disclosure practices:

1. We'll work with you to understand and resolve the issue
2. We'll credit you in our security advisory (if desired)
3. We ask that you don't publicly disclose until we've had a chance to fix it

### Security Best Practices

For users deploying LanguagePeer:

- Use least-privilege IAM policies
- Enable AWS CloudTrail logging
- Regularly rotate AWS credentials
- Monitor AWS costs for unusual activity
- Keep dependencies updated

Thank you for helping keep LanguagePeer secure! 🔒