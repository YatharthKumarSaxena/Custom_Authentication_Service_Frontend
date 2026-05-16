# Custom Authentication Service - Dashboard

A professional, secure account management dashboard with real-time 2FA synchronization, health scoring, and comprehensive account controls.

## 🎯 Features

### Dashboard
- **Account Information** - Display user profile with 2-row × 3-column layout
  - Row 1: Name, Email, Phone
  - Row 2: User ID, Status, Email Verified
- **Account Health Score** - Security scoring system (0-100)
  - Email Verified: +20 points
  - 2FA Enabled: +30 points
  - Account Status: +35 points
  - Last Login: +15 points
- **Real-time 2FA Sync** - Instant updates across tabs/windows
- **Account Stats** - Active sessions and last login tracking
- **Quick Actions** - Easy navigation to Sessions, Auth Logs, Settings

### Settings
- **Profile Management** - Update first name, email, phone, country
- **2FA Toggle** - Enable/disable two-factor authentication with password verification
- **Password Management** - Change account password securely
- **Account Deactivation** - Permanently close account
- **Security Headers** - Professional tab interface

### Authentication
- **Login** - Email/password verification
- **OTP** - One-time password verification
- **Signup** - New account registration
- **Password Reset** - Forgot password flow
- **Account Activation** - Email-based account activation

### Monitoring
- **Active Sessions** - View all active login sessions
- **Auth Logs** - Comprehensive authentication history
- **Security Indicators** - Visual status of security features

## 🛠 Tech Stack

- **Frontend**: Vanilla HTML, CSS3, JavaScript (ES6+)
- **Icons**: Google Material Icons (1600+ icons)
- **Animations**: CSS3 Keyframes (smooth transitions)
- **Communication**: postMessage API, localStorage
- **Backend**: RESTful API (Node.js/Express based)
- **API Base**: `http://localhost:8080/custom-auth-service/api/v1`

## 📁 Project Structure

```
PROJECT/
├── configs/
│   ├── field-length.config.js
│   ├── regex.config.js
│   └── uri.configs.js
├── project/
│   ├── app/
│   │   ├── dashboard.html        # Main dashboard
│   │   ├── dashboard.js          # Dashboard logic
│   │   ├── settings.html         # Settings page
│   │   ├── settings.js           # Settings logic
│   │   ├── sessions.html         # Active sessions
│   │   └── auth-logs.html        # Auth history
│   ├── auth/                     # Authentication pages
│   │   ├── login.html
│   │   ├── signup.html
│   │   ├── otp.html
│   │   ├── password.html
│   │   ├── reset-success.html
│   │   ├── activate.html
│   │   └── *.css / *.js
│   ├── dashboard.css             # Dashboard styling
│   ├── style.css                 # Global styles
│   ├── index.html                # Entry point
│   └── main.js                   # Global initialization
└── README.md
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js & backend API running on `http://localhost:8080`
- Modern browser (Chrome, Firefox, Edge, Safari)
- Internet connection for Google Fonts & Material Icons

### Installation

1. **Clone/Open Project**
   ```bash
   cd c:/Users/navne/OneDrive/Desktop/PROJECT
   ```

2. **Start Backend API**
   ```bash
   # Make sure backend is running on localhost:8080
   npm start  # or your backend start command
   ```

3. **Open Dashboard**
   - Option A: Open `project/index.html` in browser
   - Option B: Use live server
     ```bash
     # Using Python
     python -m http.server 3000
     # Then navigate to http://localhost:3000/project
     ```

4. **Login**
   - Navigate to login page
   - Enter credentials
   - Complete 2FA verification if enabled

## 📡 Backend API Endpoints

All endpoints require authentication token in `Authorization: Bearer {token}` header.

### Account Management
- **GET** `/auth/me` - Fetch current account details
- **PATCH** `/account/update-details` - Update profile (firstName, email, countryCode, localNumber)
- **POST** `/account/change-password` - Change account password
- **POST** `/account/deactivate` - Deactivate account
- **POST** `/account/enable-2fa` - Enable 2FA (requires password)
- **POST** `/account/disable-2fa` - Disable 2FA (requires password)

### Monitoring
- **GET** `/auth/active-sessions` - List all active sessions

### Response Format
Backend returns data with **Title Case keys** and **string boolean values**:
```json
{
  "First Name": "John",
  "Email": "john@example.com",
  "Phone": "+91-9876543210",
  "User ID": "user_123",
  "Account Status": "Activated",
  "Email Verified": "Yes",
  "2FA Enabled": "Yes",
  "Account Created At": "2024-01-15T10:30:00Z",
  "Last Login At": "2026-03-17T14:25:00Z"
}
```

