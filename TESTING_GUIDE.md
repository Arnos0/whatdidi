# Testing Guide for Phase 4: Smart Error Handling

This guide covers testing all the error handling features implemented in Phase 4.

## Quick Start Testing (5 minutes)

### 1. Development Testing Panel
- Look for the purple test tube icon in the bottom-right corner
- Click to open the Testing Panel
- Use the buttons to trigger different types of errors
- Check browser console for error tracking logs

### 2. URL-Based Testing
Add these parameters to any URL for instant testing:

```
?test=component-error     # Triggers a React component error
?test=validation-error    # Triggers form validation error
?test=network-error       # Triggers network error
?test=business-error      # Triggers business logic error
?test=async-error         # Triggers async operation error
?test=form-validation     # Fills forms with invalid data
?test=slow-loading        # Adds 3s delay to all requests
?test=offline-mode        # Simulates offline mode
```

Examples:
- `http://localhost:3002/dashboard?test=component-error`
- `http://localhost:3002/orders?test=network-error`

### 3. Browser Console Helpers
Open browser console and use these commands:

```javascript
// Trigger different error types
testHelpers.triggerComponentError()
testHelpers.triggerValidationError('email')
testHelpers.triggerNetworkError()

// Simulate network conditions
testHelpers.simulateSlowConnection(5000) // 5 second delay
testHelpers.restoreFetch() // Reset to normal

// Form testing
testHelpers.fillFormWithInvalidData()
testHelpers.clearAllForms()
```

## Detailed Testing Scenarios

### Error Boundary Testing

**Test 1: Component Error Boundary**
1. Navigate to any page
2. Add `?test=component-error` to URL
3. ✅ Verify error boundary appears with:
   - Error message and icon
   - "Try Again" button
   - "Report Issue" button
   - Error ID displayed

**Test 2: Page Error Boundary**
1. Open Testing Panel
2. Click "Component Error"
3. ✅ Verify page-level error boundary shows
4. Click "Try Again" - page should recover

**Test 3: Error Reporting**
1. Trigger any error
2. Click "Report Issue"
3. ✅ Verify email client opens with pre-filled error details

### Network State Testing

**Test 1: Offline Detection**
1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. ✅ Verify NetworkStatus appears at top
4. Try to perform actions (create order, etc.)
5. ✅ Verify operations are queued

**Test 2: Reconnection**
1. While offline, go back "Online"
2. ✅ Verify "Connected" notification appears
3. ✅ Verify queued operations are retried

**Test 3: Slow Connection**
1. Set DevTools Network to "Slow 3G"
2. ✅ Verify "Slow connection" warning appears
3. Test that operations still work but show appropriate feedback

### Form Error Experience Testing

**Test 1: Validation Errors**
1. Navigate to `/orders` and click "Add Order"
2. Submit form without filling required fields
3. ✅ Verify FormValidationSummary appears at top
4. ✅ Verify individual field errors show with suggestions
5. ✅ Verify help tooltips appear on hover

**Test 2: Invalid Input Suggestions**
1. Enter invalid email format
2. ✅ Verify suggestions like "Make sure to include @ symbol"
3. Enter invalid order number
4. ✅ Verify helpful suggestions appear

**Test 3: Real-time Validation**
1. Fill form fields with invalid data
2. ✅ Verify errors appear as you type/leave fields
3. Correct the errors
4. ✅ Verify error state clears when valid

### Loading States Testing

**Test 1: Skeleton Loading**
1. Add `?test=slow-loading` to URL
2. Navigate between pages
3. ✅ Verify appropriate skeleton components show
4. ✅ Verify skeletons match the content layout

**Test 2: Progressive Loading**
1. Navigate to dashboard with slow connection
2. ✅ Verify stats cards load with skeletons
3. ✅ Verify charts show chart skeletons
4. ✅ Verify smooth transition from skeleton to content

### Error Monitoring Testing

