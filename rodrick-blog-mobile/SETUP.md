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

---

## Chạy dự án trên máy mới

> Yêu cầu: đã cài xong môi trường ở các phần trên (Node, JDK 17, Android Studio, biến `ANDROID_HOME`).

### 1. Lấy code và cài thư viện

```powershell
git clone https://github.com/kingrodrick/RodrickBlog.git   # máy đã có repo thì chạy `git pull`
cd RodrickBlog\rodrick-blog-mobile
npm install
```

### 2. Khai báo đường dẫn Android SDK

File `android\local.properties` không nằm trong git (mỗi máy một đường dẫn), nên phải tạo lại. Tạo file với một dòng sau, thay `TênBạn` bằng tên người dùng Windows:

```
sdk.dir=C\:\Users\TênBạn\AppData\Local\Android\Sdk
```

### 3. Chạy app

Mở máy ảo trong Android Studio (Virtual Device Manager → Play) hoặc cắm điện thoại Android đã bật USB debugging. Kiểm tra máy đã được nhận:

```powershell
adb devices
```

Rồi chạy:

```powershell
npm run android
```

Lần build đầu mất 5–15 phút vì Gradle tải thư viện.

Build release
npx react-native run-android --mode release

### Xử lý lỗi thường gặp

| Lỗi                                              | Cách xử lý                                                     |
| ------------------------------------------------ | -------------------------------------------------------------- |
| `SDK location not found`                         | Tạo lại `android\local.properties` như bước 2                  |
| App mở lên màn hình đỏ, không kết nối được Metro | `adb reverse tcp:8081 tcp:8081`, rồi lắc máy và chọn Reload    |
| Sửa code không thấy đổi, hoặc lỗi cache lạ       | `npx react-native start --reset-cache`                         |
| Build lỗi sau khi đổi thư viện                   | `cd android; .\gradlew clean; cd ..` rồi `npm run android` lại |
| `adb` không nhận máy                             | Rút cắm lại cáp, chạy `adb kill-server` rồi `adb devices`      |
