# WAIC 预测维护成熟度评估 H5

这是一个面向展会扫码的轻量 H5 应用，用 12 道题评估企业当前是否适合做设备预测性维护，并把线索与评估结果保存到服务端。

## 本地运行

```powershell
$env:WAIC_ADMIN_TOKEN="change-this-before-deploy"
npm start
```

打开 `http://localhost:4173`。二维码可以指向 `http://你的域名/?src=waic-booth-a`，`src` 会写入后台导出表，方便区分展位、海报或销售人员来源。

## 数据与导出

- 线索接口：`POST /api/leads`
- 评估接口：`POST /api/assessments`
- CSV 导出：`GET /admin/export.csv?token=你的WAIC_ADMIN_TOKEN`

默认数据保存在 `./data/leads.jsonl` 和 `./data/assessments.jsonl`。部署到云端时，请把 `WAIC_DATA_DIR` 指向持久化磁盘，并设置一个强 `WAIC_ADMIN_TOKEN`。

## 评分规则

- 每题 0/1/2 分，每个维度 3 题，总分 0-6。
- 0-2 = 低，3-4 = 中，5-6 = 高。
- 设备价值低且停机影响低：不必上。
- 设备价值高且停机影响高，数据基础和团队能力均中以上：立刻上。
- 设备价值或停机影响至少一个高：试点。
- 设备价值和停机影响均为中，且数据基础或团队能力偏弱：暂缓。

## 验证

```powershell
npm test
```

测试覆盖四个典型样本：高高中中、 高高低低、 中中低低、 低低任意。
