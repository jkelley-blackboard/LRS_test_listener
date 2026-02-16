# Blackboard Learn SCORM xAPI Configuration Guide

## Quick Reference

After deploying to Render.com, use these settings:

- **Endpoint**: `https://your-app-name.onrender.com/xapi` (must end in `/xapi` and use HTTPS)
- **Key**: `key`
- **Secret**: `secret`

## Step-by-Step: Configure Blackboard Learn

### Option 1: SCORM Package Level (Recommended)

1. **Before uploading** your SCORM package to Blackboard:
   - Extract the SCORM package
   - Look for configuration files (often `tincan.xml` or LRS settings)
   - Add or edit LRS configuration:
     ```xml
     <lrs>
       <endpoint>https://your-app-name.onrender.com/xapi</endpoint>
       <auth>Basic a2V5OnNlY3JldA==</auth>
     </lrs>
     ```
   - Note: `a2V5OnNlY3JldA==` is base64 encoding of "key:secret"

2. **Re-package** and upload to Blackboard

3. **Test** by having a student access the content

### Option 2: Blackboard Building Block Configuration

If your Blackboard instance has a SCORM Cloud or xAPI Building Block:

1. Go to **System Admin** → **Building Blocks** → **Installed Tools**
2. Find your SCORM/xAPI building block
3. Click **Settings**
4. Enter:
   - **LRS Endpoint**: `https://your-app-name.onrender.com/xapi`
   - **Key**: `key`
   - **Secret**: `secret`
   - **Version**: `1.0.3`

### Option 3: LTI Tool Provider (System-wide)

1. Navigate to **System Admin** → **Integrations** → **LTI Tool Providers**
2. Click **Register Provider Domain**
3. Enter:
   - **Provider Domain**: `your-app-name.onrender.com`
   - **Provider Domain Status**: Enabled
4. Click **Register Provider Domain**
5. In the provider settings, add xAPI/LRS configuration if available

### Option 4: Content Type Handler

Some Blackboard versions allow LRS configuration at the content type level:

1. Go to **System Admin** → **Content Management** → **Content Types**
2. Find **SCORM Content** or **xAPI Content**
3. Click **Settings**
4. Add LRS details

## Verifying the Connection

### Method 1: Check Blackboard Registration
1. After entering credentials, Blackboard should show "Connection successful" or similar
2. If you get "xAPI Version 1.0.3 is invalid", verify:
   - Using `/xapi` endpoint (not `/xapi/statements`)
   - Using HTTPS (not HTTP)
   - Server is actually deployed and running

### Method 2: Check the Dashboard
1. Visit `https://your-app-name.onrender.com`
2. You should see the LRS dashboard
3. The endpoint displayed should match what you entered in Blackboard

### Method 3: Test with SCORM Content
1. Upload a simple SCORM package with xAPI enabled
2. Access it as a student
3. Check the dashboard - you should see statements like:
   - "Initialized"
   - "Experienced"
   - "Completed"

## Common Issues

### ❌ "xAPI Version 1.0.3 is invalid or not supported"

**Cause**: Blackboard is checking `/xapi` endpoint but not getting version headers

**Solution**:
- Verify endpoint is exactly: `https://your-app-name.onrender.com/xapi`
- Do NOT use `/xapi/statements` in Blackboard config
- Ensure server is deployed and running
- Test the endpoint: `curl -i https://your-app-name.onrender.com/xapi`
  - Should return: `X-Experience-API-Version: 1.0.3`

### ❌ "Unauthorized" or "Invalid credentials"

**Cause**: Credentials mismatch

**Solution**:
- Key must be exactly: `key` (lowercase)
- Secret must be exactly: `secret` (lowercase)
- Check for extra spaces or characters
- In Blackboard, these are often labeled "Consumer Key" and "Shared Secret"

### ❌ "HTTPS Required" or "Insecure endpoint"

**Cause**: Trying to use HTTP instead of HTTPS

**Solution**:
- Must deploy to Render.com or similar (provides free HTTPS)
- Cannot use `http://localhost:3000` with Blackboard
- Verify URL starts with `https://`

### ❌ No statements appearing in dashboard

**Possible causes**:
1. SCORM package doesn't have xAPI enabled
2. Student hasn't actually interacted with content yet
3. Blackboard isn't configured correctly

**Troubleshooting**:
1. Click "Send Test Statement" on dashboard - should appear immediately
2. Check Render.com logs for incoming requests
3. Verify SCORM package supports xAPI/TinCan
4. Try with a known-working xAPI SCORM package

## Understanding SCORM Statements

When a student interacts with SCORM content in Blackboard, you'll see statements like:

### Initialization
```json
{
  "actor": {
    "name": "John Doe",
    "mbox": "mailto:john.doe@university.edu"
  },
  "verb": {
    "id": "http://adlnet.gov/expapi/verbs/initialized"
  },
  "object": {
    "id": "http://example.com/course/module1"
  }
}
```

### Progress
```json
{
  "verb": {
    "id": "http://adlnet.gov/expapi/verbs/progressed"
  },
  "result": {
    "completion": false,
    "progress": "25"
  }
}
```

### Completion
```json
{
  "verb": {
    "id": "http://adlnet.gov/expapi/verbs/completed"
  },
  "result": {
    "completion": true,
    "success": true,
    "score": {
      "scaled": 0.95
    }
  }
}
```

## Testing Checklist

- [ ] Deployed to Render.com (or similar HTTPS provider)
- [ ] Endpoint ends in `/xapi` (not `/xapi/statements`)
- [ ] Using HTTPS (not HTTP)
- [ ] Key is `key`
- [ ] Secret is `secret`
- [ ] Blackboard shows "registered" or "connected"
- [ ] Test statement button works on dashboard
- [ ] Student can access SCORM content
- [ ] Statements appear on dashboard after student interaction

## Production Considerations

This LRS is designed for **testing and development**. For production Blackboard deployments:

### Limitations:
- ❌ Statements stored in memory (lost on restart)
- ❌ Limited to 1000 statements
- ❌ No user authentication on dashboard
- ❌ No data export or reporting features

### For Production, Consider:
- ✅ Learning Locker (open source, full-featured)
- ✅ Watershed LRS (commercial, Blackboard partner)
- ✅ Veracity Learning (commercial, education-focused)
- ✅ Or add database storage to this LRS (PostgreSQL, MongoDB)

## Support Resources

- **Blackboard xAPI Documentation**: Check Blackboard Help for your specific version
- **xAPI Specification**: https://github.com/adlnet/xAPI-Spec
- **SCORM Cloud**: https://cloud.scorm.com (for testing SCORM packages)
- **This LRS GitHub**: (add your repo URL here)

## Next Steps

After successful configuration:
1. ✅ Monitor the dashboard during student interactions
2. ✅ Export data for analysis (use browser dev tools to copy JSON)
3. ✅ Consider adding persistent storage for long-term use
4. ✅ Review statement data to understand student behavior
