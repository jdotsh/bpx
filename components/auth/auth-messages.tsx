'use client'

import { useSearchParams } from 'next/navigation'
import { AlertCircle, CheckCircle, Info, XCircle, Mail, Lock, UserPlus, RefreshCw, Link2, Key } from 'lucide-react'

type MessageType = 'success' | 'error' | 'info' | 'warning'

interface AuthMessage {
  type: MessageType
  title: string
  description: string
  icon: React.ReactNode
}

const messageConfigs: Record<string, AuthMessage> = {
  // Sign Up Messages
  'signup-success': {
    type: 'success',
    title: 'Check your email!',
    description: 'We sent you a confirmation link. Please check your inbox and click the link to verify your account.',
    icon: <Mail className="w-5 h-5" />
  },
  'confirm-email': {
    type: 'info',
    title: 'Email confirmation required',
    description: 'Please check your email and click the confirmation link to activate your account.',
    icon: <Mail className="w-5 h-5" />
  },
  'email-confirmed': {
    type: 'success',
    title: 'Email confirmed!',
    description: 'Your email has been verified. You can now sign in to your account.',
    icon: <CheckCircle className="w-5 h-5" />
  },
  
  // Sign In Messages
  'signin-error': {
    type: 'error',
    title: 'Sign in failed',
    description: 'Invalid email or password. Please check your credentials and try again.',
    icon: <XCircle className="w-5 h-5" />
  },
  'account-not-verified': {
    type: 'warning',
    title: 'Account not verified',
    description: 'Please check your email and click the verification link before signing in.',
    icon: <AlertCircle className="w-5 h-5" />
  },
  'session-expired': {
    type: 'warning',
    title: 'Session expired',
    description: 'Your session has expired. Please sign in again to continue.',
    icon: <RefreshCw className="w-5 h-5" />
  },
  
  // Password Reset Messages
  'reset-email-sent': {
    type: 'success',
    title: 'Password reset email sent',
    description: 'Check your email for instructions to reset your password. The link will expire in 1 hour.',
    icon: <Mail className="w-5 h-5" />
  },
  'password-updated': {
    type: 'success',
    title: 'Password updated successfully',
    description: 'Your password has been changed. You can now sign in with your new password.',
    icon: <Lock className="w-5 h-5" />
  },
  'reset-link-expired': {
    type: 'error',
    title: 'Reset link expired',
    description: 'This password reset link has expired. Please request a new one.',
    icon: <XCircle className="w-5 h-5" />
  },
  
  // Magic Link Messages
  'magic-link-sent': {
    type: 'success',
    title: 'Magic link sent!',
    description: 'Check your email for a sign-in link. Click it to access your account instantly.',
    icon: <Link2 className="w-5 h-5" />
  },
  'magic-link-error': {
    type: 'error',
    title: 'Magic link failed',
    description: 'Unable to send magic link. Please check your email address and try again.',
    icon: <XCircle className="w-5 h-5" />
  },
  'magic-link-expired': {
    type: 'error',
    title: 'Magic link expired',
    description: 'This sign-in link has expired. Please request a new one.',
    icon: <XCircle className="w-5 h-5" />
  },
  
  // Email Change Messages
  'email-change-sent': {
    type: 'info',
    title: 'Confirm your new email',
    description: 'We sent confirmation links to both your old and new email addresses. Please check both inboxes.',
    icon: <Mail className="w-5 h-5" />
  },
  'email-change-confirmed': {
    type: 'success',
    title: 'Email address updated',
    description: 'Your email address has been successfully changed.',
    icon: <CheckCircle className="w-5 h-5" />
  },
  
  // Invite Messages
  'invite-accepted': {
    type: 'success',
    title: 'Invitation accepted',
    description: 'Welcome! Please set up your account to get started.',
    icon: <UserPlus className="w-5 h-5" />
  },
  'invite-expired': {
    type: 'error',
    title: 'Invitation expired',
    description: 'This invitation link has expired. Please contact the person who invited you.',
    icon: <XCircle className="w-5 h-5" />
  },
  
  // Reauthentication Messages
  'reauth-required': {
    type: 'warning',
    title: 'Please confirm your identity',
    description: 'For security, please enter your password to continue with this action.',
    icon: <Key className="w-5 h-5" />
  },
  'reauth-success': {
    type: 'success',
    title: 'Identity confirmed',
    description: 'You can now proceed with your requested action.',
    icon: <CheckCircle className="w-5 h-5" />
  },
  
  // General Messages
  'network-error': {
    type: 'error',
    title: 'Connection error',
    description: 'Unable to connect to the server. Please check your internet connection and try again.',
    icon: <AlertCircle className="w-5 h-5" />
  },
  'rate-limit': {
    type: 'warning',
    title: 'Too many attempts',
    description: 'You\'ve made too many requests. Please wait a few minutes before trying again.',
    icon: <AlertCircle className="w-5 h-5" />
  },
  'maintenance': {
    type: 'info',
    title: 'Under maintenance',
    description: 'We\'re performing scheduled maintenance. Please try again in a few minutes.',
    icon: <Info className="w-5 h-5" />
  }
}

export function AuthMessages() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  
  // Handle URL-based messages
  let config: AuthMessage | null = null
  
  if (message && messageConfigs[message]) {
    config = messageConfigs[message]
  } else if (error) {
    // Handle OAuth/Supabase errors
    config = {
      type: 'error',
      title: error.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: errorDescription || 'An error occurred during authentication. Please try again.',
      icon: <XCircle className="w-5 h-5" />
    }
  }
  
  if (!config) return null
  
  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  }
  
  const iconStyles = {
    success: 'text-green-500',
    error: 'text-red-500',
    info: 'text-blue-500',
    warning: 'text-yellow-500'
  }
  
  return (
    <div className={`rounded-lg border p-4 ${styles[config.type]} mb-6`}>
      <div className="flex items-start gap-3">
        <span className={iconStyles[config.type]}>
          {config.icon}
        </span>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{config.title}</h3>
          <p className="text-sm mt-1 opacity-90">{config.description}</p>
        </div>
      </div>
    </div>
  )
}

// Hook to programmatically show messages
export function useAuthMessage() {
  const showMessage = (key: string) => {
    const config = messageConfigs[key]
    if (!config) return
    
    // You can integrate with your toast/notification system here
    console.log('Auth Message:', config)
  }
  
  return { showMessage, messageConfigs }
}