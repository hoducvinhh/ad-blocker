# Universal Ad Blocker

Tiện ích mở rộng chặn quảng cáo cơ bản cho **Google Chrome** và **Microsoft Edge**, dùng chung một codebase theo chuẩn Manifest V3.

> Đây là MVP phục vụ học tập và thử nghiệm. Extension chưa hỗ trợ đầy đủ cú pháp EasyList/uBlock, không đảm bảo chặn mọi quảng cáo và có thể cần tinh chỉnh filter theo từng website.

## Tính năng

- Bật/tắt bảo vệ toàn cục từ popup.
- Chặn một số request quảng cáo bằng Declarative Net Request (DNR).
- Ẩn một số phần tử quảng cáo bằng CSS selector và `MutationObserver`.
- Whitelist domain; domain và các subdomain của nó được loại trừ khỏi lọc.
- Lưu cấu hình và bộ đếm phần tử bị ẩn trong `chrome.storage.local`.
- Trang Settings có General, Filter Lists, Whitelist, Privacy, Statistics và About.
- Import/export một phần cấu hình dưới dạng JSON.
- Tạo build riêng cho Chrome và Edge từ cùng source code.

## Yêu cầu

- Node.js 18 trở lên.
- npm.
- Google Chrome hoặc Microsoft Edge.

Không cần cài package npm bên ngoài để build hoặc chạy unit tests.

## Build và kiểm thử

Mở terminal tại thư mục dự án rồi chạy:

```sh
npm test
npm run build
```

Lệnh `npm test` chạy unit tests cho domain, storage defaults và rule parser.
Lệnh `npm run build` xóa `dist/` cũ rồi tạo:

```text
dist/chrome/
dist/edge/
```

Có thể build riêng một trình duyệt:

```sh
npm run build:chrome
npm run build:edge
```

## Cài đặt lần đầu

Build trước bằng `npm run build`, sau đó chọn **thư mục build**, không chọn riêng file `manifest.json`.

### Google Chrome

1. Mở `chrome://extensions`.
2. Bật **Developer mode**.
3. Chọn **Load unpacked**.
4. Chọn thư mục `dist/chrome`.
5. Ghim extension từ menu Extensions nếu muốn mở popup thuận tiện.

### Microsoft Edge

1. Mở `edge://extensions`.
2. Bật **Developer mode**.
3. Chọn **Load unpacked**.
4. Chọn thư mục `dist/edge`.
5. Ghim extension từ menu Extensions nếu muốn mở popup thuận tiện.

## Sử dụng

### Popup

Nhấn icon **Universal Ad Blocker** để:

- Bật hoặc tắt **Protection** toàn cục.
- Xem domain của tab hiện tại.
- Thêm domain hiện tại vào whitelist hoặc bỏ whitelist.
- Xem bộ đếm phần tử bị ẩn và request bị chặn.
- Mở trang **Settings**.

Các trang nội bộ của trình duyệt như `chrome://` và `edge://` không phải website thông thường, nên extension không chạy content script trên các trang đó.

### Settings

- **General**: bật/tắt bảo vệ toàn cục và cosmetic filtering. Behavior protection hiện chưa được triển khai và bị khóa.
- **Filter Lists**: xem số dynamic rules đang hoạt động và yêu cầu nạp lại filter đi kèm extension.
- **Whitelist**: thêm hoặc xóa hostname.
- **Privacy**: xem thông tin về dữ liệu được lưu local.
- **Statistics**: xem aggregate counters.
- **Import/Export**: sao lưu hoặc khôi phục cấu hình JSON đã hỗ trợ.

### Whitelist

Nhập hostname, ví dụ:

```text
example.com
```

Không cần thêm đường dẫn trang. Khi `example.com` được whitelist, `news.example.com` cũng được coi là thuộc whitelist. Tùy thay đổi, hãy tải lại tab để content script áp dụng trạng thái mới trên toàn trang.

## Cập nhật sau khi sửa source

Extension được trình duyệt load từ thư mục `dist`, không trực tiếp từ `src`. Sau khi thay đổi source, filter JSON hoặc manifest:

