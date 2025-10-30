# Deployment Guide

This document describes the automated deployment system for FI Calc.

## 🚀 Automatic Deployment

Every push to `main` or `claude/*` branches triggers automatic deployment to GitHub Pages.

**Live URL:** https://colindacity.github.io/ficalc/

## 📊 CI/CD Pipeline

### Pipeline Flow

```
Push Code
    ↓
┌─────────────────┐
│  Test Stage     │
│  - Type check   │
│  - Unit tests   │
│  - Coverage     │
└────────┬────────┘
         ↓
┌─────────────────┐
│  Build Stage    │
│  - Retry 3x     │
│  - Verify dist  │
└────────┬────────┘
         ↓
┌─────────────────┐
│  Deploy Stage   │
│  - Retry 3x     │
│  - Backoff 30s  │
└────────┬────────┘
         ↓
┌─────────────────┐
│  Verify Stage   │
│  - Health check │
│  - Smoke tests  │
│  - Content test │
└─────────────────┘
```

## 🔄 Auto-Retry Logic

### Build Failures

**3 automatic retry attempts:**

1. **Attempt 1:** Standard build
2. **Attempt 2:** Clean Vite cache + rebuild
   ```bash
   rm -rf dist node_modules/.vite
   npm run build
   ```
3. **Attempt 3:** Full clean + rebuild
   ```bash
   rm -rf dist node_modules
   npm ci
   npm run build
   ```

### Deployment Failures

**3 automatic retry attempts with exponential backoff:**

1. **Attempt 1:** Immediate deployment
2. **Attempt 2:** Wait 30s, retry
3. **Attempt 3:** Wait 60s, final retry

## ✅ Verification System

### Health Checks (3 attempts)

After deployment, the system verifies:

```bash
# 1. HTTP Status Check
curl -I https://colindacity.github.io/ficalc/
# Expected: 200 OK

# 2. Content Verification
curl https://colindacity.github.io/ficalc/ | grep "FI Calc"
# Expected: Title present

# 3. Resource Validation
# - CSS files loaded
# - JavaScript files loaded
# - Response time < 5s
```

### Smoke Tests

- **CSS Detection:** Validates stylesheet presence
- **JavaScript Detection:** Validates script tags
- **Response Time:** Measures and alerts if > 5s
- **Content Integrity:** Checks for critical page elements

## 📡 Continuous Monitoring

### Monitor Workflow

Runs **every 15 minutes** to check:

- ✅ Site availability (HTTP 200)
- ✅ Response time
- ✅ Content integrity
- ✅ Critical resources

**If site is down:**
- ❌ Health check fails
- 🎫 Auto-creates GitHub issue with "deployment-failure" label
- 📧 GitHub sends notification to repository watchers

### Manual Monitoring

```bash
# Check site status
curl -I https://colindacity.github.io/ficalc/

# Check response time
time curl -s https://colindacity.github.io/ficalc/ > /dev/null

# Check content
curl -s https://colindacity.github.io/ficalc/ | grep "FI Calc"
```

## 🔙 Rollback Procedure

### Automatic Rollback (via GitHub Actions)

1. Go to **Actions** tab
2. Select **"Rollback Deployment"** workflow
3. Click **"Run workflow"**
4. Options:
   - Leave empty: Rollback to previous commit (HEAD~1)
   - Specify commit SHA: Rollback to specific version
5. Click **"Run workflow"**

The workflow will:
- ✅ Checkout target version
- ✅ Build the rollback version
- ✅ Verify the build
- ✅ Deploy to GitHub Pages
- ✅ Verify rollback deployment

### Manual Rollback (local)

```bash
# Identify the good commit
git log --oneline -10

# Checkout that commit
git checkout <commit-sha>

# Build and deploy manually
npm install
npm run build

# Push to trigger deployment
git push origin HEAD:main --force
```

## 📋 Deployment Checklist

Before merging to main:

