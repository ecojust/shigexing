const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

/**
 * 解析王勃生平时间线HTML文档并生成Excel
 */
class WangBoHistoryParser {
  constructor() {
    this.data = [];
  }

  /**
   * 解析HTML内容提取时间线数据
   */
  parseHtmlContent(htmlContent) {
    // 按-----end分割内容，每个节点作为一条数据
    const sections = htmlContent.split("-----end");

    sections.forEach((section, index) => {
      if (section.trim() === "") return; // 跳过空节点

      // 提取标题（地点）
      const titleMatch = section.match(
        /-----title\s*\n([^\n]+)\s*\n-----detail/
      );
      if (!titleMatch) return; // 如果没有标题，跳过这个节点

      const location = titleMatch[1].trim();

      // 提取详细内容部分
      const detailStartIndex = section.indexOf("-----detail");
      if (detailStartIndex === -1) return;

      const detailContent = section
        .substring(detailStartIndex + "-----detail".length)
        .trim();

      // 解析这个节点的内容
      const nodeData = this.parseNodeContent(detailContent, location);

      if (nodeData) {
        this.data.push(nodeData);
      }
    });

    return this.data;
  }

  /**
   * 解析单个节点的内容
   */
  parseNodeContent(content, location) {
    // 清理地点名称，移除括号内容
    const cleanLocation = location.replace(/\([^)]*\)/g, "").trim();

    // 提取时间信息
    const timeInfo = this.extractTimeInfo(content);

    // 提取详细描述
    const details = this.extractDetails(content);

    // 提取作品
    const works = this.extractAllWorks(content);

    // 如果没有提取到有效信息，返回null
    if (!timeInfo && !details) {
      return null;
    }

    return {
      时间: timeInfo || "-",
      地点: cleanLocation,
      详情: details || "-",
      作品: works.length > 0 ? works.join("；") : "-",
    };
  }

  /**
   * 提取时间信息
   */
  extractTimeInfo(content) {
    // 匹配各种时间格式，优先匹配更具体的格式
    const timePatterns = [
      // 匹配具体日期：716年9月9日
      /(\d+年\d+月\d+日)/,
      // 匹配年份范围：700-708年，714-715年
      /<a[^>]*>(\d+-\d+年)<\/a>/,
      // 匹配单个年份：700年，708年
      /<a[^>]*>(\d+年)<\/a>/,
      // 匹配带年龄的时间：700-708年，1-9岁
      /(\d+-\d+年)，\d+-\d+岁/,
      // 匹配基本年份格式
      /(\d+年)/,
    ];

    for (const pattern of timePatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * 提取详细描述
   */
  extractDetails(content) {
    // 移除HTML标签，但保留文本内容
    let cleanContent = content.replace(/<[^>]*>/g, " ");

    // 清理多余的空白字符
    cleanContent = cleanContent.replace(/\s+/g, " ").trim();

    // 移除特殊标记
    cleanContent = cleanContent.replace(/-----\w+/g, "").trim();

    // 提取主要事件描述
    const events = [];

    // 按句号或分号分割内容
    const sentences = cleanContent.split(/[。；]/);

    for (const sentence of sentences) {
      const trimmed = sentence.trim();

      // 跳过太短的句子或只包含年份/年龄的句子
      if (
        trimmed.length < 5 ||
        trimmed.match(/^\d+-?\d*年$/) ||
        trimmed.match(/^\d+-?\d*岁$/) ||
        trimmed.match(/^，\d+-?\d*岁$/)
      ) {
        continue;
      }

      // 清理句子中的年份标记，保留主要内容
      let cleanSentence = trimmed
        .replace(/\d+年\d+月\d+日\s*/, "") // 移除具体日期
        .replace(/\d+-\d+年\s*/, "") // 移除年份范围
        .replace(/\d+年\s*/, "") // 移除单个年份
        .replace(/，\d+-\d+岁/, "") // 移除年龄信息
        .replace(/^\s*[，。　]+/, "") // 移除开头的标点
        .trim();

      if (cleanSentence.length > 3) {
        events.push(cleanSentence);
      }
    }

    // 合并所有事件，去重
    const uniqueEvents = [...new Set(events)];
    let result = uniqueEvents.join("；").trim();

    // 如果内容太短，可能不是有效的描述
    if (result.length < 5) {
      return null;
    }

    // 截取合理长度的描述（避免过长）
    if (result.length > 800) {
      result = result.substring(0, 800) + "...";
    }

    return result;
  }

  /**
   * 提取所有作品
   */
  extractAllWorks(content) {
    const works = [];

    // 匹配《作品名》格式
    const workRegex = /《([^》]+)》/g;
    let workMatch;

    while ((workMatch = workRegex.exec(content)) !== null) {
      const workTitle = `《${workMatch[1]}》`;
      if (!works.includes(workTitle)) {
        works.push(workTitle);
      }
    }

    return works;
  }

  /**
   * 提取事件详情和作品
   */
  extractEvents(content, startIndex) {
    const events = [];

    // 查找事件描述
    const eventRegex =
      /(\d+年[^<]*?)　([^<]+?)(?:作品：([^<]+?))?(?:<span|<br|$)/g;
    let eventMatch;

    const sectionContent = content.substring(startIndex, startIndex + 2000); // 限制搜索范围

    while ((eventMatch = eventRegex.exec(sectionContent)) !== null) {
      const time = eventMatch[1];
      const detail = eventMatch[2].replace(/<[^>]*>/g, "").trim();
      const worksText = eventMatch[3] || "";

      // 提取作品名称
      const works = this.extractWorks(worksText);

      events.push({
        time: time,
        detail: detail,
        works: works,
      });
    }

    // 如果没有找到具体事件，创建一个通用事件
    if (events.length === 0) {
      const generalDetail = this.extractGeneralDetail(content);
      if (generalDetail) {
        events.push({
          time: "",
          detail: generalDetail,
          works: [],
        });
      }
    }

    return events;
  }

  /**
   * 提取作品名称
   */
  extractWorks(worksText) {
    if (!worksText) return [];

    const works = [];
    // 匹配《作品名》格式
    const workRegex = /《([^》]+)》/g;
    let workMatch;

    while ((workMatch = workRegex.exec(worksText)) !== null) {
      works.push(`《${workMatch[1]}》`);
    }

    return works;
  }

  /**
   * 提取通用详情描述
   */
  extractGeneralDetail(content) {
    // 移除HTML标签，提取纯文本
    const cleanText = content
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // 查找描述性文本
    const detailMatch = cleanText.match(/\d+年[^。]*。/);
    if (detailMatch) {
      return detailMatch[0];
    }

    return "";
  }

  /**
   * 生成Excel文件
   */
  generateExcel(data, filename = "王勃生平时间线.xlsx") {
    // 创建工作簿
    const wb = XLSX.utils.book_new();

    // 创建工作表数据
    const wsData = [
      ["时间", "地点", "详情", "作品"], // 表头
      ...data.map((item) => [item.时间, item.地点, item.详情, item.作品]),
    ];

    // 创建工作表
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // 设置列宽
    ws["!cols"] = [
      { width: 15 }, // 时间
      { width: 12 }, // 地点
      { width: 50 }, // 详情
      { width: 30 }, // 作品
    ];

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, "王勃生平时间线");

    // 写入文件
    XLSX.writeFile(wb, filename);

    console.log(`Excel文件已生成: ${filename}`);
    return filename;
  }

  /**
   * 主处理函数
   */
  async process(inputFile, outputFile = "王勃生平时间线.xlsx") {
    try {
      // 读取输入文件
      const content = fs.readFileSync(inputFile, "utf8");

      // 解析内容
      const data = this.parseHtmlContent(content);

      // 使用已知数据（更准确）
      const finalData = data;

      // 生成Excel
      this.generateExcel(finalData, outputFile);

      console.log(`成功处理 ${finalData.length} 条记录`);
      return finalData;
    } catch (error) {
      console.error("处理文件时出错:", error);
      throw error;
    }
  }
}

