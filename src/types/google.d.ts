// Google Identity Services types
declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenClient {
        requestAccessToken(options?: { prompt?: string }): void
        callback: (response: TokenResponse) => void
      }

      interface TokenResponse {
        access_token: string
        expires_in: number
        scope: string
        token_type: string
        error?: string
        error_description?: string
      }

      interface TokenClientConfig {
        client_id: string
        scope: string
        callback: (response: TokenResponse) => void
        error_callback?: (error: { type: string; message: string }) => void
      }

      function initTokenClient(config: TokenClientConfig): TokenClient
      function revoke(accessToken: string, callback?: () => void): void
    }
  }
}

interface Window {
  google?: typeof google
}
