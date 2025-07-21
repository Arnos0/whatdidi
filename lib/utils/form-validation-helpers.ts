export interface ValidationHelp {
  message: string
  suggestions: string[]
}

export const getFieldValidationHelp = (fieldName: string, error: string): ValidationHelp => {
  const helpMap: Record<string, Record<string, ValidationHelp>> = {
    email: {
      invalid: {
        message: 'Please enter a valid email address',
        suggestions: [
          'Make sure to include @ symbol',
          'Check for typos in domain name',
          'Example: user@example.com'
        ]
      },
      required: {
        message: 'Email address is required',
        suggestions: ['Enter your email to continue']
      }
    },
    password: {
      weak: {
        message: 'Password is too weak',
        suggestions: [
          'Use at least 8 characters',
          'Include uppercase and lowercase letters',
          'Add numbers and special characters',
          'Avoid common words or patterns'
        ]
      },
      required: {
        message: 'Password is required',
        suggestions: ['Enter a secure password']
      },
      mismatch: {
        message: 'Passwords do not match',
        suggestions: ['Make sure both password fields are identical']
      }
    },
    orderNumber: {
      invalid: {
        message: 'Order number format is invalid',
        suggestions: [
          'Check your email receipt for the correct format',
          'Remove any extra spaces or characters',
          'Examples: 123-456-789, ORD-2024-001'
        ]
      },
      required: {
        message: 'Order number is required',
        suggestions: ['Find this in your email receipt or order confirmation']
      },
      duplicate: {
        message: 'This order number already exists',
        suggestions: [
          'Check if you already added this order',
          'Verify the order number is correct',
          'Contact support if this is a mistake'
        ]
      }
    },
    amount: {
      invalid: {
        message: 'Please enter a valid amount',
        suggestions: [
          'Use numbers only (no currency symbols)',
          'Use decimal point for cents (e.g., 19.99)',
          'Amount must be greater than 0'
        ]
      },
      required: {
        message: 'Order amount is required',
        suggestions: ['Check your receipt for the total amount']
      }
    },
    retailer: {
      invalid: {
        message: 'Please select a valid retailer',
        suggestions: [
          'Choose from the dropdown list',
          'Type to search for your retailer',
          'Contact support to add a new retailer'
        ]
      },
      required: {
        message: 'Retailer selection is required',
        suggestions: ['Select where you made this purchase']
      }
    },
    trackingNumber: {
      invalid: {
        message: 'Tracking number format appears invalid',
        suggestions: [
          'Check your shipping confirmation email',
          'Remove any spaces or special characters',
          'Verify with the carrier if unsure'
        ]
      }
    },
    date: {
      invalid: {
        message: 'Please enter a valid date',
        suggestions: [
          'Use the date picker for correct format',
          'Date cannot be in the future',
          'Check your receipt for the order date'
        ]
      },
      required: {
        message: 'Order date is required',
        suggestions: ['When did you place this order?']
      }
    }
  }

  const fieldHelp = helpMap[fieldName]
  if (!fieldHelp) {
    return {
      message: error,
      suggestions: ['Please check this field and try again']
    }
  }

  // Try to match the error message to known patterns
  const errorKey = Object.keys(fieldHelp).find(key => 
    error.toLowerCase().includes(key) || 
    fieldHelp[key].message.toLowerCase().includes(error.toLowerCase())
  )

  if (errorKey && fieldHelp[errorKey]) {
    return fieldHelp[errorKey]
  }

  // Fallback to the first available help or generic
  const firstKey = Object.keys(fieldHelp)[0]
  return fieldHelp[firstKey] || {
    message: error,
    suggestions: ['Please check this field and try again']
  }
}

export const getFormLevelSuggestions = (errors: Record<string, string>): string[] => {
  const suggestions = []
  
  if (Object.keys(errors).length > 3) {
    suggestions.push('Consider filling out required fields first')
  }
  
  if (errors.email || errors.password) {
    suggestions.push('Check your login credentials carefully')
  }
  
  if (errors.orderNumber || errors.amount || errors.retailer) {
    suggestions.push('Refer to your email receipt for accurate information')
  }
  
  suggestions.push('All required fields must be completed')
  suggestions.push('Contact support if you continue having issues')
  
  return suggestions
}

export const formatFieldName = (fieldName: string): string => {
  // Handle already formatted names (contains spaces)
  if (fieldName.includes(' ')) {
    return fieldName
  }
  
  // Handle acronyms like XMLHttpRequest
  const formatted = fieldName
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')  // XMLHttp -> XML Http
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')      // httpRequest -> http Request
    .replace(/^./, str => str.toUpperCase())     // Capitalize first letter
    .trim()
  
  return formatted
}

export const getFieldHelpText = (fieldName: string): string => {
  const helpTextMap: Record<string, string> = {
    orderNumber: 'Find this in your email receipt or order confirmation',
    retailer: 'The store or website where you made this purchase',
    amount: 'Total amount paid including tax and shipping',
    orderDate: 'The date you placed the order (not delivery date)',
    trackingNumber: 'Optional - provided in shipping confirmation email',
    carrier: 'The shipping company delivering your order',
    items: 'List of products or services in this order'
  }
  
  return helpTextMap[fieldName] || ''
}