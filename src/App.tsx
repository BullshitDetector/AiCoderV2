// src/App.tsx
import React from 'react';
import Layout from './components/Layout';

export default function App() {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">AiCoderV2</h1>
          <p className="text-lg text-gray-600">
            Type a prompt → AI builds → preview updates.
          </p>
        </div>
      </div>
    </Layout>
  );
}