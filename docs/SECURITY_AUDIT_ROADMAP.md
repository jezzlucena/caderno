# Security Audit Roadmap

Project Caderno is committed to transparency and security. This document outlines our roadmap toward a comprehensive third-party security audit by a recognized firm such as Trail of Bits, Cure53, NCC Group, or Least Authority.

## Why a Security Audit?

Project Caderno serves journalists, whistleblowers, activists, and survivors who face real threats. Our users trust us with their most sensitive thoughts and evidence. A formal third-party audit:

- Independently verifies our cryptographic implementations
- Identifies vulnerabilities we may have missed
- Builds credibility with security-conscious users
- Demonstrates accountability to our mission

## Current Security Posture

### Implemented

- **End-to-end encryption** using AES-256-GCM for journal entries
- **Client-side key derivation** using PBKDF2 (password never leaves device)
- **Zero-knowledge architecture** (server cannot read encrypted content)
- **Secure authentication** with JWT tokens and bcrypt password hashing
- **HTTPS enforcement** for all communications

### In Progress

- Comprehensive threat modeling documentation
- Security-focused code review process
- Dependency vulnerability monitoring

## Roadmap Phases

### Phase 1: Internal Preparation

**Goal:** Ensure codebase meets baseline security standards

- [ ] Document all cryptographic primitives and their usage
- [ ] Complete threat model covering:
  - Protected assets (journals, keys, metadata)
  - Threat actors (nation-states, hackers, malicious operators)
  - Attack vectors (network, client, server, social engineering)
- [ ] Implement automated security scanning in CI/CD
- [ ] Achieve 80%+ test coverage on security-critical code
- [ ] Internal security review using OWASP guidelines

### Phase 2: Pre-Audit Hardening

**Goal:** Address known issues before engaging auditors

- [ ] Remediate findings from internal review
- [ ] Code freeze on security-critical components
- [ ] Prepare architecture documentation:
  - Data flow diagrams
  - Key management lifecycle
  - Authentication flows
  - Dead man's switch mechanism
- [ ] Set up responsible disclosure policy

### Phase 3: Audit Engagement

**Goal:** Complete professional security audit

**Target Firms:**
| Firm | Specialization |
|------|----------------|
| Trail of Bits | Cryptography, systems security |
| Cure53 | Web security, cryptographic protocols |
| NCC Group | Application security, cryptography |
| Least Authority | Privacy tools, cryptographic systems |

**Audit Scope:**
- Client-side encryption implementation
- Key derivation and management
- Authentication and session handling
- Dead man's switch mechanism
- Server API security
- Federation protocol security

### Phase 4: Remediation

**Goal:** Address all audit findings

- Categorize findings by severity (Critical/High/Medium/Low)
- Critical/High: Fix immediately before any release
- Medium: Address within 30 days
- Low: Address in subsequent releases
- Request re-verification of critical fixes

### Phase 5: Public Disclosure

**Goal:** Maintain transparency with our community

- Publish complete audit report (unredacted)
- Document our responses and fixes
- Blog post summarizing findings and improvements
- Update security documentation

## Timeline

| Phase | Status |
|-------|--------|
| Phase 1: Internal Preparation | In Progress |
| Phase 2: Pre-Audit Hardening | Planned |
| Phase 3: Audit Engagement | Planned |
| Phase 4: Remediation | Planned |
| Phase 5: Public Disclosure | Planned |

## Ongoing Commitment

Security is not a one-time effort. After the initial audit, we commit to:

- **Annual security reviews** of major features
- **Continuous dependency monitoring** and updates
- **Bug bounty program** for community researchers
- **Transparent disclosure** of any security incidents
- **Regular updates** to this roadmap

## Get Involved

If you're a security researcher interested in reviewing Project Caderno:

- Review our open-source code on GitHub
- Report vulnerabilities through our responsible disclosure process
- Join the discussion on security improvements

---

*This document reflects our commitment to building software that journalists and activists can trust with their lives. We believe security through transparency is the only path forward.*
