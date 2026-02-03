# my-meals

Aplikacja do planowania posiłków dla całej rodziny.

## Synchronizacja danych

Aplikacja oferuje dwie metody synchronizacji:

### Google Sheets (współdzielone) - ZALECANE dla rodzin

Idealne do współdzielenia danych z rodziną. Dane są przechowywane w arkuszu Google, który można udostępnić innym osobom.

**Jak skonfigurować współdzielenie:**

1. Utwórz nowy arkusz Google Sheets (https://sheets.google.com)
2. Skopiuj ID arkusza z URL: `docs.google.com/spreadsheets/d/`**`ID_ARKUSZA`**`/edit`
3. W aplikacji wklej ID arkusza w ustawieniach
4. Kliknij "Połącz z Google Sheets"
5. Udostępnij arkusz innym członkom rodziny (z prawami edycji)
6. Każda osoba wkleja to samo ID arkusza w swoich ustawieniach

Aplikacja automatycznie utworzy dwa arkusze: "Meals" (posiłki) i "Family" (członkowie rodziny).

### Google Drive (prywatne)

Synchronizacja na Twój prywatny dysk Google Drive. Dane są przechowywane jako pliki CSV w głównym katalogu dysku.

## Konfiguracja Google API

Aby włączyć synchronizację (zarówno Sheets jak i Drive):

### 1. Utwórz OAuth Client w Google Cloud Console

1. Przejdź do [Google Cloud Console](https://console.cloud.google.com)
2. Utwórz nowy projekt lub wybierz istniejący
3. Włącz **Google Drive API** i **Google Sheets API**
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