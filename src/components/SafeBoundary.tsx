import { Component, ReactNode } from 'react';

/**
 * Isolates non-essential children so they can never take the site down.
 *
 * Analytics is strictly observational: if it throws, visitors must still see the
 * page. Without this, an exception inside <Analytics /> would propagate to the
 * root and blank the whole app — losing real visitors to protect a page-view
 * count, which is exactly the wrong trade.
 */
export default class SafeBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[SafeBoundary] non-essential component failed:', error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
