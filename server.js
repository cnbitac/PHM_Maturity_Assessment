const crypto = require("node:crypto");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { URL } = require("node:url");
const {
  DIMENSIONS,
  QUESTIONS,
  RESULT_COPY,
  scoreAssessment,
  validateAnswers
} = require("./src/assessment");

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.resolve(process.env.WAIC_DATA_DIR || path.join(ROOT, "data"));
const PORT = Number(process.env.PORT || 4173);
const ADMIN_TOKEN = process.env.WAIC_ADMIN_TOKEN || "waic-demo-token";
const LEADS_FILE = path.join(DATA_DIR, "leads.jsonl");
const ASSESSMENTS_FILE = path.join(DATA_DIR, "assessments.jsonl");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon"
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(body);
}

function sendText(res, status, text, headers = {}) {
  res.writeHead(status, {
    "content-type": "text/plain; charset=utf-8",
    ...headers
  });
  res.end(text);
}

function notFound(res) {
  sendJson(res, 404, { error: "not_found", message: "The requested resource was not found." });
}

async function ensureDataDir() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
}

async function appendJsonLine(file, value) {
  await ensureDataDir();
  await fsp.appendFile(file, JSON.stringify(value) + "\n", "utf8");
}

async function readJsonLines(file) {
  try {
    const raw = await fsp.readFile(file, "utf8");
    return raw
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error("invalid json"));
      }
    });
    req.on("error", reject);
  });
}

function cleanString(value) {
  return String(value || "").trim();
}

function validatePhone(phone) {
  return /^(1[3-9]\d{9}|0\d{2,3}-?\d{7,8}|\+?\d{6,20})$/.test(phone);
}

function makeId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function getBearerToken(req, url) {
  const queryToken = url.searchParams.get("token");
  const auth = req.headers.authorization || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : "";
  return queryToken || bearer;
}

async function handleCreateLead(req, res) {
  let body;
  try {
    body = await parseJsonBody(req);
  } catch (error) {
    return sendJson(res, 400, { error: "invalid_json", message: error.message });
  }

  const name = cleanString(body.name);
  const company = cleanString(body.company);
  const phone = cleanString(body.phone).replace(/\s+/g, "");
  const source = cleanString(body.source) || "waic-booth";
  const clientSubmissionId = cleanString(body.clientSubmissionId);
  const consent = body.consent === true;
  const errors = [];

  if (!name) errors.push("姓名不能为空");
  if (!company) errors.push("工作单位不能为空");
  if (!phone || !validatePhone(phone)) errors.push("电话格式不正确");
  if (!consent) errors.push("需要同意用于本次评估和后续沟通");

  if (errors.length) {
    return sendJson(res, 422, { error: "validation_failed", message: errors.join("；"), errors });
  }

  const existingLeads = await readJsonLines(LEADS_FILE);
  if (clientSubmissionId) {
    const existing = existingLeads.find((lead) => lead.clientSubmissionId === clientSubmissionId);
    if (existing) {
      return sendJson(res, 200, { lead: existing, deduped: true });
    }
  }

  const lead = {
    leadId: makeId("lead"),
    clientSubmissionId,
    name,
    company,
    phone,
    source,
    consent,
    userAgent: req.headers["user-agent"] || "",
    submittedAt: new Date().toISOString()
  };

  await appendJsonLine(LEADS_FILE, lead);
  return sendJson(res, 201, { lead });
}

async function handleCreateAssessment(req, res) {
  let body;
  try {
    body = await parseJsonBody(req);
  } catch (error) {
    return sendJson(res, 400, { error: "invalid_json", message: error.message });
  }

  const leadId = cleanString(body.leadId);
  const source = cleanString(body.source) || "waic-booth";
  const clientSubmissionId = cleanString(body.clientSubmissionId);
  const answers = body.answers || {};
  const errors = validateAnswers(answers);

  if (!leadId) errors.push("leadId is required");
  if (errors.length) {
    return sendJson(res, 422, { error: "validation_failed", message: errors.join("；"), errors });
  }

  const leads = await readJsonLines(LEADS_FILE);
  const lead = leads.find((item) => item.leadId === leadId);
  if (!lead) {
    return sendJson(res, 404, { error: "lead_not_found", message: "Lead was not found." });
  }

  const existingAssessments = await readJsonLines(ASSESSMENTS_FILE);
  if (clientSubmissionId) {
    const existing = existingAssessments.find(
      (assessment) => assessment.clientSubmissionId === clientSubmissionId
    );
    if (existing) {
      return sendJson(res, 200, { assessment: existing, score: existing.score, deduped: true });
    }
  }

  const normalizedAnswers = {};
  QUESTIONS.forEach((question) => {
    normalizedAnswers[question.id] = Number(answers[question.id]);
  });
  const score = scoreAssessment(normalizedAnswers);

  const assessment = {
    assessmentId: makeId("asm"),
    clientSubmissionId,
    leadId,
    source,
    answers: normalizedAnswers,
    score,
    submittedAt: new Date().toISOString()
  };

  await appendJsonLine(ASSESSMENTS_FILE, assessment);
  return sendJson(res, 201, { assessment, score });
}

