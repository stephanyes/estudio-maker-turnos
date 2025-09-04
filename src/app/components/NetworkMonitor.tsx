'use client';
import { useState, useEffect } from 'react';

interface RequestInfo {
  url: string;
  method: string;
  status: number;
  type: string;
  timestamp: number;
}

export default function NetworkMonitor() {
  const [requests, setRequests] = useState<RequestInfo[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    // Interceptar fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url, options] = args;
      const startTime = Date.now();
      
      try {
        const response = await originalFetch(...args);
        const endTime = Date.now();
        
        const requestInfo: RequestInfo = {
          url: typeof url === 'string' ? url : url.toString(),
          method: options?.method || 'GET',
          status: response.status,
          type: 'fetch',
          timestamp: endTime
        };
        
        setRequests(prev => [...prev.slice(-49), requestInfo]); // Mantener solo los últimos 50
        
        return response;
      } catch (error) {
        const endTime = Date.now();
        
        const requestInfo: RequestInfo = {
          url: typeof url === 'string' ? url : url.toString(),
          method: options?.method || 'GET',
          status: 0,
          type: 'fetch-error',
          timestamp: endTime
        };
        
        setRequests(prev => [...prev.slice(-49), requestInfo]);
        throw error;
      }
    };

    // Interceptar XMLHttpRequest (simplificado)
    const originalXHR = window.XMLHttpRequest;
    (window as any).XMLHttpRequest = function() {
      const xhr = new originalXHR();
      const originalOpen = xhr.open;
      const originalSend = xhr.send;
      
      let method = 'GET';
      let url = '';
      
      xhr.open = function(m: string, u: string | URL, async?: boolean, username?: string | null, password?: string | null) {
        method = m;
        url = u.toString();
        return originalOpen.call(this, m, u, async ?? true, username, password);
      };
      
      xhr.send = function(data?: Document | XMLHttpRequestBodyInit | null) {
        xhr.addEventListener('loadend', () => {
          const requestInfo: RequestInfo = {
            url,
            method,
            status: xhr.status,
            type: 'xhr',
            timestamp: Date.now()
          };
          
          setRequests(prev => [...prev.slice(-49), requestInfo]);
        });
        
        return originalSend.call(this, data);
      };
      
      return xhr;
    };

    // Cleanup
    return () => {
      window.fetch = originalFetch;
      window.XMLHttpRequest = originalXHR;
    };
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const requestCounts = requests.reduce((acc, req) => {
    const key = req.type;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalRequests = requests.length;
  const recentRequests = requests.slice(-10);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 left-4 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium z-50 hover:bg-blue-700 transition-colors"
      >
        📊 {totalRequests} requests
      </button>

      {/* Monitor Panel */}
      {isVisible && (
        <div className="fixed bottom-16 left-4 bg-black/90 text-white p-4 rounded-lg shadow-xl max-w-md w-full z-50 text-xs">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm">🔍 Network Monitor</h3>
            <button
              onClick={() => setRequests([])}
              className="text-gray-400 hover:text-white text-xs"
            >
              Clear
            </button>
          </div>

          {/* Summary */}
          <div className="mb-3 p-2 bg-gray-800 rounded">
            <div className="text-xs text-gray-300 mb-1">Total Requests: {totalRequests}</div>
            <div className="flex gap-2 text-xs">
              {Object.entries(requestCounts).map(([type, count]) => (
                <span key={type} className="bg-blue-600 px-2 py-1 rounded">
                  {type}: {count}
                </span>
              ))}
            </div>
          </div>

          {/* Recent Requests */}
          <div className="max-h-40 overflow-y-auto">
            <div className="text-xs text-gray-300 mb-1">Recent Requests:</div>
            {recentRequests.map((req, index) => (
              <div key={index} className="flex justify-between items-center py-1 border-b border-gray-700 last:border-b-0">
                <div className="flex-1 min-w-0">
                  <div className="truncate text-xs">
                    {req.method} {req.url.split('/').pop() || req.url}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <span className={`px-1 rounded text-xs ${
                    req.status >= 200 && req.status < 300 ? 'bg-green-600' :
                    req.status >= 400 ? 'bg-red-600' : 'bg-yellow-600'
                  }`}>
                    {req.status}
                  </span>
                  <span className="text-gray-400 text-xs">{req.type}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Performance Tips */}
          {totalRequests > 50 && (
            <div className="mt-3 p-2 bg-yellow-600/20 border border-yellow-600 rounded text-xs">
              ⚠️ High request count detected. Consider:
              <ul className="mt-1 text-xs text-gray-300">
                <li>• Check React Query cache settings</li>
                <li>• Optimize image loading</li>
                <li>• Reduce API calls</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </>
  );
}
