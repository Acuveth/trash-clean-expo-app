import storage from './storage';
import { API_BASE_URL } from '../config/constants';

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // Log API request details
  logRequest(method, url, data = null, headers = {}) {
    const timestamp = new Date().toISOString();
    console.group(`🌐 API REQUEST [${method.toUpperCase()}] ${timestamp}`);
    console.log(`📍 URL: ${url}`);
    console.log(`📋 Headers:`, headers);
    if (data) {
      console.log(`📦 Request Data:`, data);
    }
    console.groupEnd();
  }

  // Log API response details
  logResponse(method, url, response, data = null, duration = 0) {
    const timestamp = new Date().toISOString();
    const statusColor = response.ok ? '✅' : '❌';
    
    console.group(`${statusColor} API RESPONSE [${method.toUpperCase()}] ${timestamp}`);
    console.log(`📍 URL: ${url}`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`⏱️ Duration: ${duration}ms`);
    
    if (data) {
      if (response.ok) {
        console.log(`📦 Response Data:`, data);
      } else {
        console.error(`💥 Error Data:`, data);
      }
    }
    console.groupEnd();
  }

  // Log network errors
  logError(method, url, error, duration = 0) {
    const timestamp = new Date().toISOString();
    console.group(`🚨 API ERROR [${method.toUpperCase()}] ${timestamp}`);
    console.log(`📍 URL: ${url}`);
    console.log(`⏱️ Duration: ${duration}ms`);
    console.error(`💥 Error:`, error);
    console.groupEnd();
  }

  // Get headers with authentication
  async getHeaders(customHeaders = {}) {
    const token = await storage.getItemAsync('authToken');
    const headers = {
      ...this.defaultHeaders,
      ...customHeaders,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  // Generic API call method with logging
  async apiCall(method, endpoint, data = null, customHeaders = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const startTime = Date.now();

    try {
      const headers = await this.getHeaders(customHeaders);
      
      // Log the request
      this.logRequest(method, url, data, headers);

      const config = {
        method: method.toUpperCase(),
        headers,
      };

      // Add body for non-GET requests
      if (data && method.toUpperCase() !== 'GET') {
        if (data instanceof FormData) {
          // Remove Content-Type for FormData to let browser set it with boundary
          delete config.headers['Content-Type'];
          config.body = data;
        } else {
          config.body = JSON.stringify(data);
        }
      }

      const response = await fetch(url, config);
      const duration = Date.now() - startTime;

      let responseData = null;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      // Log the response
      this.logResponse(method, url, response, responseData, duration);

      if (!response.ok) {
        throw new APIError(
          responseData?.message || responseData?.error || `HTTP ${response.status}`,
          response.status,
          responseData
        );
      }

      return responseData;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logError(method, url, error, duration);
      throw error;
    }
  }

  // HTTP method helpers
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const finalEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.apiCall('GET', finalEndpoint);
  }

  async post(endpoint, data = null, customHeaders = {}) {
    return this.apiCall('POST', endpoint, data, customHeaders);
  }

  async put(endpoint, data = null, customHeaders = {}) {
    return this.apiCall('PUT', endpoint, data, customHeaders);
  }

  async patch(endpoint, data = null, customHeaders = {}) {
    return this.apiCall('PATCH', endpoint, data, customHeaders);
  }

  async delete(endpoint, data = null) {
    return this.apiCall('DELETE', endpoint, data);
  }

  // File upload helper
  async upload(endpoint, formData, onProgress = null) {
    const url = `${this.baseURL}${endpoint}`;
    const startTime = Date.now();

    try {
      const headers = await this.getHeaders();
      // Remove Content-Type for file uploads
      delete headers['Content-Type'];

      this.logRequest('POST', url, 'FormData (file upload)', headers);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const duration = Date.now() - startTime;
      const responseData = await response.json();

      this.logResponse('POST', url, response, responseData, duration);

      if (!response.ok) {
        throw new APIError(
          responseData?.message || responseData?.error || `HTTP ${response.status}`,
          response.status,
          responseData
        );
      }

      return responseData;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logError('POST', url, error, duration);
      throw error;
    }
  }
}

// Custom API Error class
class APIError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }

  toString() {
    return `APIError(${this.status}): ${this.message}`;
  }
}

// Create singleton instance
const apiClient = new APIClient();

// Export both the instance and the class
export { APIError };
export default apiClient;