# 外部 API 接入指南

## 概述

短链管理系统提供两个外部 API，供跳转服务调用：

| 接口 | 路径 | 用途 |
|------|------|------|
| 解析短链 | `POST /api/external/resolve` | 根据短码获取目标URL和防封配置 |
| 上报日志 | `POST /api/external/log` | 上报访问日志用于统计分析 |

所有外部 API 请求均需 HMAC-SHA256 签名验证。

---

## 认证机制

### 签名算法

每个请求需要在 HTTP Header 中携带三个字段：

| Header | 说明 |
|--------|------|
| `X-Origin` | 来源标识（如你的服务名称或域名） |
| `X-Timestamp` | 当前 Unix 时间戳（秒） |
| `X-Signature` | HMAC-SHA256 签名（hex 格式） |

签名计算方式：

```
message = "{origin}\n{timestamp}\n{request_body_json}"
signature = HMAC-SHA256(secret, message)  →  hex string
```

其中 `secret` 是 HMAC 密钥，可在管理后台 **系统设置 → API 密钥** 页面查看复制。

### 安全约束

- 时间戳与服务器时间偏差超过 **±300 秒** 将拒绝请求（防重放攻击）
- 请确保客户端服务器时间与 NTP 同步

---

## 接口详情

### 1. 解析短链

**POST /api/external/resolve**

请求体：
```json
{ "shortCode": "Z7HWHE" }
```

响应体：
```json
{
  "success": true,
  "data": {
    "targetUrl": "https://example.com/product/123",
    "shortCode": "Z7HWHE",
    "status": "active",
    "antiban": {
      "enableIntermediate": true,
      "intermediateType": "browser_tip",
      "intermediateContent": null,
      "enableUaDetection": true,
      "uaRules": [
        {
          "name": "微信",
          "pattern": "MicroMessenger",
          "action": "show_tip",
          "tipContent": "请点击右上角，选择在浏览器中打开"
        }
      ]
    }
  }
}
```

### 2. 上报访问日志

**POST /api/external/log**

请求体：
```json
{
  "shortCode": "Z7HWHE",
  "ip": "1.2.3.4",
  "userAgent": "Mozilla/5.0 ... MicroMessenger/8.0",
  "referer": "https://weixin.qq.com",
  "actionTaken": "intermediate"
}
```

`actionTaken` 可选值: `redirect`（直接跳转）、`intermediate`（展示中间页）、`ua_block`（UA拦截）

响应体：
```json
{ "success": true, "message": "Log recorded" }
```

---

## 客户端示例代码

### Node.js

```js
const crypto = require("crypto");

const API_BASE = "https://your-shorturl-server.com";
const HMAC_SECRET = "从管理后台系统设置页面复制的密钥";
const ORIGIN = "my-redirect-service";

function callApi(path, body) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const bodyJson = JSON.stringify(body);
  const message = `${ORIGIN}\n${timestamp}\n${bodyJson}`;
  const signature = crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(message)
    .digest("hex");

  return fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Origin": ORIGIN,
      "X-Timestamp": timestamp,
      "X-Signature": signature,
    },
    body: bodyJson,
  }).then((r) => r.json());
}

// 解析短链
const result = await callApi("/api/external/resolve", { shortCode: "Z7HWHE" });
console.log(result.data.targetUrl);

// 上报日志
await callApi("/api/external/log", {
  shortCode: "Z7HWHE",
  ip: "1.2.3.4",
  userAgent: req.headers["user-agent"],
  referer: req.headers["referer"],
  actionTaken: "redirect",
});
```

### Python

```python
import hmac, hashlib, time, json, requests

API_BASE = "https://your-shorturl-server.com"
HMAC_SECRET = "从管理后台系统设置页面复制的密钥"
ORIGIN = "my-redirect-service"

def call_api(path, body):
    timestamp = str(int(time.time()))
    body_json = json.dumps(body, separators=(",", ":"))
    message = f"{ORIGIN}\n{timestamp}\n{body_json}"
    signature = hmac.new(
        HMAC_SECRET.encode(), message.encode(), hashlib.sha256
    ).hexdigest()

    return requests.post(
        f"{API_BASE}{path}",
        json=body,
        headers={
            "X-Origin": ORIGIN,
            "X-Timestamp": timestamp,
            "X-Signature": signature,
        },
    ).json()

# 解析短链
result = call_api("/api/external/resolve", {"shortCode": "Z7HWHE"})
print(result["data"]["targetUrl"])

# 上报日志
call_api("/api/external/log", {
    "shortCode": "Z7HWHE",
    "ip": "1.2.3.4",
    "userAgent": "Mozilla/5.0 ...",
    "referer": "https://weixin.qq.com",
    "actionTaken": "redirect",
})
```

### cURL

```bash
SECRET="你的HMAC密钥"
ORIGIN="my-service"
TIMESTAMP=$(date +%s)
BODY='{"shortCode":"Z7HWHE"}'

SIGNATURE=$(printf '%s\n%s\n%s' "$ORIGIN" "$TIMESTAMP" "$BODY" \
  | openssl dgst -sha256 -hmac "$SECRET" -hex | awk '{print $NF}')

curl -X POST https://your-shorturl-server.com/api/external/resolve \
  -H "Content-Type: application/json" \
  -H "X-Origin: $ORIGIN" \
  -H "X-Timestamp: $TIMESTAMP" \
  -H "X-Signature: $SIGNATURE" \
  -d "$BODY"
```

### Go

```go
package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"
)

const (
	apiBase    = "https://your-shorturl-server.com"
	hmacSecret = "从管理后台系统设置页面复制的密钥"
	origin     = "my-redirect-service"
)

func callAPI(path, bodyJSON string) (*http.Response, error) {
	timestamp := strconv.FormatInt(time.Now().Unix(), 10)
	message := fmt.Sprintf("%s\n%s\n%s", origin, timestamp, bodyJSON)

	mac := hmac.New(sha256.New, []byte(hmacSecret))
	mac.Write([]byte(message))
	signature := hex.EncodeToString(mac.Sum(nil))

	req, _ := http.NewRequest("POST", apiBase+path, strings.NewReader(bodyJSON))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Origin", origin)
	req.Header.Set("X-Timestamp", timestamp)
	req.Header.Set("X-Signature", signature)

	return http.DefaultClient.Do(req)
}
```
