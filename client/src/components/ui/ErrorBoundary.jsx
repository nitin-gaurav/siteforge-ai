import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="grid min-h-screen place-items-center bg-[#eef1f5] px-4 text-ink">
          <div className="w-full max-w-xl rounded-md border border-line bg-white p-6 shadow-soft">
            <h1 className="text-xl font-black">The app hit a startup error</h1>
            <p className="mt-2 text-sm text-slate-600">Check the message below, then refresh after fixing it.</p>
            <pre className="mt-4 overflow-auto rounded-md bg-red-50 p-4 text-sm text-red-800">
              {this.state.error.message}
            </pre>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
