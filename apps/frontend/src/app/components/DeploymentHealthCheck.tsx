
'use client';

import React, { useState, useEffect } from 'react';

interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'pending';
  message: string;
}

export function DeploymentHealthCheck() {
  const [checks, setChecks] = useState<HealthCheck[]>([
    { name: 'Dependencies', status: 'pending', message: 'Checking...' },
    { name: 'Build Files', status: 'pending', message: 'Checking...' },
    { name: 'Environment Variables', status: 'pending', message: 'Checking...' },
    { name: 'API Endpoints', status: 'pending', message: 'Checking...' }
  ]);

  useEffect(() => {
    runHealthChecks();
  }, []);

  const runHealthChecks = async () => {
    // Check dependencies
    try {
      const deps = ['react', 'react-dom', 'next'];
      const allPresent = deps.every(dep => {
        try {
          require.resolve(dep);
          return true;
        } catch {
          return false;
        }
      });
      
      updateCheck('Dependencies', allPresent ? 'pass' : 'fail', 
        allPresent ? 'All dependencies found' : 'Missing dependencies');
    } catch (err) {
      updateCheck('Dependencies', 'fail', 'Check failed');
    }

    // Check environment variables
    const requiredEnvs = ['NEXT_PUBLIC_BACKEND_URL'];
    const envCheck = requiredEnvs.every(env => process.env[env]);
    updateCheck('Environment Variables', envCheck ? 'pass' : 'fail',
      envCheck ? 'All required env vars set' : 'Missing env vars');

    // Check API connectivity
    try {
      const response = await fetch('/api/health');
      updateCheck('API Endpoints', response.ok ? 'pass' : 'fail',
        response.ok ? 'API accessible' : 'API unreachable');
    } catch {
      updateCheck('API Endpoints', 'fail', 'Cannot reach API');
    }
  };

  const updateCheck = (name: string, status: 'pass' | 'fail', message: string) => {
    setChecks(prev => prev.map(check => 
      check.name === name ? { ...check, status, message } : check
    ));
  };

  const allPassed = checks.every(c => c.status === 'pass');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">🏥 Deployment Health</h2>
      <div className="space-y-3">
        {checks.map(check => (
          <div key={check.name} className="flex items-center justify-between p-3 border rounded">
            <div>
              <span className="font-semibold">{check.name}</span>
              <p className="text-sm text-gray-600">{check.message}</p>
            </div>
            <span className={`text-2xl ${
              check.status === 'pass' ? '✅' :
              check.status === 'fail' ? '❌' : '⏳'
            }`} />
          </div>
        ))}
      </div>
      <div className={`mt-4 p-4 rounded ${
        allPassed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
      }`}>
        {allPassed ? '✅ Ready to deploy!' : '⚠️ Fix issues before deploying'}
      </div>
    </div>
  );
}
