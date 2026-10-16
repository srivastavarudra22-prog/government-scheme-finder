/**
 * @file NotFoundPage.jsx
 * @description Functional placeholder for 404 Route Not Found
 */

import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>404 - Page Not Found</h2>
      <p>The requested route does not exist.</p>
      <Link to="/">Return to Home</Link>
    </div>
  );
}