**Test 1: Error Tracking**
1. Trigger various errors using Testing Panel
2. Open browser console
3. ✅ Verify error reports are logged with:
   - Error ID
   - Severity level
   - Component context
   - User actions

**Test 2: Error Statistics**
1. Trigger multiple errors
2. Check Testing Panel error stats
3. ✅ Verify counts update correctly
4. ✅ Verify recent errors are tracked

### Bulk Operations Testing

**Test 1: Bulk Selection**
1. Navigate to `/orders`
2. Select multiple orders using checkboxes
3. ✅ Verify bulk operations bar appears
4. ✅ Verify selection count is accurate

**Test 2: Bulk Error Handling**
1. Select orders and try bulk delete
2. Simulate some failures (disconnect network mid-operation)
3. ✅ Verify partial success is handled gracefully
4. ✅ Verify failed operations are reported clearly

### Error Recovery Testing

**Test 1: Network Recovery**
1. Go offline
2. Try to create an order
3. ✅ Verify ErrorRecovery component appears
4. ✅ Verify recovery steps are shown
5. Follow the recovery steps
6. ✅ Verify guided recovery works

**Test 2: Validation Recovery**
1. Submit form with multiple validation errors
2. ✅ Verify ErrorRecovery shows form-specific guidance
3. Follow the recovery steps
4. ✅ Verify form can be successfully submitted after fixes

## Advanced Testing

### Performance Testing
```javascript
// Test with many errors
for (let i = 0; i < 100; i++) {
  testHelpers.triggerValidationError(`field${i}`)
}

// Check memory usage in DevTools
```

### Accessibility Testing
1. Use screen reader to test error announcements
2. Test keyboard navigation through error recovery flows
3. Verify color contrast of error states
4. Test with motion preferences disabled

### Browser Compatibility
Test error handling in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Automated Testing Setup

### Unit Tests
Create tests for:
```bash
# Error handling utilities
npm test -- error-standardizer.test.ts

# Error tracking hooks
npm test -- use-error-tracking.test.ts

# Form validation helpers
npm test -- form-validation-helpers.test.ts
```

### Integration Tests
```bash
# Error boundary integration
npm test -- error-boundary.integration.test.ts

# Form error flow
npm test -- form-error-flow.integration.test.ts
```

### E2E Tests
```bash
# Complete error scenarios
npm run test:e2e -- error-scenarios.e2e.ts
```

## Common Issues and Solutions

### Testing Panel Not Visible
- Ensure you're in development mode (`NODE_ENV=development`)
- Check console for JavaScript errors
- Refresh the page

### URL Triggers Not Working
- Ensure URL parameters are correctly formatted
- Check browser console for trigger activation logs
- Try refreshing the page after adding URL parameters

### Error Tracking Not Working
- Check that error tracking is initialized
- Verify console shows error reports
- Check localStorage for persisted reports

### Network Simulation Issues
- Use DevTools Network tab for reliable testing
- Some network conditions require actual disconnection
- VPN or proxy settings might interfere

## Checklist for Complete Testing

- [ ] Error boundaries catch and display errors correctly
- [ ] Network status updates in real-time
- [ ] Form validation shows helpful suggestions
- [ ] Loading skeletons appear consistently
- [ ] Error tracking captures all error types
- [ ] Bulk operations handle errors gracefully
- [ ] Error recovery provides clear guidance
- [ ] All errors show user-friendly messages
- [ ] Performance remains good with many errors
- [ ] Accessibility features work properly

## Reporting Issues

When you find issues during testing:

1. **Capture Error Details**
   - Error message and stack trace
   - Steps to reproduce
   - Browser and environment info
   - Screenshots if applicable

2. **Check Error Tracking**
   - Look for Error ID in console
   - Note error severity and category
   - Check if error is properly tracked

3. **Test Recovery**
   - Try the suggested recovery steps
   - Note if recovery guidance is helpful
   - Test if the issue persists after recovery

This comprehensive testing approach ensures all error handling features work correctly and provide a great user experience.