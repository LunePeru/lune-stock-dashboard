
import { toast } from "@/components/ui/sonner";

const API_URL = "http://localhost:8080/api"; // Change this to your actual backend URL

class ApiClient {
  private getAuthToken(): string | null {
    return localStorage.getItem("lunestock_token");
  }

  private async handleResponse(response: Response) {
    const data = await response.json();
    
    if (!response.ok) {
      const error = data.message || response.statusText;
      toast.error(error);
      throw new Error(error);
    }
    
    return data;
  }

  async get(endpoint: string) {
    const token = this.getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers
      });
      
      return this.handleResponse(response);
    } catch (error) {
      toast.error('Network error occurred');
      throw error;
    }
  }

  async post(endpoint: string, data: any) {
    const token = this.getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      
      return this.handleResponse(response);
    } catch (error) {
      toast.error('Network error occurred');
      throw error;
    }
  }

  async put(endpoint: string, data: any) {
    const token = this.getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      });
      
      return this.handleResponse(response);
    } catch (error) {
      toast.error('Network error occurred');
      throw error;
    }
  }

  async delete(endpoint: string) {
    const token = this.getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers
      });
      
      return this.handleResponse(response);
    } catch (error) {
      toast.error('Network error occurred');
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
