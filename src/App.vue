<template>
  <div>
    <div class="header">
      <el-row :gutter="20">
        <el-input class="w-80 m-2" size="small" v-model="keyword" @change="getDocs" placeholder="搜索文档标题" />
        <el-button :loading="loading.refresh" class="w-20 m-2" size="small" type="primary" @click="getDocs">刷新
        </el-button>
      </el-row>
    </div>

    <el-table v-loading="loading.show" :element-loading-text="loading.text" :data="docs" style="width: 100%">
      <el-table-column label="文档">
        <template #default="scope">
          <el-link :href="'siyuan://blocks/' + scope.row.id" type="primary">
            {{ scope.row.content }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="标签">
        <template #default="scope">
          <el-tag class="tag" size="small" v-for="tag in scope.row.attrs.tags">{{ tag }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="attrs.urlname" label="url" />
      <el-table-column prop="attrs.updated_at" label="更新时间" />
      <el-table-column label="状态">
        <template #default="scope">
          <el-tag class="tag" size="small">{{ scope.row.attrs.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button size="small" type="primary" @click="sync(scope.row)">发布</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>

</template>

<script lang="ts" setup>
import { reactive, onMounted, ref } from 'vue'
import YAML from 'yaml'
import { getCurrentDocID, getSubDocs, exportMd, block, setBlockAttrs, getBlockAttrs, query } from "./api/siyuan"
import { config } from './config/config';
import { migrate } from "./api/migrater"
import { upsertFile } from './api/github';
import dayjs from 'dayjs';

let currentDocID: string
let docs = ref([])
let loading = reactive({ show: false, text: "", refresh: false })
let keyword = ref("")

async function getDocs() {
  loading.refresh = true
  let sql = "select * from blocks where type = 'd' and path like '/${current_doc_id}/%' and content like '%${keyword}%' order by sort asc, updated desc"
  if (config.sql) {
    sql = config.sql
  }
  sql = sql.replace("${current_doc_id}", currentDocID)
  sql = sql.replace("${keyword}", keyword.value)

  let subDocs = await query(sql)
  docs.value = subDocs
  await sleep(500)
  loading.refresh = false
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function sync(doc: block) {
  loading.show = true
  loading.text = `${doc.content}: 导出中`

  let data: block = JSON.parse(JSON.stringify(doc))
  data.markdown = await exportMd(doc.id)

  let attrs: any = {}
  for (const key in config.sync.attrs) {
    const dest = config.sync.attrs[key]
    if (dest.key in data.attrs) {
      switch (dest.type) {
        case "array":
          attrs[key] = data.attrs[dest.key].split(",")
          break
        case "json":
          attrs[key] = JSON.parse(data.attrs[dest.key].split(","))
          break
        default:
          attrs[key] = data.attrs[dest.key]
      }
    }
    else if (dest.default) attrs[key] = dest.default
  }

  // 生成文件名
  let filename = data.attrs.title
  if (config.sync.filename.key in data.attrs) filename = data.attrs[config.sync.filename.key]
  filename = filename + ".md"

  // 去除封面图片
  data.markdown = data.markdown.replace(/^\!\[.*?\].*?\n/ig, "")
  data.markdown = `---\n${YAML.stringify(attrs)}---\n${data.markdown}`

  // 迁移图片
  if (config.sync.migratePictures) {
    data.markdown = await migrate(data.markdown)
  }

  // 上传到 github
  await upsertFile(filename, data.markdown)
  await setBlockAttrs(doc.id, { "lastSyncTime": dayjs().format("YYYY-MM-DD HH:mm:ss") })
  doc.attrs = await getBlockAttrs(doc.id)

  loading.show = false
}

onMounted(async () => {
  currentDocID = await getCurrentDocID()
  await getDocs()
})
</script>

<style>
.tag {
  margin-right: 5px;
}

.header {
  margin: 10px 12px;
}

body {
  margin: 0;
  padding: 0;
}

/* .el-table .cell {
  padding: 0 !important;
} */
</style>
