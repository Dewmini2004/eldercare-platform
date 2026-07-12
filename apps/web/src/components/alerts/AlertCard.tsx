'use client'

import { AlertTriangle, Info, AlertCircle, Zap } from 'lucide-react'
import { alertsApi } from '@/lib/api/client'
import { useQueryClient } from '@tanstack/react-query'

interface Alert {
  id: string
  elderName: string
  aiSummary?: string
  rawIncident: string
  aiSeverity?: 'info' | 'attention' | 'urgent' | 'critical'
  aiSuggestedActions?: string[]
  requiresImmediateContact?: boolean
  acknowledgedAt?: string
  createdAt: string
}

const SEVERITY_CONFIG = {
  info:      { icon: Info,          color: '#2980B9', bg: '#EBF5FB', label: 'Info' },
  attention: { icon: AlertCircle,   color: '#E67E22', bg: '#FEF9E7', label: 'Attention' },
  urgent:    { icon: AlertTriangle, color: '#E74C3C', bg: '#FDEDEC', label: 'Urgent' },
  critical:  { icon: Zap,           color: '#C0392B', bg: '#FDEDEC', label: 'Critical' }
}

export function AlertCard({ alert }: { alert: Alert }) {
  const queryClient = useQueryClient()
  const severity = alert.aiSeverity || 'info'
  const cfg = SEVERITY_CONFIG[severity]
  const Icon = cfg.icon
  const isAcknowledged = !!alert.acknowledgedAt

  async function acknowledge() {
    await alertsApi.acknowledge(alert.id)
    queryClient.invalidateQueries({ queryKey: ['alerts'] })
  }

  return (
    <div
      className={`rounded-lg p-4 border-l-4 ${severity === 'critical' ? 'alert-critical' : ''}`}
      style={{
        background: isAcknowledged ? 'var(--color-surface-muted)' : cfg.bg,
        borderLeftColor: isAcknowledged ? 'var(--color-border)' : cfg.color,
        opacity: isAcknowledged ? 0.7 : 1
      }}>
      <div className="flex items-start gap-3">
        <Icon size={16} style={{ color: cfg.color, flexShrink: 0, marginTop: 2 }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: cfg.color + '20', color: cfg.color }}>
              {cfg.label}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {new Date(alert.createdAt).toLocaleString('en-LK', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </span>
          </div>
          <p className="text-sm font-medium">{alert.elderName}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {alert.aiSummary || alert.rawIncident}
          </p>
          {alert.aiSuggestedActions && alert.aiSuggestedActions.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Suggested actions:
              </p>
              <ul className="text-xs space-y-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {alert.aiSuggestedActions.slice(0, 2).map((action, i) => (
                  <li key={i}>• {action}</li>
                ))}
              </ul>
            </div>
          )}
          {alert.requiresImmediateContact && (
            <p className="text-xs font-bold mt-2" style={{ color: '#C0392B' }}>
              ⚠ Immediate contact required — call the home now
            </p>
          )}
          {!isAcknowledged && (
            <button onClick={acknowledge}
              className="mt-2 text-xs underline"
              style={{ color: 'var(--color-text-muted)' }}>
              Mark as acknowledged
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
