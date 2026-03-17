interface UaDetectResult {
  platform: string;
  deviceType: string;
  os: string;
  browser: string;
}

const PLATFORM_PATTERNS: [string, RegExp][] = [
  ["wechat", /MicroMessenger/i],
  ["qq", /QQ\//i],
  ["weibo", /Weibo/i],
  ["alipay", /AlipayClient/i],
  ["douyin", /Bytedance|ByteLocale|TikTok/i],
  ["dingtalk", /DingTalk/i],
];

const OS_PATTERNS: [string, RegExp][] = [
  ["iOS", /iPhone|iPad|iPod/i],
  ["Android", /Android/i],
  ["Windows", /Windows NT/i],
  ["Mac", /Macintosh|Mac OS/i],
  ["Linux", /Linux/i],
];

const BROWSER_PATTERNS: [string, RegExp][] = [
  ["Edge", /Edg\//i],
  ["Chrome", /Chrome\//i],
  ["Firefox", /Firefox\//i],
  ["Safari", /Safari\//i],
  ["Opera", /OPR\//i],
];

export function detectUA(ua: string): UaDetectResult {
  let platform = "browser";
  for (const [name, pattern] of PLATFORM_PATTERNS) {
    if (pattern.test(ua)) {
      platform = name;
      break;
    }
  }

  let deviceType = "desktop";
  if (/Mobile|Android|iPhone|iPod/i.test(ua)) {
    deviceType = "mobile";
  } else if (/iPad|Tablet/i.test(ua)) {
    deviceType = "tablet";
  }

  let os = "other";
  for (const [name, pattern] of OS_PATTERNS) {
    if (pattern.test(ua)) {
      os = name;
      break;
    }
  }

  let browser = "other";
  for (const [name, pattern] of BROWSER_PATTERNS) {
    if (pattern.test(ua)) {
      browser = name;
      break;
    }
  }

  return { platform, deviceType, os, browser };
}

export interface UaRule {
  name: string;
  pattern: string;
  action: "show_tip" | "redirect_other" | "block";
  tipContent?: string;
  redirectUrl?: string;
}

export function matchUaRules(ua: string, rules: UaRule[]): UaRule | null {
  for (const rule of rules) {
    try {
      const regex = new RegExp(rule.pattern, "i");
      if (regex.test(ua)) {
        return rule;
      }
    } catch {
      if (ua.includes(rule.pattern)) {
        return rule;
      }
    }
  }
  return null;
}