1. Chạy `npm run build`.
2. Mở `chrome://extensions` hoặc `edge://extensions`.
3. Nhấn **Reload** trên thẻ extension.
4. Tải lại các tab website đang mở để content script mới chạy.

Không cần chạy build khi chỉ bật/tắt protection hoặc sửa whitelist trong giao diện.

## Filter rules

### Network rules

`filters/custom-rules.json` chứa một tập nhỏ rule có cấu trúc riêng, được chuyển thành DNR rules. Các rule mẫu nhắm đến một số domain quảng cáo phổ biến và chỉ áp dụng cho một số loại tài nguyên.

### Cosmetic rules

`filters/cosmetic-rules.json` chứa CSS selector toàn cục và selector theo domain. Content script quét DOM ban đầu và xử lý node mới bằng `MutationObserver`.

### Thêm hoặc sửa rules

1. Chỉnh file JSON tương ứng trong `filters/`.
2. Với network rules, giữ `id` dương và duy nhất, `priority` hợp lệ, `action` là `block` hoặc `allow`, và resource types được Chromium hỗ trợ.
3. Với cosmetic rules, chỉ thêm selector đã kiểm tra để tránh ẩn nhầm nội dung chính.
4. Chạy `npm test` và `npm run build`.
5. Reload extension và thử trên website phù hợp.

Filter files là dữ liệu; extension không tải hoặc thực thi JavaScript từ xa. MVP chưa chuyển đổi cú pháp EasyList/uBlock và chưa tự động cập nhật danh sách filter từ Internet.

## Giới hạn hiện tại

- Chỉ có một số network rules và cosmetic selectors mẫu; không thể chặn 100% quảng cáo.
- Quảng cáo first-party, quảng cáo trong luồng video, quảng cáo được render phức tạp hoặc website thay đổi DOM có thể không bị chặn.
- Một số rule có thể gây false positive. Nếu website lỗi, hãy thử tắt protection hoặc whitelist domain đó.
- Behavior protection chưa có implementation; công tắc đang bị khóa.
- Bộ đếm `Requests blocked` hiện chưa được nối với một counter thực tế của DNR nên có thể luôn là `0`. Không xem số dynamic rules là số request đã chặn.
- Cần kiểm tra thủ công việc load và hành vi trên Chrome và Edge; unit tests không thay thế browser testing.

## Quyền và quyền riêng tư

Manifest hiện yêu cầu `storage`, `tabs`, `declarativeNetRequest`, `declarativeNetRequestWithHostAccess` và host access cho website. Host access rộng được dùng cho mục tiêu chặn và lọc trên nhiều website; người dùng có thể xem quyền trong trang Extensions của trình duyệt.

Cấu hình và bộ đếm được lưu local. Extension không gửi browsing history hoặc dữ liệu cá nhân về server. Không có backend hoặc telemetry.

## Cấu trúc dự án

```text
src/
  background/  Service worker và thống kê
  content/     Content script, DOM scanner, behavior protection placeholder
  core/        DNR, rule parser, whitelist, cosmetic filtering
  options/     Trang Settings
  popup/       Popup extension
  shared/      Hằng số, storage và domain helpers
filters/       Network và cosmetic rule data
manifests/     Manifest cho Chrome và Edge
scripts/       Build script
test/unit/     Unit tests
```

## Lệnh npm

| Lệnh | Tác dụng |
|---|---|
| `npm test` | Chạy unit tests |
| `npm run build` | Build cả Chrome và Edge |
| `npm run build:chrome` | Build Chrome vào `dist/chrome` |
| `npm run build:edge` | Build Edge vào `dist/edge` |
| `npm run clean` | Xóa thư mục `dist` |

## Đóng góp và báo lỗi

Khi báo lỗi, hãy ghi trình duyệt/phiên bản, bước tái hiện, website hoặc fixture kiểm thử và hành vi mong đợi. Không gửi cookie, token, thông tin đăng nhập hoặc lịch sử duyệt web.
