import { 
  getFieldValidationHelp, 
  getFormLevelSuggestions, 
  formatFieldName, 
  getFieldHelpText 
} from '../lib/utils/form-validation-helpers'

describe('getFieldValidationHelp', () => {
  it('should return help for email validation errors', () => {
    const help = getFieldValidationHelp('email', 'Please enter a valid email address')
    
    expect(help.message).toBe('Please enter a valid email address')
    expect(help.suggestions).toContain('Make sure to include @ symbol')
    expect(help.suggestions).toContain('Example: user@example.com')
  })

  it('should return help for password validation errors', () => {
    const help = getFieldValidationHelp('password', 'Password is too weak')
    
    expect(help.suggestions).toContain('Use at least 8 characters')
    expect(help.suggestions).toContain('Include uppercase and lowercase letters')
    expect(help.suggestions).toContain('Add numbers and special characters')
  })

  it('should return help for order number validation errors', () => {
    const help = getFieldValidationHelp('orderNumber', 'Order number format is invalid')
    
    expect(help.suggestions).toContain('Check your email receipt for the correct format')
    expect(help.suggestions).toContain('Examples: 123-456-789, ORD-2024-001')
  })

  it('should return help for amount validation errors', () => {
    const help = getFieldValidationHelp('amount', 'Please enter a valid amount')
    
    expect(help.suggestions).toContain('Use numbers only (no currency symbols)')
    expect(help.suggestions).toContain('Use decimal point for cents (e.g., 19.99)')
  })

  it('should return help for retailer validation errors', () => {
    const help = getFieldValidationHelp('retailer', 'Please select a valid retailer')
    
    expect(help.suggestions).toContain('Choose from the dropdown list')
    expect(help.suggestions).toContain('Type to search for your retailer')
  })

  it('should return help for date validation errors', () => {
    const help = getFieldValidationHelp('date', 'Please enter a valid date')
    
    expect(help.suggestions).toContain('Use the date picker for correct format')
    expect(help.suggestions).toContain('Date cannot be in the future')
  })

  it('should return generic help for unknown fields', () => {
    const help = getFieldValidationHelp('unknownField', 'Some error')
    
    expect(help.message).toBe('Some error')
    expect(help.suggestions).toContain('Please check this field and try again')
  })

  it('should match error patterns correctly', () => {
    const help = getFieldValidationHelp('password', 'passwords do not match')
    
    expect(help.suggestions).toContain('Make sure both password fields are identical')
  })
})

describe('getFormLevelSuggestions', () => {
  it('should suggest prioritizing required fields for many errors', () => {
    const errors = {
      field1: 'Error 1',
      field2: 'Error 2',
      field3: 'Error 3',
      field4: 'Error 4'
    }
    
    const suggestions = getFormLevelSuggestions(errors)
    
    expect(suggestions).toContain('Consider filling out required fields first')
  })

  it('should suggest checking credentials for auth errors', () => {
    const errors = {
      email: 'Invalid email',
      password: 'Password required'
    }
    
    const suggestions = getFormLevelSuggestions(errors)
    
    expect(suggestions).toContain('Check your login credentials carefully')
  })

  it('should suggest referring to receipt for order errors', () => {
    const errors = {
      orderNumber: 'Invalid order number',
      amount: 'Invalid amount'
    }
    
    const suggestions = getFormLevelSuggestions(errors)
    
    expect(suggestions).toContain('Refer to your email receipt for accurate information')
  })

  it('should always include general suggestions', () => {
    const errors = { field1: 'Error 1' }
    
    const suggestions = getFormLevelSuggestions(errors)
    
    expect(suggestions).toContain('All required fields must be completed')
    expect(suggestions).toContain('Contact support if you continue having issues')
  })
})

describe('formatFieldName', () => {
  it('should convert camelCase to Title Case', () => {
    expect(formatFieldName('firstName')).toBe('First Name')
    expect(formatFieldName('orderNumber')).toBe('Order Number')
    expect(formatFieldName('emailAddress')).toBe('Email Address')
  })

  it('should handle single words', () => {
    expect(formatFieldName('email')).toBe('Email')
    expect(formatFieldName('password')).toBe('Password')
  })

  it('should handle already formatted names', () => {
    expect(formatFieldName('Email')).toBe('Email')
    expect(formatFieldName('First Name')).toBe('First Name')
  })

  it('should handle multiple capital letters', () => {
    expect(formatFieldName('XMLHttpRequest')).toBe('XMLHttp Request')
    expect(formatFieldName('URLPath')).toBe('URLPath')
  })
})

describe('getFieldHelpText', () => {
  it('should return help text for order number', () => {
    const helpText = getFieldHelpText('orderNumber')
    
    expect(helpText).toBe('Find this in your email receipt or order confirmation')
  })

  it('should return help text for retailer', () => {
    const helpText = getFieldHelpText('retailer')
    
    expect(helpText).toBe('The store or website where you made this purchase')
  })

  it('should return help text for amount', () => {
    const helpText = getFieldHelpText('amount')
    
    expect(helpText).toBe('Total amount paid including tax and shipping')
  })

  it('should return help text for order date', () => {
    const helpText = getFieldHelpText('orderDate')
    
    expect(helpText).toBe('The date you placed the order (not delivery date)')
  })

  it('should return help text for tracking number', () => {
    const helpText = getFieldHelpText('trackingNumber')
    
    expect(helpText).toBe('Optional - provided in shipping confirmation email')
  })

  it('should return help text for carrier', () => {
    const helpText = getFieldHelpText('carrier')
    
    expect(helpText).toBe('The shipping company delivering your order')
  })

  it('should return help text for items', () => {
    const helpText = getFieldHelpText('items')
    
    expect(helpText).toBe('List of products or services in this order')
  })

  it('should return empty string for unknown fields', () => {
    const helpText = getFieldHelpText('unknownField')
    
    expect(helpText).toBe('')
  })

  it('should handle null and undefined', () => {
    expect(getFieldHelpText('')).toBe('')
  })
})