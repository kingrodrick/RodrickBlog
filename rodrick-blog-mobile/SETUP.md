# Cài Đặt Môi Trường Mobile (React Native / Android)

### 1. Cài đặt Node.js 22 (qua NVM)
```cmd
nvm install 22
nvm use 22
node -v
npm -v
```

---

### 2. Cài đặt JDK 17 & Cấu hình `JAVA_HOME`
```cmd
winget install EclipseAdoptium.Temurin.17.JDK
```

Set biến môi trường (chạy trong PowerShell, chỉnh lại đường dẫn nếu cài thư mục khác):
```powershell
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17.0.12.7-hotspot", "User")
```

Kiểm tra:
```cmd
java -version
```

---

### 3. Cài đặt Android Studio & SDK
```cmd
winget install Google.AndroidStudio
```

Mở **Android Studio** -> **SDK Manager**:
- **SDK Platforms**: Tick `Android 15 (API 35)`
- **SDK Tools**: Tick `Android SDK Build-Tools`, `Android SDK Command-line Tools`, `Android Emulator`, `Android SDK Platform-Tools` -> Bấm **Apply**.

---

### 4. Cấu hình biến môi trường Android (`ANDROID_HOME` & `Path`)
Chạy trong PowerShell:
```powershell
# Set biến ANDROID_HOME
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")

# Thêm platform-tools và emulator vào Path
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
[Environment]::SetEnvironmentVariable("Path", "$userPath;$env:LOCALAPPDATA\Android\Sdk\platform-tools;$env:LOCALAPPDATA\Android\Sdk\emulator", "User")
```

Kiểm tra:
```cmd
adb --version
```

---

### 5. Quản lý máy ảo (Emulator)
```cmd
# Xem danh sách máy ảo đã tạo
emulator -list-avds

# Chạy máy ảo
emulator -avd <ten_may_ao>

# Kiểm tra thiết bị kết nối
adb devices
```

---

### 6. Kiểm tra môi trường & Chạy dự án
```cmd
# Kiểm tra tổng thể cấu hình môi trường
npx @react-native-community/cli doctor

# Cài đặt dependencies và chạy ứng dụng
npm install
npm run android
```