- [ ] All tests pass locally (`npm test`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] Type checking passes (`npx tsc --noEmit`)
- [ ] CI/CD pipeline is green
- [ ] Review deployment logs in Actions tab

After deployment:

- [ ] Check GitHub Actions for successful deployment
- [ ] Verify site is accessible: https://colindacity.github.io/ficalc/
- [ ] Test basic functionality in browser
- [ ] Check browser console for errors
- [ ] Monitor for 15 minutes (next health check)

## 🔍 Debugging Failed Deployments

### Step 1: Check Actions Logs

1. Go to **Actions** tab
2. Click on failed workflow
3. Expand failed steps
4. Look for error messages

### Step 2: Common Issues

**Build Failures:**
- TypeScript errors → Run `npx tsc --noEmit` locally
- Missing dependencies → Run `npm ci`
- Test failures → Run `npm test` locally

**Deployment Failures:**
- GitHub Pages not enabled → Settings > Pages > Source: GitHub Actions
- Permissions issue → Check repository permissions
- Branch protection → Check if main branch has restrictions

**Health Check Failures:**
- DNS propagation delay → Wait 5-10 minutes
- CDN cache → Try incognito/private browsing
- Network issues → Check GitHub Status page

### Step 3: Manual Verification

```bash
# Clone and test locally
git clone https://github.com/colindacity/ficalc.git
cd ficalc
git checkout <failed-commit>
npm install
npm run build
npm run preview

# Open http://localhost:4173 and test
```

### Step 4: Rollback if Needed

If issue persists:
1. Use rollback workflow (see above)
2. Fix issue in new commit
3. Test thoroughly before deploying again

## 📊 Monitoring Dashboards

**GitHub Actions:**
- https://github.com/colindacity/ficalc/actions

**Deployment History:**
- https://github.com/colindacity/ficalc/deployments

**Coverage Reports:**
- https://codecov.io/gh/colindacity/ficalc

## 🚨 Alerts & Notifications

**Automatic Alerts:**
- ❌ Deployment failure → GitHub notification
- ❌ Health check failure → GitHub issue created
- ⚠️  Slow response time → Warning in logs

**Manual Alerts:**
- Watch repository for notifications
- Enable GitHub mobile app for instant alerts
- Subscribe to specific workflows

## 🔐 Security

**Deployment Permissions:**
- Only `main` and `claude/*` branches can deploy
- GitHub Actions requires `pages: write` permission
- Deployments require approval for production environment

**Secrets Management:**
- No secrets needed for basic deployment
- Codecov token stored in repository secrets
- GitHub token provided automatically by Actions

## 📈 Performance Metrics

**Expected Metrics:**
- Build time: 1-2 minutes
- Deployment time: 30-60 seconds
- CDN propagation: 30-120 seconds
- Total pipeline: 3-5 minutes

**Response Time Thresholds:**
- ✅ Excellent: < 1s
- ✅ Good: 1-3s
- ⚠️  Acceptable: 3-5s
- ❌ Slow: > 5s

## 🛠️ Maintenance

**Regular Tasks:**
- Review failed deployments weekly
- Close resolved deployment-failure issues
- Update dependencies monthly
- Review and optimize build process quarterly

**Annual Tasks:**
- Update Node.js version in workflows
- Review and update GitHub Actions versions
- Audit and optimize deployment process

## 💡 Best Practices

1. **Always test locally before pushing**
2. **Monitor Actions tab after pushing**
3. **Wait for verification before sharing link**
4. **Use rollback workflow for quick recovery**
5. **Document any manual interventions**
6. **Keep main branch stable**

## 🆘 Getting Help

**Issues:**
- Open GitHub issue with label "deployment"
- Include Actions run ID
- Attach relevant logs

**Questions:**
- Check GitHub Discussions
- Review deployment logs
- Consult this guide

## 📚 Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vite Build Documentation](https://vitejs.dev/guide/build.html)
- [Repository README](./README.md)
