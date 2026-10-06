import { test, expect } from "@playwright/test";

test("email sign up → my page → log out → log in (wrong password, then right)", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  // /my and /me are protected.
  await page.goto("/my");
  await expect(page).toHaveURL(/\/login\?next=%2Fmy$/);
  await expect(page.getByText("로그인이 필요한 페이지예요.")).toBeVisible();

  await page.getByRole("link", { name: "회원가입" }).click();
  await expect(page).toHaveURL(/\/signup\?next=%2Fmy$/);
  await page.getByLabel(/이름/).fill("지우");
  await page.getByLabel("이메일").fill("jiwoo@example.com");
  await page.getByLabel(/비밀번호/).fill("secret123");
  await page.getByText("여성", { exact: true }).click();
  await page.getByLabel("출생연도").selectOption("1999");
  await page.getByLabel(/한 줄 소개/).fill("별 보러 갑니다");
  // Missing agreement → error.
  await page.getByRole("button", { name: "가입하고 시작하기" }).click();
  await expect(page.locator('p[role="alert"]')).toContainText("약관에 동의");
  await page.getByLabel(/이름/).fill("지우");
  await page.getByLabel("이메일").fill("jiwoo@example.com");
  await page.getByLabel(/비밀번호/).fill("secret123");
  await page.getByLabel("출생연도").selectOption("1999");
  await page.getByLabel(/한 줄 소개/).fill("별 보러 갑니다");
  await page.getByLabel(/이용약관/).check();
  await page.getByRole("button", { name: "가입하고 시작하기" }).click();
  await expect(page).toHaveURL(/\/my$/);

  // My page shows the profile.
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "마이" }).click();
  await expect(page).toHaveURL(/\/me$/);
  await expect(page.getByText("지우", { exact: true })).toBeVisible();
  await expect(page.getByText("jiwoo@example.com", { exact: false })).toBeVisible();
  await expect(page.getByText("1999")).toBeVisible();
  await expect(page.getByText("별 보러 갑니다")).toBeVisible();

  // Edit the intro.
  await page.getByRole("link", { name: "프로필 수정" }).click();
  await page.getByLabel(/한 줄 소개/).fill("사진도 찍어요");
  await page.getByRole("button", { name: "저장" }).click();
  await expect(page.getByRole("status")).toContainText("저장");
  await expect(page.getByText("사진도 찍어요")).toBeVisible();

  // Log out, then log in again.
  await page.getByRole("button", { name: "로그아웃" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/login");
  await page.getByLabel("이메일").fill("jiwoo@example.com");
  await page.getByLabel("비밀번호").fill("wrongpass");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page.locator('p[role="alert"]')).toContainText("맞지 않아요");
  await page.getByLabel("이메일").fill("nobody@example.com");
  await page.getByLabel("비밀번호").fill("secret123");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page.locator('p[role="alert"]')).toContainText("가입된 계정이 없어요");
  await page.getByLabel("이메일").fill("jiwoo@example.com");
  await page.getByLabel("비밀번호").fill("secret123");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page).toHaveURL(/\/my$/);

  expect(errors).toEqual([]);
});

test("about and departures pages render", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1, name: "이용 안내" })).toBeVisible();
  await expect(page.getByText("환불 규정 (초안)")).toBeVisible();
  await page.goto("/departures");
  await expect(page.getByRole("heading", { level: 1, name: "전체 출발일" })).toBeVisible();
  await expect(page.getByText("남고비 6박 7일").first()).toBeVisible();
  await page.getByRole("link", { name: "테를지 + 후스타이 3박 4일" }).click();
  await expect(page).toHaveURL(/\?pkg=terelj-hustai-4d$/);
  await expect(page.getByText("4월 30일")).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
