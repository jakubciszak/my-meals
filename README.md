# my-meals

## Konfiguracja Google Drive

Aplikacja obsługuje synchronizację danych z Google Drive. Aby włączyć tę funkcję:

### 1. Utwórz OAuth Client w Google Cloud Console

1. Przejdź do [Google Cloud Console](https://console.cloud.google.com)
2. Utwórz nowy projekt lub wybierz istniejący
3. Włącz **Google Drive API**
4. Przejdź do **Credentials** → **Create Credentials** → **OAuth client ID**
5. Wybierz typ: **Web application**
6. Dodaj **Authorized JavaScript origins**:
   - `http://localhost:5173` (development)
   - `https://YOUR_USERNAME.github.io` (production)
7. Dodaj **Authorized redirect URIs**:
   - `https://YOUR_USERNAME.github.io`

### 2. Skonfiguruj zmienną środowiskową

**Dla GitHub Pages (produkcja):**
- W repozytorium: Settings → Secrets and variables → Actions
- Dodaj secret: `VITE_GOOGLE_CLIENT_ID` z wartością Client ID

**Dla lokalnego developmentu:**
- Stwórz plik `.env.local`:
  ```
  VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
  ```

> **Uwaga:** Potrzebujesz tylko `client_id`. Wartość `client_secret` z pliku JSON nie jest używana w aplikacjach frontendowych.