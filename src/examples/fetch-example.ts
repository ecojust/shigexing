// Tauri Fetch 使用示例

import { TauriFetch } from "../types/tauri-fetch";

// 示例：基本 GET 请求
export async function exampleGet() {
  try {
    const response = await TauriFetch.get(
      "https://jsonplaceholder.typicode.com/posts/1"
    );
    console.log("GET Response:", response);
    return response;
  } catch (error) {
    console.error("GET Error:", error);
    throw error;
  }
}

// 示例：GET 请求并解析 JSON
export async function exampleGetJson() {
  try {
    const data = await TauriFetch.json(
      "https://jsonplaceholder.typicode.com/posts/1"
    );
    console.log("GET JSON Data:", data);
    return data;
  } catch (error) {
    console.error("GET JSON Error:", error);
    throw error;
  }
}

// 示例：POST JSON 请求
export async function examplePostJson() {
  try {
    const postData = {
      title: "foo",
      body: "bar",
      userId: 1,
    };

    const response = await TauriFetch.postJson(
      "https://jsonplaceholder.typicode.com/posts",
      postData
    );
    console.log("POST JSON Response:", response);
    return response;
  } catch (error) {
    console.error("POST JSON Error:", error);
    throw error;
  }
}

// 示例：带自定义请求头的请求
export async function exampleWithHeaders() {
  try {
    const response = await TauriFetch.get(
      "https://jsonplaceholder.typicode.com/posts/1",
      {
        "User-Agent": "Tauri App",
        Accept: "application/json",
      }
    );
    console.log("Response with headers:", response);
    return response;
  } catch (error) {
    console.error("Headers Error:", error);
    throw error;
  }
}

// 示例：完整的请求配置
export async function exampleFullRequest() {
  try {
    const response = await TauriFetch.request("https://httpbin.org/post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer your-token-here",
      },
      body: JSON.stringify({
        message: "Hello from Tauri!",
        timestamp: new Date().toISOString(),
      }),
    });
    console.log("Full Request Response:", response);
    return response;
  } catch (error) {
    console.error("Full Request Error:", error);
    throw error;
  }
}
