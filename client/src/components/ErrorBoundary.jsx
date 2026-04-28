import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Familjekalendern kraschade:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            <div className="text-4xl mb-4">😕</div>
            <h1 className="text-xl font-semibold text-slate-800 mb-2">
              Något gick fel
            </h1>
            <p className="text-slate-600 mb-6 text-sm">
              Familjekalendern stötte på ett oväntat fel. Ladda om sidan för att
              försöka igen.
            </p>
            {this.state.error?.message && (
              <p className="text-xs text-slate-400 font-mono mb-6 bg-slate-50 p-3 rounded">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Ladda om
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
