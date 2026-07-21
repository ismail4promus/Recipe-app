import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  // Explicitly define state for stricter TypeScript configurations
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("React Error Boundary Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding: 40, color: '#ef4444', fontFamily: 'sans-serif', textAlign: 'center'}}>
          <h1 style={{fontSize: '24px', marginBottom: '10px'}}>Something went wrong.</h1>
          <p style={{color: '#666'}}>Please try refreshing the page.</p>
          <pre style={{marginTop: '20px', background: '#f3f4f6', padding: '15px', borderRadius: '8px', overflow: 'auto', textAlign: 'left', fontSize: '12px'}}>
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }

    // Cast 'this' to access props safely in strict environments
    return (this as any).props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
  </React.StrictMode>
);