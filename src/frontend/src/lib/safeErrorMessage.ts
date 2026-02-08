export function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;
    
    // Payment-related errors
    if (message.includes('File must be a PDF')) {
      return 'Please upload a PDF file for payment proof';
    }
    if (message.includes('File size must be less than 8MB')) {
      return 'Payment proof file is too large. Please upload a file smaller than 8MB';
    }
    if (message.includes('already have a pending payment')) {
      return 'You already have a pending payment submission. Please wait for admin approval';
    }
    if (message.includes('Invalid coupon') || message.includes('coupon')) {
      return 'Invalid or expired coupon code';
    }
    if (message.includes('points') && message.includes('exceed')) {
      return 'You do not have enough points to redeem';
    }
    
    // Generic subscription errors
    if (message.includes('Subscription required')) {
      return message;
    }
    
    // Authorization errors - improved messaging
    if (message.includes('Unauthorized') || message.includes('permission')) {
      if (message.includes('admin')) {
        return 'Admin access required. Please unlock admin access or contact a permanent administrator';
      }
      return 'You do not have permission to perform this action';
    }
    
    // QR Code specific errors
    if (message.includes('QR code') || message.includes('QR Code')) {
      if (message.includes('upload')) {
        return 'Failed to upload QR code. Please ensure you have admin access and try again';
      }
      if (message.includes('clear') || message.includes('remove')) {
        return 'Failed to remove QR code. Please ensure you have admin access and try again';
      }
    }
    
    // Connection errors
    if (message.includes('Connecting to backend')) {
      return message;
    }
    
    // Generic fallback
    return 'An error occurred. Please try again';
  }
  
  return 'An unexpected error occurred';
}
