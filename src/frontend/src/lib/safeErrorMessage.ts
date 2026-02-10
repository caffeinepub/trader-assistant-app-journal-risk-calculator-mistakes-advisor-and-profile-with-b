export function safeErrorMessage(error: Error | unknown): string {
  if (!error) return 'An unknown error occurred';

  const errorString = error instanceof Error ? error.message : String(error);

  // Payment-specific errors
  if (errorString.includes('File must be a PDF')) {
    return 'Payment proof must be a PDF file';
  }
  if (errorString.includes('File size must be less than 8MB')) {
    return 'Payment proof file size must be less than 8MB';
  }
  if (errorString.includes('already have a pending payment')) {
    return 'You already have a pending payment. Please wait for admin approval before submitting a new one.';
  }
  if (errorString.includes('No pending payment found')) {
    return 'No pending payment found for this user';
  }
  if (errorString.includes('No existing subscription found')) {
    return 'User subscription record not found. Please create a profile first.';
  }

  // Admin payment approval/rejection errors
  if (errorString.includes('Only admins can review and approve payments')) {
    return 'Admin access required to approve payments';
  }
  if (errorString.includes('Only admins can reject payments')) {
    return 'Admin access required to reject payments';
  }
  if (errorString.includes('Invalid password')) {
    return 'Invalid admin password. Please try again.';
  }
  if (errorString.includes('Password must be at least 8 characters')) {
    return 'Password must be at least 8 characters long';
  }

  // QR code errors
  if (errorString.includes('Only admins can upload the payment QR code')) {
    return 'Admin access required to upload payment QR code';
  }
  if (errorString.includes('Only admins can clear the payment QR code')) {
    return 'Admin access required to clear payment QR code';
  }

  // Authorization errors
  if (errorString.includes('Unauthorized') || errorString.includes('Only admins')) {
    if (errorString.includes('admin')) {
      return 'Admin access required for this action. Please unlock admin access or contact a permanent administrator.';
    }
    return 'You do not have permission to perform this action';
  }

  // Subscription errors
  if (errorString.includes('Subscription required')) {
    if (errorString.includes('Basic')) {
      return 'This feature requires a Basic, Pro, or Premium subscription';
    }
    if (errorString.includes('Pro')) {
      return 'This feature requires a Pro or Premium subscription';
    }
    if (errorString.includes('Premium')) {
      return 'This feature requires a Premium subscription';
    }
    return 'Active subscription required to access this feature';
  }

  // Profile errors
  if (errorString.includes('Profile already exists')) {
    return 'A profile already exists for this account';
  }
  if (errorString.includes('No profile found')) {
    return 'Please create a profile first';
  }

  // Trade/Mistake errors
  if (errorString.includes('Invalid index')) {
    return 'The selected entry could not be found';
  }
  if (errorString.includes('No trades found')) {
    return 'No trade entries found';
  }
  if (errorString.includes('No mistakes found')) {
    return 'No mistake entries found';
  }

  // Connection errors
  if (errorString.includes('Actor not available')) {
    return 'Backend connection not available. Please refresh the page.';
  }
  if (errorString.includes('network') || errorString.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }

  // Generic fallback
  return errorString || 'An error occurred. Please try again.';
}
