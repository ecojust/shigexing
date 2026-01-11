import File from "./file";

export default class User {
  static async getUsers() {
    const content = await File._readFile("./users.json", "[]");
    const users = JSON.parse(content?.data || "[]");
    return users;
  }

  static async setUsers(users: Array<any>) {
    // 这里可以添加保存用户数据的逻辑
    const result = await File._writeFile(
      "./users.json",
      JSON.stringify(users, null, 2)
    );
    return result;
  }
}
