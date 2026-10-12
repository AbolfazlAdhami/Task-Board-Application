/** @jest-environment node */

import { describe, expect, it } from "@jest/globals";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

describe("dashboard route proxy", () => {
  it("redirects requests without either session cookie to login", () => {
    const request = new NextRequest("http://localhost:3000/users");

    const response = proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login",
    );
  });

  it("allows a request with a refresh cookie so the API client can renew access", () => {
    const request = new NextRequest("http://localhost:3000/", {
      headers: { cookie: "refresh_token=opaque-refresh-token" },
    });

    const response = proxy(request);

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