## 🔒 Security Features

### 2FA Synchronization
- Real-time updates across browser tabs
- postMessage API for cross-window communication
- localStorage caching with 2-minute expiry
- Automatic refresh on status changes

### Frontend Fallbacks
- **2FA Caching**: If backend bug returns "No" but local cache says "Yes" (< 2 min old), use cache
- **Key Name Variants**: Check both `Email Verified` and `isEmailVerified` keys
- **Session Validation**: Check session after email/phone updates (may trigger logout)

### Password & Data Protection
- Email/phone changes trigger automatic logout (security feature)
- All sensitive operations require password verification
- Secure CORS and credential handling

## 🎨 Design System

### Colors
- **Primary**: #667eea (Indigo)
- **Secondary**: #f093fb (Pink)
- **Background**: #0f172a (Dark Navy)
- **Success**: #22c55e (Green)
- **Warning**: #fbbf24 (Amber)
- **Error**: #ef4444 (Red)

### Animations
- **slideUpFade**: Element slides up with fade
- **slideDownFade**: Element slides down with fade
- **fadeInScale**: Element scales in and fades
- **scoreGlow**: Glow effect on score updates
- **scoreScale**: Scale animation for score

### Typography
- **Font**: Inter (system fallback included)
- **Sizes**: 12px (label) → 32px (header)
- **Weights**: 400 (regular) → 700 (bold)

## 📊 Health Score Calculation

| Component | Points | Status |
|-----------|--------|--------|
| Email Verified | 20 | ✅ if verified |
| 2FA Enabled | 30 | ✅ if enabled |
| Account Status | 35 | ✅ if active |
| Last Login | 15 | ✅ if < 30 days |
| **Total** | **100** | Max possible |

## 🔄 Real-Time Features

### Cross-Tab Synchronization
When 2FA is toggled in Settings:
1. Settings stores change in localStorage
2. Settings posts message to parent window
3. Dashboard listens for message
4. Dashboard refreshes account data
5. Health score updates with animations
6. All tabs sync automatically

### Flow
```
Settings (enable 2FA)
    ↓
localStorage + postMessage
    ↓
Dashboard (receives notification)
    ↓
loadAccount() (fetch updated data)
    ↓
Health Score animates (+30 points)
    ↓
2FA Tip shows "2FA Enabled" ✅
```

## 🐛 Known Issues & Workarounds

### Backend Variable Typo
**Issue**: Backend tries `user.isTwoFactorEnabled` (doesn't exist)
**Workaround**: Frontend caches 2FA status and uses localStorage fallback

### Email/Phone Verification Keys
**Issue**: Inconsistent key names (`isEmailVerified` vs `Email Verified`)
**Workaround**: Check both key name variants when parsing

### Logout on Sensitive Changes
**Issue**: Email/phone updates trigger session kill
**Behavior**: Intentional security feature - user must re-login
**Solution**: Session validity check after update, redirect if 401

## 📝 Git Workflow

All changes follow atomic commit pattern with descriptive messages:

```bash
# Example commits:
git commit -m "refactor: Remove redundant Security Status card"
git commit -m "feat: Restructure account layout to 2 rows x 3 columns"
git commit -m "feat: Add health score animations on 2FA change"
git commit -m "feat: Show 2FA as enabled with checkmark in health card"
```

## 🎓 Development Notes

### Adding New Features
1. Create feature branch: `git checkout -b feature/feature-name`
2. Implement changes with atomic commits
3. Test across browsers and devices
4. Ensure responsive design (mobile-first)
5. Push and create pull request

### Performance Considerations
- Lazy load sections when possible
- Cache API responses in localStorage
- Debounce form inputs (300ms recommended)
- Minimize reflows/repaints in animations

### Browser Support
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 📞 Support

### Common Issues

**Dashboard not loading?**
- Check browser console for errors (F12)
- Verify backend API is running
- Check network tab for API calls
- Clear localStorage: `localStorage.clear()`

**2FA status not syncing?**
- Hard refresh page (Ctrl+Shift+R)
- Check browser permissions for localStorage
- Verify postMessage listener in console

**Form fields not populating?**
- Check network tab for 401 errors
- Verify auth token in localStorage
- Check backend response format

## 📄 License

Internal Project - All Rights Reserved

---

**Last Updated**: March 17, 2026  
**Version**: 1.0.0  
**Status**: Production Ready ✅