# Owlet Adventure — bản web

Cần Node.js 24 và npm. Từ thư mục gốc của project:

```sh
cd web-phaser
npm ci
npm run dev
```

Mở địa chỉ được in trong terminal (mặc định là http://127.0.0.1:5173/).

Điều khiển: **A/D** để di chuyển, **Space** để nhảy, chuột trái để đánh, chuột phải để dùng đòn mạnh và **Esc** để tạm dừng.

```sh
npm run build
npm test
```

Lệnh test cần thêm JDK với `java` và `javac` trong PATH, cùng thư mục source Java và `res` ở project gốc để đối chiếu hành vi.
