(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.Assessment = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const DIMENSIONS = [
    {
      id: "equipmentValue",
      label: "设备价值",
      labelEn: "Equipment Value",
      shortLabel: "设备",
      shortLabelEn: "Equipment",
      prompt: "有没有值得保护的关键设备",
      promptEn: "Are there critical assets worth protecting?"
    },
    {
      id: "downtimeImpact",
      label: "停机影响",
      labelEn: "Downtime Impact",
      shortLabel: "停机",
      shortLabelEn: "Downtime",
      prompt: "设备停了到底有多疼",
      promptEn: "How much does equipment downtime really cost?"
    },
    {
      id: "dataFoundation",
      label: "数据基础",
      labelEn: "Data Foundation",
      shortLabel: "数据",
      shortLabelEn: "Data",
      prompt: "系统有没有跑起来的燃料",
      promptEn: "Is there enough data to power the system?"
    },
    {
      id: "teamCapability",
      label: "团队能力",
      labelEn: "Team Capability",
      shortLabel: "团队",
      shortLabelEn: "Team",
      prompt: "现场有没有人能接住",
      promptEn: "Is the on-site team ready to act?"
    }
  ];

  const LEVELS = {
    low: { id: "low", label: "低", labelEn: "Low", rank: 0, range: "0-2" },
    medium: { id: "medium", label: "中", labelEn: "Medium", rank: 1, range: "3-4" },
    high: { id: "high", label: "高", labelEn: "High", rank: 2, range: "5-6" }
  };

  const QUESTIONS = [
    {
      id: "ev_cost",
      dimension: "equipmentValue",
      title: "最关键设备的采购或替换成本大约是多少？",
      titleEn: "What is the approximate purchase or replacement cost of your most critical equipment?",
      hint: "按一台核心设备或一组不可替代的同类设备判断。",
      hintEn: "Consider one core asset or a group of similar assets that cannot be easily replaced.",
      options: [
        {
          value: 2,
          label: "50万以上，或进口/定制设备",
          labelEn: "Over RMB 500,000, or imported/custom-built",
          detail: "采购贵、交期长，替换一次很疼。",
          detailEn: "Expensive to purchase, slow to deliver, and painful to replace."
        },
        {
          value: 1,
          label: "10万到50万",
          labelEn: "RMB 100,000 to 500,000",
          detail: "有一定价值，停了需要认真处理。",
          detailEn: "Valuable enough that downtime requires serious attention."
        },
        {
          value: 0,
          label: "10万以下，容易替换",
          labelEn: "Under RMB 100,000 and easy to replace",
          detail: "本身价值不高，替换压力较小。",
          detailEn: "Low asset value with limited replacement pressure."
        }
      ]
    },
    {
      id: "ev_bottleneck",
      dimension: "equipmentValue",
      title: "这台设备是不是产线里的瓶颈或唯一关键工序？",
      titleEn: "Is this equipment a bottleneck or the only critical process on the production line?",
      hint: "看它停了以后，前后工序是否会一起被卡住。",
      hintEn: "Consider whether its shutdown would block upstream and downstream processes.",
      options: [
        {
          value: 2,
          label: "是，停了整条线会被卡住",
          labelEn: "Yes. Its shutdown would block the entire line",
          detail: "它的价值来自对整条产线的牵引。",
          detailEn: "Its value comes from its impact on the whole production line."
        },
        {
          value: 1,
          label: "部分关键，有少量替代方案",
          labelEn: "Partly. A few alternatives are available",
          detail: "能绕开一部分，但影响仍然明显。",
          detailEn: "Some work can be rerouted, but the impact remains significant."
        },
        {
          value: 0,
          label: "不是，冗余充分",
          labelEn: "No. Sufficient redundancy is available",
          detail: "停一台还有其他设备能顶上。",
          detailEn: "Other equipment can take over if one unit stops."
        }
      ]
    },
    {
      id: "ev_parts",
      dimension: "equipmentValue",
      title: "备件、维修和替代资源获取难度如何？",
      titleEn: "How difficult is it to obtain spare parts, repair services, or replacement resources?",
      hint: "关注备件交期、维修响应和替代设备可得性。",
      hintEn: "Consider spare-part lead time, service response, and the availability of replacement equipment.",
      options: [
        {
          value: 2,
          label: "难，备件或服务周期超过1个月",
          labelEn: "Difficult. Parts or service take over one month",
          detail: "一旦故障，恢复周期不可控。",
          detailEn: "Recovery time becomes unpredictable after a failure."
        },
        {
          value: 1,
          label: "中等，需要提前准备",
          labelEn: "Moderate. Advance preparation is required",
          detail: "能修能买，但不能临时抱佛脚。",
          detailEn: "Repair and purchase are possible, but not at the last minute."
        },
        {
          value: 0,
          label: "容易，本地快速解决",
          labelEn: "Easy. Local support is readily available",
          detail: "备件和维修资源都比较充足。",
          detailEn: "Spare parts and repair resources are both accessible."
        }
      ]
    },
    {
      id: "di_loss",
      dimension: "downtimeImpact",
      title: "单次非计划停机的直接损失通常是多少？",
      titleEn: "What is the typical direct loss from one unplanned shutdown?",
      hint: "可以粗略按停机时长、单位时间产出和毛利估算。",
      hintEn: "Estimate it from downtime, output per hour, and gross margin.",
      options: [
        {
          value: 2,
          label: "5万以上",
          labelEn: "Over RMB 50,000",
          detail: "一次停机就足以影响经营结果。",
          detailEn: "A single shutdown can materially affect business results."
        },
        {
          value: 1,
          label: "1万到5万",
          labelEn: "RMB 10,000 to 50,000",
          detail: "损失可感知，但还在可控范围。",
          detailEn: "The loss is noticeable but generally manageable."
        },
        {
          value: 0,
          label: "1万以下",
          labelEn: "Under RMB 10,000",
          detail: "直接损失较小。",
          detailEn: "The direct loss is relatively small."
        }
      ]
    },
    {
      id: "di_delivery",
      dimension: "downtimeImpact",
      title: "停机会不会影响客户交付或订单履约？",
      titleEn: "Would downtime affect customer delivery or order fulfillment?",
      hint: "看是否存在延期扣款、客户投诉或丢单风险。",
      hintEn: "Consider penalties, customer complaints, and the risk of losing orders.",
      options: [
        {
          value: 2,
          label: "会，存在扣款、投诉或丢单风险",
          labelEn: "Yes. Penalties, complaints, or lost orders are possible",
          detail: "停机影响已经外溢到客户侧。",
          detailEn: "The impact of downtime already reaches the customer."
        },
        {
          value: 1,
          label: "可能会，但客户有一定容忍度",
          labelEn: "Possibly, but customers allow some flexibility",
          detail: "交付会紧张，但通常还能协调。",
          detailEn: "Delivery becomes tight but can usually be coordinated."
        },
        {
          value: 0,
          label: "基本不会影响交付",
          labelEn: "No significant impact on delivery",
          detail: "排产缓冲和冗余都比较充足。",
          detailEn: "Scheduling buffers and redundancy are sufficient."
        }
      ]
    },
    {
      id: "di_risk",
      dimension: "downtimeImpact",
      title: "设备异常是否会带来质量、安全或环保风险？",
      titleEn: "Could equipment abnormalities create quality, safety, or environmental risks?",
      hint: "这些风险往往比直接停产损失更值得提前控制。",
      hintEn: "These risks often deserve earlier action than direct production losses alone.",
      options: [
        {
          value: 2,
          label: "会，可能造成批量质量或安全环保事故",
          labelEn: "Yes. It could cause major quality, safety, or environmental incidents",
          detail: "风险不能只用停机损失衡量。",
          detailEn: "The risk cannot be measured by downtime losses alone."
        },
        {
          value: 1,
          label: "有一定质量或现场风险",
          labelEn: "Some quality or on-site risk exists",
          detail: "异常需要及时发现和响应。",
          detailEn: "Abnormalities require timely detection and response."
        },
        {
          value: 0,
          label: "基本没有额外风险",
          labelEn: "Little additional risk",
          detail: "故障影响主要局限在设备本身。",
          detailEn: "The impact is mostly limited to the equipment itself."
        }
      ]
    },
    {
      id: "df_interface",
      dimension: "dataFoundation",
      title: "关键设备现在能否稳定采集运行数据？",
      titleEn: "Can you reliably collect operating data from critical equipment today?",
      hint: "例如振动、温度、电流、压力、转速、报警等。",
      hintEn: "Examples include vibration, temperature, current, pressure, speed, and alarms.",
      options: [
        {
          value: 2,
          label: "能，接口开放且关键参数可采集",
          labelEn: "Yes. Interfaces are open and key parameters are available",
          detail: "已经具备上线预测维护的基础。",
          detailEn: "The basic conditions for predictive maintenance are already in place."
        },
        {
          value: 1,
          label: "部分能，需要加装传感器或打通接口",
          labelEn: "Partly. Sensors or interface integration are needed",
          detail: "可行，但前期要补采集能力。",
          detailEn: "It is feasible, but data collection must be improved first."
        },
        {
          value: 0,
          label: "基本不能，接口封闭或没有数据输出",
          labelEn: "No. Interfaces are closed or data is unavailable",
          detail: "需要先解决数据入口。",
          detailEn: "The data entry point must be addressed first."
        }
      ]
    },
    {
      id: "df_history",
      dimension: "dataFoundation",
      title: "历史运行、维修和故障记录积累情况如何？",
      titleEn: "How complete are your historical operation, maintenance, and failure records?",
      hint: "预测维护需要历史样本来识别异常和故障模式。",
      hintEn: "Predictive maintenance uses historical samples to identify anomalies and failure patterns.",
      options: [
        {
          value: 2,
          label: "有2年以上记录，且较完整",
          labelEn: "More than two years of fairly complete records",
          detail: "算法和诊断能更快进入有效状态。",
          detailEn: "Analytics and diagnostics can become effective faster."
        },
        {
          value: 1,
          label: "有零散记录，但不成体系",
          labelEn: "Some scattered records, but no consistent system",
          detail: "需要先整理再用于分析。",
          detailEn: "The records must be organized before analysis."
        },
        {
          value: 0,
          label: "几乎没有，主要靠口头或本子",
          labelEn: "Almost none; knowledge is mainly verbal or on paper",
          detail: "短期内更适合先补台账。",
          detailEn: "Building a digital maintenance log should come first."
        }
      ]
    },
    {
      id: "df_governance",
      dimension: "dataFoundation",
      title: "现有数据能否关联到具体设备、工况和维修动作？",
      titleEn: "Can existing data be linked to specific equipment, operating conditions, and maintenance actions?",
      hint: "只有能串起来的数据，才能形成可靠的设备画像。",
      hintEn: "Reliable equipment profiles require data that can be connected end to end.",
      options: [
        {
          value: 2,
          label: "能，数据口径和台账比较规范",
          labelEn: "Yes. Data definitions and records are well managed",
          detail: "可直接支撑状态分析和闭环验证。",
          detailEn: "The data can support condition analysis and closed-loop validation."
        },
        {
          value: 1,
          label: "部分能，需要人工清洗和整理",
          labelEn: "Partly. Manual cleaning and organization are needed",
          detail: "数据可用，但要先做治理。",
          detailEn: "The data is usable after initial governance work."
        },
        {
          value: 0,
          label: "不能，数据分散且难以追溯",
          labelEn: "No. Data is fragmented and difficult to trace",
          detail: "现在上系统容易变成看板工程。",
          detailEn: "A new system could become only a dashboard at this stage."
        }
      ]
    },
    {
      id: "tc_analysis",
      dimension: "teamCapability",
      title: "设备团队能否理解趋势、预警和基本状态分析？",
      titleEn: "Can the equipment team understand trends, alerts, and basic condition analysis?",
      hint: "不要求人人会算法，但至少要有人能判断预警含义。",
      hintEn: "Not everyone needs to know algorithms, but someone must be able to interpret the alerts.",
      options: [
        {
          value: 2,
          label: "能，已有数据分析或状态诊断经验",
          labelEn: "Yes. The team has analysis or condition-diagnosis experience",
          detail: "团队能快速接住系统输出。",
          detailEn: "The team can quickly act on system outputs."
        },
        {
          value: 1,
          label: "愿意学，但能力还比较薄弱",
          labelEn: "The team is willing to learn but lacks experience",
          detail: "适合用试点培养核心人员。",
          detailEn: "A pilot can develop a small group of core users."
        },
        {
          value: 0,
          label: "目前没人能看懂或负责",
          labelEn: "No one can currently interpret or own the alerts",
          detail: "需要先培养接手人。",
          detailEn: "A responsible and capable owner must be developed first."
        }
      ]
    },
    {
      id: "tc_acceptance",
      dimension: "teamCapability",
      title: "现场团队对数据驱动维护的接受度如何？",
      titleEn: "How open is the on-site team to data-driven maintenance?",
      hint: "经验很重要，但预测维护需要经验和数据一起工作。",
      hintEn: "Experience matters, but predictive maintenance works best when experience and data are used together.",
      options: [
        {
          value: 2,
          label: "接受度高，愿意用数据辅助判断",
          labelEn: "High. The team is willing to use data in decisions",
          detail: "系统更容易被真正使用。",
          detailEn: "The system is more likely to be used in daily work."
        },
        {
          value: 1,
          label: "态度分化，需要培训和样板带动",
          labelEn: "Mixed. Training and a successful example are needed",
          detail: "要通过小范围成功建立信心。",
          detailEn: "A small success can build confidence."
        },
        {
          value: 0,
          label: "抵触明显，仍习惯坏了再修",
          labelEn: "Low. The team still prefers run-to-failure maintenance",
          detail: "现在硬上容易被闲置。",
          detailEn: "A forced rollout would likely be left unused."
        }
      ]
    },
    {
      id: "tc_collaboration",
      dimension: "teamCapability",
      title: "预警出现后，生产、采购和管理层能否协同响应？",
      titleEn: "When an alert occurs, can production, procurement, and management respond together?",
      hint: "预测维护的价值来自预警后的检修、备件和停机窗口安排。",
      hintEn: "Value comes from maintenance, spare-parts, and downtime-window actions taken after an alert.",
      options: [
        {
          value: 2,
          label: "能，跨部门协作机制顺畅",
          labelEn: "Yes. Cross-functional coordination works well",
          detail: "预警能形成真实闭环。",
          detailEn: "Alerts can lead to real closed-loop action."
        },
        {
          value: 1,
          label: "偶尔有摩擦，但管理层支持",
          labelEn: "Some friction exists, but management is supportive",
          detail: "需要在试点中明确响应规则。",
          detailEn: "Response rules should be clarified during the pilot."
        },
        {
          value: 0,
          label: "很难，生产通常不愿按预警停机",
          labelEn: "No. Production rarely accepts alert-based downtime",
          detail: "预警再准也可能无人执行。",
          detailEn: "Even accurate alerts may not lead to action."
        }
      ]
    }
  ];

  const RESULT_COPY = {
    immediate: {
      id: "immediate",
      label: "立刻上",
      badge: "值得且能上",
      headline: "建议从关键设备立即启动预测维护试点",
      summary: "设备价值和停机影响都高，数据与团队条件也能支撑落地。越早跑通闭环，越能减少非计划停机带来的学费。",
      basis: "设备价值和停机影响均为高，数据基础、团队能力至少达到中等。",
      nextSteps: [
        "先选1-2台最关键设备，不要全厂铺开。",
        "2-4周跑通数据采集、预警、检修响应和效果验证。",
        "把第一次成功闭环沉淀成样板，再复制到其他设备。"
      ]
    },
    pilot: {
      id: "pilot",
      label: "试点",
      badge: "值得上，有短板",
      headline: "建议先做单台设备试点，边验证边补短板",
      summary: "业务痛点已经存在，但数据基础、团队能力或价值影响组合还不适合全面铺开。小范围试点更稳，也更容易形成销售和内部共识。",
      basis: "设备价值或停机影响至少有一项较高，但落地条件仍需验证。",
      nextSteps: [
        "选择价值高、接口相对现成的一台设备作为试点对象。",
        "用3-6个月补数据、练团队、验证跨部门响应流程。",
        "设置试点毕业标准：数据采上来、团队看得懂、至少验证一次闭环。"
      ]
    },
    postpone: {
      id: "postpone",
      label: "暂缓",
      badge: "先补基础",
      headline: "建议暂缓系统投入，先补数据和团队能力",
      summary: "设备和停机影响有一定价值，但紧迫性还没有高到必须马上上系统。现在最划算的动作是打基础，6个月后再重新评估。",
      basis: "设备价值和停机影响处于中等，数据基础或团队能力偏弱。",
      nextSteps: [
        "给关键设备补基础采集，先记录温度、振动、电流等关键指标。",
        "把维修记录和故障台账数字化，至少能追溯到设备和时间。",
        "安排设备主管培训或同行参访，6个月后重新评估。"
      ]
    },
    notNow: {
      id: "notNow",
      label: "不必上",
      badge: "现阶段不优先",
      headline: "现阶段不建议投入预测维护系统",
      summary: "设备价值和停机影响都不高，预测维护的投入回报不明显。把钱花在预防性维护、备件管理和SOP沉淀上，会更务实。",
      basis: "设备价值低且停机影响低，预测维护不是当前优先级。",
      nextSteps: [
        "先把定期保养、润滑、校准和点检制度做扎实。",
        "理清常用备件和故障处理SOP，沉淀老师傅经验。",
        "每年或设备结构变化后重新评估一次。"
      ]
    }
  };

  const RESULT_COPY_EN = {
    immediate: {
      label: "Start Now",
      badge: "Strong case and ready to implement",
      headline: "Start a predictive maintenance pilot on critical equipment now",
      summary: "Asset value and downtime impact are both high, while the data and team can support implementation. The sooner you close the loop, the sooner you can reduce the cost of unplanned downtime.",
      basis: "Equipment value and downtime impact are both high, while data foundation and team capability are at least medium.",
      nextSteps: [
        "Select one or two of the most critical assets instead of rolling out across the whole plant.",
        "Complete data collection, alerting, maintenance response, and outcome validation within two to four weeks.",
        "Turn the first successful closed loop into a repeatable model for other equipment."
      ]
    },
    pilot: {
      label: "Run a Pilot",
      badge: "Worth doing, with gaps to close",
      headline: "Start with one equipment pilot and close the gaps as you learn",
      summary: "The business need is real, but the current mix of data, team capability, and operational impact does not support a full rollout. A focused pilot is safer and builds internal alignment.",
      basis: "Equipment value or downtime impact is high, but implementation readiness still needs validation.",
      nextSteps: [
        "Choose one high-value asset with relatively accessible data interfaces.",
        "Use three to six months to improve data, build team capability, and validate cross-functional response.",
        "Set clear graduation criteria: collect usable data, interpret the outputs, and verify at least one closed loop."
      ]
    },
    postpone: {
      label: "Prepare First",
      badge: "Build the foundation first",
      headline: "Delay the system investment and strengthen data and team capability first",
      summary: "The assets and downtime have some value, but the urgency does not yet justify an immediate system investment. Building the foundation now and reassessing in six months is the better return.",
      basis: "Equipment value and downtime impact are medium, while data foundation or team capability is weak.",
      nextSteps: [
        "Add basic sensing to critical equipment and record key indicators such as temperature, vibration, and current.",
        "Digitize maintenance and failure records so each event can be traced to an asset and time.",
        "Arrange training or peer visits for equipment leaders, then reassess in six months."
      ]
    },
    notNow: {
      label: "Not a Priority",
      badge: "Not the priority at this stage",
      headline: "Predictive maintenance is not recommended at this stage",
      summary: "Equipment value and downtime impact are both low, so the expected return is limited. Preventive maintenance, spare-parts management, and standard procedures are better investments now.",
      basis: "Equipment value and downtime impact are both low, so predictive maintenance is not a current priority.",
      nextSteps: [
        "Strengthen scheduled maintenance, lubrication, calibration, and inspection routines.",
        "Organize common spare parts and troubleshooting procedures, and document expert knowledge.",
        "Reassess annually or whenever the equipment structure changes."
      ]
    }
  };

  function levelFromScore(score) {
    if (score >= 5) return "high";
    if (score >= 3) return "medium";
    return "low";
  }

  function isAtLeast(level, minimum) {
    return LEVELS[level].rank >= LEVELS[minimum].rank;
  }

  function chooseResult(levels) {
    const value = levels.equipmentValue;
    const impact = levels.downtimeImpact;
    const data = levels.dataFoundation;
    const team = levels.teamCapability;

    if (value === "low" && impact === "low") {
      return "notNow";
    }

    if (
      value === "high" &&
      impact === "high" &&
      isAtLeast(data, "medium") &&
      isAtLeast(team, "medium")
    ) {
      return "immediate";
    }

    if (value === "high" || impact === "high") {
      return "pilot";
    }

    if (value === "medium" && impact === "medium") {
      if (data === "low" || team === "low") return "postpone";
      return "pilot";
    }

    if (value === "medium" || impact === "medium") {
      return "postpone";
    }

    return "notNow";
  }

  function validateAnswers(answers) {
    const errors = [];
    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return ["answers must be an object keyed by question id"];
    }

    QUESTIONS.forEach(function (question) {
      const raw = answers[question.id];
      const value = Number(raw);
      const validValues = question.options.map(function (option) {
        return option.value;
      });
      if (raw === undefined || raw === null || raw === "") {
        errors.push(question.id + " is required");
      } else if (!validValues.includes(value)) {
        errors.push(question.id + " has an invalid value");
      }
    });

    return errors;
  }

  function scoreAssessment(answers) {
    const scores = {};
    const levels = {};
    const dimensions = {};

    DIMENSIONS.forEach(function (dimension) {
      scores[dimension.id] = 0;
    });

    QUESTIONS.forEach(function (question) {
      const value = Number(answers[question.id] || 0);
      scores[question.dimension] += value;
    });

    DIMENSIONS.forEach(function (dimension) {
      const score = scores[dimension.id];
      const level = levelFromScore(score);
      levels[dimension.id] = level;
      dimensions[dimension.id] = {
        id: dimension.id,
        label: dimension.label,
        shortLabel: dimension.shortLabel,
        prompt: dimension.prompt,
        score: score,
        maxScore: 6,
        level: level,
        levelLabel: LEVELS[level].label,
        levelRange: LEVELS[level].range
      };
    });

    const resultId = chooseResult(levels);

    return {
      dimensions: dimensions,
      scores: scores,
      levels: levels,
      result: RESULT_COPY[resultId],
      totalScore: Object.keys(scores).reduce(function (sum, key) {
        return sum + scores[key];
      }, 0),
      maxScore: QUESTIONS.length * 2,
      answeredCount: QUESTIONS.length
    };
  }

  return {
    DIMENSIONS: DIMENSIONS,
    LEVELS: LEVELS,
    QUESTIONS: QUESTIONS,
    RESULT_COPY: RESULT_COPY,
    RESULT_COPY_EN: RESULT_COPY_EN,
    scoreAssessment: scoreAssessment,
    validateAnswers: validateAnswers,
    levelFromScore: levelFromScore
  };
});
