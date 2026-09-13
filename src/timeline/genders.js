// 诗人性别数据：默认男性，此处列出女性诗人
export const femalePoets = new Set(["李清照", "鱼玄机"]);

export const isFemale = (name) => femalePoets.has(name);
