import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { AppShell } from './AppShell';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <AppShell>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px', color: '#8d979f' }}>
            <AlertTriangle size={48} color="#ff6652" style={{ marginBottom: '16px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Something went wrong</h2>
            <p style={{ marginBottom: '24px', textAlign: 'center', maxWidth: '400px' }}>
              We encountered an unexpected error while rendering this page.
              {this.state.error && <span style={{ display: 'block', marginTop: '8px', fontSize: '12px', color: '#5b6670' }}>{this.state.error.message}</span>}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#1c2630',
                color: '#f1f3f2',
                border: '1px solid #283540',
                padding: '10px 20px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={16} />
              <span>RELOAD PAGE</span>
            </button>
          </div>
        </AppShell>
      );
    }

    return this.props.children;
  }
}
