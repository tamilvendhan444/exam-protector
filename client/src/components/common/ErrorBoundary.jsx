import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.log('[DEBUG-CHECKPOINT-5] ErrorBoundary caught error:', error.message);
    console.error('[ErrorBoundary] caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      if (typeof this.props.fallbackRender === 'function') {
        return this.props.fallbackRender({ error: this.state.error, errorInfo: this.state.errorInfo });
      }
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex flex-col items-center justify-center gap-2 m-2 shadow-sm">
          <AlertTriangle className="h-8 w-8 text-rose-500" />
          <h3 className="font-bold text-sm">Something went wrong.</h3>
          <p className="text-xs opacity-80 text-center">{this.state.error?.message || 'Component failed to render.'}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