function csvCell(value) {
  const text = value === undefined || value === null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function answerSummary(answers) {
  return QUESTIONS.map((question) => {
    const value = Number(answers[question.id]);
    const option = question.options.find((item) => item.value === value);
    return `${question.id}:${value}-${option ? option.label : ""}`;
  }).join(" | ");
}

async function handleExport(req, res, url) {
  const token = getBearerToken(req, url);
  if (!token || token !== ADMIN_TOKEN) {
    return sendText(res, 401, "Unauthorized\n");
  }

  const [leads, assessments] = await Promise.all([
    readJsonLines(LEADS_FILE),
    readJsonLines(ASSESSMENTS_FILE)
  ]);
  const assessmentsByLead = new Map();
  assessments.forEach((assessment) => {
    const existing = assessmentsByLead.get(assessment.leadId);
    if (!existing || existing.submittedAt < assessment.submittedAt) {
      assessmentsByLead.set(assessment.leadId, assessment);
    }
  });

  const headers = [
    "线索提交时间",
    "评估提交时间",
    "姓名",
    "工作单位",
    "电话",
    "来源",
    "评估结论",
    "判断依据",
    "设备价值得分",
    "设备价值等级",
    "停机影响得分",
    "停机影响等级",
    "数据基础得分",
    "数据基础等级",
    "团队能力得分",
    "团队能力等级",
    "下一步建议",
    "答案明细",
    "leadId",
    "assessmentId"
  ];

  const rows = leads.map((lead) => {
    const assessment = assessmentsByLead.get(lead.leadId);
    const score = assessment ? assessment.score : null;
    const dims = score ? score.dimensions : {};
    return [
      lead.submittedAt,
      assessment ? assessment.submittedAt : "",
      lead.name,
      lead.company,
      lead.phone,
      lead.source,
      score ? score.result.label : "",
      score ? score.result.basis : "",
      dims.equipmentValue ? dims.equipmentValue.score : "",
      dims.equipmentValue ? dims.equipmentValue.levelLabel : "",
      dims.downtimeImpact ? dims.downtimeImpact.score : "",
      dims.downtimeImpact ? dims.downtimeImpact.levelLabel : "",
      dims.dataFoundation ? dims.dataFoundation.score : "",
      dims.dataFoundation ? dims.dataFoundation.levelLabel : "",
      dims.teamCapability ? dims.teamCapability.score : "",
      dims.teamCapability ? dims.teamCapability.levelLabel : "",
      score ? score.result.nextSteps.join("；") : "",
      assessment ? answerSummary(assessment.answers) : "",
      lead.leadId,
      assessment ? assessment.assessmentId : ""
    ];
  });

  const csv = "\uFEFF" + [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  res.writeHead(200, {
    "content-type": "text/csv; charset=utf-8",
    "content-disposition": 'attachment; filename="waic-assessments.csv"',
    "cache-control": "no-store"
  });
  res.end(csv);
}

async function serveStatic(res, pathname) {
  let filePath;
  if (pathname === "/assessment.js") {
    filePath = path.join(ROOT, "src", "assessment.js");
  } else {
    const requested = pathname === "/" ? "/index.html" : pathname;
    const decoded = decodeURIComponent(requested);
    const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
    filePath = path.join(PUBLIC_DIR, normalized);
  }

  const resolved = path.resolve(filePath);
  const allowed =
    resolved.startsWith(path.resolve(PUBLIC_DIR)) ||
    resolved === path.resolve(ROOT, "src", "assessment.js");
  if (!allowed) return notFound(res);

  try {
    const stat = await fsp.stat(resolved);
    if (!stat.isFile()) return notFound(res);
    const ext = path.extname(resolved);
    res.writeHead(200, {
      "content-type": MIME_TYPES[ext] || "application/octet-stream",
      "cache-control": ext === ".html" ? "no-store" : "public, max-age=300"
    });
    fs.createReadStream(resolved).pipe(res);
  } catch (error) {
    if (error.code === "ENOENT") return notFound(res);
    throw error;
  }
}

async function router(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname;

  try {
    if (req.method === "GET" && pathname === "/api/health") {
      return sendJson(res, 200, {
        ok: true,
        dimensions: DIMENSIONS.length,
        questions: QUESTIONS.length,
        results: Object.keys(RESULT_COPY)
      });
    }
    if (req.method === "POST" && pathname === "/api/leads") {
      return handleCreateLead(req, res);
    }
    if (req.method === "POST" && pathname === "/api/assessments") {
      return handleCreateAssessment(req, res);
    }
    if (req.method === "GET" && pathname === "/admin/export.csv") {
      return handleExport(req, res, url);
    }
    if (req.method === "GET" || req.method === "HEAD") {
      return serveStatic(res, pathname);
    }
    return sendJson(res, 405, { error: "method_not_allowed", message: "Method not allowed." });
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { error: "server_error", message: "Unexpected server error." });
  }
}

const server = http.createServer(router);

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`WAIC assessment app running at http://localhost:${PORT}`);
    console.log(`CSV export: http://localhost:${PORT}/admin/export.csv?token=${ADMIN_TOKEN}`);
  });
}

module.exports = { server, router };
