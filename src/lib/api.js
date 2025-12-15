const API_BASE_URL = process.env.NEXT_PUBLIC_LIVEKIT_API_URL

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async createSession(agentId) {
    const url = `${this.baseUrl}/session`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // body: JSON.stringify({ agent_id: agentId }),
        body: JSON.stringify({ agent_id: 6 }), // Temporary hardcoded agent ID
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
        try {
          const errorBody = await response.json();
          errorMessage += ` - ${errorBody.detail || 'No details provided'}`;
        } catch (e) {
          // Ignore if we can't read the error body
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - please check your connection');
        }
        if (error.message.includes('fetch')) {
          throw new Error('Unable to connect to backend - please ensure the server is running');
        }
      }
      throw error;
    }
  }
}

export const apiService = new ApiService();