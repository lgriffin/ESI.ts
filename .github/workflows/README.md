# 🚀 GitHub Actions Workflows

This directory contains automated CI/CD workflows for the ESI.ts project.

## 📋 Workflow Overview

### 🔄 Main CI/CD Pipeline (`ci.yml`)
**Triggers:** Push to `main`/`develop`, Pull Requests
- **Lint & Build** - Code quality and compilation checks
- **Unit Tests** - Comprehensive unit test suite across Node.js versions
- **BDD Tests** - Behavior-driven development scenarios
- **Full Test Suite** - Complete test coverage analysis
- **Documentation** - Auto-generate and deploy docs
- **Security Audit** - Vulnerability scanning
- **Performance Tests** - Performance benchmarking
- **Quality Gate** - Overall validation checkpoint

### 🚀 Release Pipeline (`release.yml`)
**Triggers:** Git tags (`v*.*.*`), GitHub releases
- **Validate Release** - Pre-release validation
- **Publish to NPM** - Automated package publishing
- **Deploy Documentation** - Release documentation deployment
- **Create Assets** - Generate release artifacts
- **Success Notifications** - Release completion alerts

### 🔍 Pull Request Validation (`pr-validation.yml`)
**Triggers:** Pull request events
- **PR Information** - Metadata collection and analysis
- **Fast Validation** - Quick lint and build checks
- **Test Impact Analysis** - Smart test execution based on changes
- **Comprehensive Testing** - Full test suite for critical changes
- **Security & Quality** - Security audit and coverage analysis
- **Validation Summary** - Overall PR health report

### 🔧 Maintenance & Security (`maintenance.yml`)
**Triggers:** Weekly schedule (Mondays 9 AM UTC), Manual dispatch
- **Dependency Updates** - Package freshness monitoring
- **Security Audit** - Regular vulnerability scanning
- **Code Quality** - Automated quality assessments
- **Health Check** - System health monitoring
- **Maintenance Summary** - Weekly maintenance reports

## 🎯 Workflow Features

### ✅ **Comprehensive Testing**
- Unit tests across multiple Node.js versions (18, 20, 21)
- BDD scenarios for behavior validation
- Performance benchmarking
- Security vulnerability scanning

### 📊 **Quality Assurance**
- ESLint code quality checks
- Test coverage reporting
- Build validation across environments
- Automated dependency auditing

### 🚀 **Automated Deployment**
- NPM package publishing on releases
- GitHub Pages documentation deployment
- Release asset creation and attachment
- Version-aware documentation updates

### 🔒 **Security & Maintenance**
- Weekly dependency health checks
- Automated security vulnerability detection
- Code quality trend monitoring
- Maintenance task scheduling

## 📈 **Workflow Status Badges**

Add these badges to your README.md:

\`\`\`markdown
[![CI/CD Pipeline](https://github.com/lgriffin/ESI.ts/actions/workflows/ci.yml/badge.svg)](https://github.com/lgriffin/ESI.ts/actions/workflows/ci.yml)
[![Release Pipeline](https://github.com/lgriffin/ESI.ts/actions/workflows/release.yml/badge.svg)](https://github.com/lgriffin/ESI.ts/actions/workflows/release.yml)
[![PR Validation](https://github.com/lgriffin/ESI.ts/actions/workflows/pr-validation.yml/badge.svg)](https://github.com/lgriffin/ESI.ts/actions/workflows/pr-validation.yml)
[![Maintenance](https://github.com/lgriffin/ESI.ts/actions/workflows/maintenance.yml/badge.svg)](https://github.com/lgriffin/ESI.ts/actions/workflows/maintenance.yml)
\`\`\`

## 🔧 **Required Secrets**

To enable all workflow features, add these secrets to your GitHub repository:

### NPM Publishing
- `NPM_TOKEN` - NPM authentication token for package publishing

### Optional Enhancements
- `SLACK_WEBHOOK` - For Slack notifications (if desired)
- `DISCORD_WEBHOOK` - For Discord notifications (if desired)

## 📚 **Workflow Artifacts**

Each workflow generates useful artifacts:

- **Test Results** - Coverage reports and test outputs
- **Build Artifacts** - Compiled distribution files
- **Documentation** - Generated API documentation
- **Security Reports** - Vulnerability scan results
- **Quality Reports** - Code quality assessments

## 🎯 **Next Steps**

1. **Enable GitHub Pages** in repository settings for documentation deployment
2. **Add NPM_TOKEN secret** for automated package publishing
3. **Configure branch protection** rules to require workflow success
4. **Customize CNAME** in release.yml for custom documentation domain
5. **Review and adjust** workflow schedules based on your needs

## 🤝 **Contributing**

When modifying workflows:
1. Test changes in a fork first
2. Update this README with any new features
3. Ensure all secrets and permissions are documented
4. Consider backward compatibility with existing processes

---

*These workflows provide enterprise-grade CI/CD automation for the ESI.ts project, ensuring code quality, security, and reliable deployments.*