// 主执行函数
async function main() {
  const parser = new WangBoHistoryParser();
  const dataDir = "src/data";
  const excelDir = "src/excel";

  try {
    // 确保excel目录存在
    if (!fs.existsSync(excelDir)) {
      fs.mkdirSync(excelDir, { recursive: true });
    }

    // 读取data文件夹下所有txt文件
    const files = fs.readdirSync(dataDir);
    const txtFiles = files.filter(
      (file) => path.extname(file).toLowerCase() === ".txt"
    );

    if (txtFiles.length === 0) {
      console.log("在data文件夹中未找到任何txt文件");
      return;
    }

    console.log(`找到 ${txtFiles.length} 个txt文件，开始批量处理...`);

    const errors = [];

    // 依次处理每个txt文件
    for (const txtFile of txtFiles) {
      const inputFile = path.join(dataDir, txtFile);
      const baseName = path.basename(txtFile, ".txt");
      const name = baseName.replace(/_history/g, "");
      const outputFile = path.join(excelDir, `${name}_时间线.xlsx`);

      console.log(`\n正在处理: ${txtFile}`);
      //   console.log(`输入文件: ${inputFile}`);
      //   console.log(`输出文件: ${outputFile}`);

      try {
        // 重置解析器数据
        parser.data = [];

        const data = await parser.process(inputFile, outputFile);

        console.log(`✅ 成功处理 ${txtFile}，生成了 ${data.length} 条记录`);

        // // 显示前3条记录预览
        // if (data.length > 0) {
        //   console.log("解析结果预览:");
        //   data.slice(0, 3).forEach((item, index) => {
        //     console.log(`  ${index + 1}. ${item.时间} - ${item.地点}`);
        //     console.log(`     详情: ${item.详情.substring(0, 50)}...`);
        //     console.log(`     作品: ${item.作品}`);
        //   });
        // }
      } catch (error) {
        errors.push(`❌ 处理文件 ${txtFile} 时出错:${error.message}`);
        // console.error(`❌ 处理文件 ${txtFile} 时出错:`, error.message);
        continue; // 继续处理下一个文件
      }
    }

    console.log(`\n🎉 批量处理完成！共处理了 ${txtFiles.length} 个文件`);
    console.log(`生成的Excel文件保存在: ${excelDir}`);

    errors.forEach((error) => {
      console.error(error);
    });
  } catch (error) {
    console.error("批量处理失败:", error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = WangBoHistoryParser;
