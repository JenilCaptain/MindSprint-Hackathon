const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface AuthResponse {
  _id: string;
  name: string;
  email: string;
  token: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface ApiError {
  message: string;
  status?: number;
  errors?: Array<{ field: string; message: string }>;
}

class ApiClient {
  private baseURL: string;
  private retryCount = 2;
  private retryDelay = 1000;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryAttempt = 0
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    // Add auth token if available
    const token = this.getToken();
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      
      // Handle different HTTP status codes
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'An error occurred'
        }));

        // Handle 401 (Unauthorized) - Token might be expired
        if (response.status === 401) {
          this.removeToken();
          localStorage.removeItem('user');
          
          // Only redirect to login if not already on login page
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/';
          }
        }

        // Handle 429 (Rate Limited)
        if (response.status === 429 && retryAttempt < this.retryCount) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : this.retryDelay * Math.pow(2, retryAttempt);
          
          console.warn(`Rate limited. Retrying after ${delay}ms...`);
          await this.sleep(delay);
          return this.request<T>(endpoint, options, retryAttempt + 1);
        }

        const apiError: ApiError = {
          message: errorData.message || `HTTP error! status: ${response.status}`,
          status: response.status,
          errors: errorData.errors,
        };

        throw apiError;
      }

      return await response.json();
    } catch (error) {
      // Network errors or fetch failures
      if (error instanceof TypeError && error.message.includes('fetch')) {
        if (retryAttempt < this.retryCount) {
          console.warn(`Network error. Retrying... (${retryAttempt + 1}/${this.retryCount})`);
          await this.sleep(this.retryDelay * Math.pow(2, retryAttempt));
          return this.request<T>(endpoint, options, retryAttempt + 1);
        }
        throw new Error('Network error: Unable to connect to server');
      }

      // Re-throw ApiError or other known errors
      if (error && typeof error === 'object' && 'message' in error) {
        throw error;
      }

      throw new Error('An unexpected error occurred');
    }
  }

  // Token management
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  // Auth endpoints
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async logout(): Promise<void> {
    this.removeToken();
  }

  // Subscription endpoints
  async getSubscriptions(): Promise<any[]> {
    return this.request('/subscriptions');
  }

  async createSubscription(data: any): Promise<any> {
    // Validate required fields on client side
    const requiredFields = ['serviceName', 'category', 'cost', 'billingCycle', 'nextRenewalDate', 'paymentMethod'];
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`${field} is required`);
      }
    }

    // Ensure nextRenewalDate is in the future
    const renewalDate = new Date(data.nextRenewalDate);
    if (renewalDate <= new Date()) {
      throw new Error('Next renewal date must be in the future');
    }

    return this.request('/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        cost: parseFloat(data.cost), // Ensure cost is a number
      }),
    });
  }

  async updateSubscription(id: string, data: any): Promise<any> {
    if (!id) {
      throw new Error('Subscription ID is required');
    }

    // If updating cost, ensure it's a number
    if (data.cost !== undefined) {
      data.cost = parseFloat(data.cost);
    }

    // If updating nextRenewalDate, ensure it's in the future
    if (data.nextRenewalDate) {
      const renewalDate = new Date(data.nextRenewalDate);
      if (renewalDate <= new Date()) {
        throw new Error('Next renewal date must be in the future');
      }
    }

    return this.request(`/subscriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSubscription(id: string): Promise<void> {
    if (!id) {
      throw new Error('Subscription ID is required');
    }

    return this.request(`/subscriptions/${id}`, {
      method: 'DELETE',
    });
  }

  async getSubscription(id: string): Promise<any> {
    if (!id) {
      throw new Error('Subscription ID is required');
    }

    return this.request(`/subscriptions/${id}`);
  }

  // Dashboard endpoints
  async getDashboardStats(): Promise<any> {
    return this.request('/dashboard/summary');
  }

  async getUpcomingRenewals(): Promise<any[]> {
    return this.request('/dashboard/upcoming-renewals');
  }

  // Notification endpoints
  async getNotifications(): Promise<any[]> {
    return this.request('/notifications');
  }

  async getUnreadNotificationCount(): Promise<{ count: number }> {
    return this.request('/notifications/unread-count');
  }

  async markNotificationAsRead(id: string): Promise<any> {
    return this.request(`/notifications/${id}/mark-read`, {
      method: 'PUT',
    });
  }

  async createSampleNotifications(): Promise<any> {
    return this.request('/notifications/create-samples', {
      method: 'POST',
    });
  }

  async createSampleSubscription(): Promise<any> {
    return this.request('/subscriptions/create-sample', {
      method: 'POST',
    });
  }

  // Advanced notification features (via API bridge)
  async sendTestEmail(type: 'welcome' | 'renewal_reminder' = 'welcome'): Promise<any> {
    return this.request('/notifications/test-email', {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  }

  async triggerNotificationCheck(): Promise<any> {
    return this.request('/notifications/manual-check', {
      method: 'POST',
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
