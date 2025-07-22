// Employee ID Best Practices for Mysteel Progress Tracker

## 1. EMPLOYEE ID FORMAT STANDARDS

### Recommended Format Options:

**Option A: Department-Based (Current Recommended)**
- Format: `DEPT#### ` (e.g., ADM001, SAL001, DES001, PRD001, INS001)
- ADM = Admin, SAL = Sales, DES = Design, PRD = Production, INS = Installation
- Benefits: Easy to identify department, simple to remember

**Option B: Year-Department-Sequential**
- Format: `YY-DEPT-###` (e.g., 24-SAL-001, 24-DES-002)
- Benefits: Tracks hiring year, scalable

**Option C: Simple Sequential**
- Format: `EMP####` (e.g., EMP001, EMP002)
- Benefits: Simplest format, department agnostic

### Validation Rules:
- 6-8 characters maximum
- Alphanumeric only (no special characters except dash)
- Case insensitive
- Must be unique across organization

## 2. SECURITY CONSIDERATIONS

### Password Requirements for Employee ID Login:
- Minimum 8 characters
- Must contain: uppercase, lowercase, number, special character
- No common passwords
- Cannot contain employee ID or name

### Account Security:
- Max 5 login attempts before temporary lockout
- Account lockout: 15 minutes
- Password reset required after 90 days
- Two-factor authentication (optional but recommended)

## 3. USER EXPERIENCE ENHANCEMENTS

### Login Form Improvements:
1. Clear placeholder text: "Enter Employee ID (e.g., SAL001) or Email"
2. Auto-uppercase employee IDs
3. Format validation on blur
4. Helpful error messages
5. "Forgot Employee ID?" link

### Employee ID Recovery:
- Self-service lookup by email
- Admin can provide employee ID via secure channel
- Display last 3 characters only for verification

## 4. IMPLEMENTATION RECOMMENDATIONS

### Database Structure:
```
users: {
  uid: string (Firebase Auth UID)
  email: string (primary for Firebase Auth)
  employeeId: string (unique, indexed)
  name: string
  role: UserRole
  department: string
  status: 'active' | 'inactive' | 'suspended'
  createdAt: Date
  lastLogin: Date
  passwordLastChanged: Date
}
```

### Firestore Security Rules:
```
// Allow users to read only their own data by employeeId
allow read: if request.auth != null && 
  resource.data.employeeId == request.auth.token.employee_id;
```

## 5. WORKFLOW INTEGRATION

### Department-Specific Login Features:
- **Sales**: Direct access to project creation, customer info
- **Design**: Design module shortcuts, CAD file access
- **Production**: Production dashboard, milestone updates
- **Installation**: Photo upload, site reports
- **Admin**: Full system access, user management

### Role-Based Redirects:
- Auto-redirect to relevant module after login
- Bookmark department-specific dashboards
- Quick access to frequently used features

## 6. OFFLINE SUPPORT

### Local Employee Directory:
- Cache employee ID → email mappings
- Sync when online
- Fallback authentication for offline mode

## 7. COMPLIANCE & AUDIT

### Audit Trail:
- Log all login attempts (success/failure)
- Track employee ID usage vs email usage
- Monitor for suspicious patterns
- Monthly access reports per department

### Data Privacy:
- Employee ID not considered PII
- Safe to use in logs and analytics
- Still mask in public displays (e.g., SAL***)

## 8. MIGRATION STRATEGY

If implementing new employee ID format:

1. **Phase 1**: Allow both old and new formats
2. **Phase 2**: Notify users of new format
3. **Phase 3**: Require new format for new users
4. **Phase 4**: Migrate existing users (optional)
5. **Phase 5**: Deprecate old format (if needed)

## 9. COMMON PITFALLS TO AVOID

❌ **Don't:**
- Use social security numbers or sensitive data
- Make employee IDs too long (hard to remember)
- Allow special characters (causes input issues)
- Use sequential numbers only (predictable)
- Store passwords in plain text
- Skip employee ID validation

✅ **Do:**
- Use consistent format across organization
- Implement proper validation
- Provide clear error messages
- Support both email and employee ID
- Log authentication attempts
- Regular security audits

## 10. TESTING CHECKLIST

- [ ] Employee ID login with valid credentials
- [ ] Employee ID login with invalid credentials
- [ ] Case insensitive employee ID handling
- [ ] Mixed email/employee ID usage
- [ ] Password reset with employee ID
- [ ] Account lockout after failed attempts
- [ ] Offline mode employee ID resolution
- [ ] Role-based access after login
- [ ] Audit log entries
- [ ] Performance with large user base
