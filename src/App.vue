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
      <el-table-column v-for="(v, k) in columns" :key="k" :label="v.label" :width="v.width">
        <template #default="scope">
          <el-tag v-if="v.type == 'array'" class="tag" size="small" v-for="tag in scope.row.matter[k]">{{ tag }}
          </el-tag>
          <span v-else>{{ scope.row.matter[k] }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="scope">
          <el-tag class="tag" size="small" :type="statues[scope.row.attrs.status].color">{{
              statues[scope.row.attrs.status].label
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100">
        <template #default="scope">
          <el-button :disabled="scope.row.attrs.status != statues.unpublished.key" size="small" type="primary"
            @click="sync(scope.row)">
            发布
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>

</template>

<script lang="ts" setup>
import { reactive, onMounted, ref } from 'vue'
import YAML from 'yaml'
import { getCurrentDocID, exportMd, block, setBlockAttrs, getBlockAttrs, query } from "./api/siyuan"
import { config, AttrColumn, statues } from './config/config';
import { migrate } from "./api/migrater"
import { upsertFile } from './api/github';
import dayjs from 'dayjs';
import { ElMessage } from 'element-plus'

let currentDocID: string
let docs = ref<block[]>([])
let loading = reactive({ show: false, text: "", refresh: false })
let keyword = ref("")

let columns = reactive<{ [key: string]: AttrColumn }>({})
for (const key in config.sync.attrs) {
  let attr = config.sync.attrs[key]
  if (!attr.column || !attr.column.show) continue
  let column = attr.column
  column.type = attr.type
  if (!column.label) column.label = key
  columns[key] = column
}

async function getDocs() {
  loading.refresh = true
  let sql = "select * from blocks where type = 'd' and path like '/${current_doc_id}/%' and content like '%${keyword}%' order by sort asc, updated desc"
  if (config.sql) {
    sql = config.sql
  }
  sql = sql.replace("${current_doc_id}", currentDocID)
  sql = sql.replace("${keyword}", keyword.value)

  let subDocs = await query(sql)
  subDocs = subDocs.map(doc => {
    doc.matter = getAttrs(doc)
    return doc
  })
  console.log(subDocs)
  docs.value = subDocs
  await sleep(500)
  loading.refresh = false
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function getAttrs(data: block) {
  let attrs: { [key: string]: any } = { valid: true }
  for (const key in config.sync.attrs) {
    const dest = config.sync.attrs[key]
    if (dest.key in data.attrs) {
      let v = data.attrs[dest.key]
      switch (dest.type) {
        case "array":
          if (v instanceof Array) attrs[key] = v
          else attrs[key] = v.split(",")
          break
        case "json":
          if (v instanceof Object) attrs[key] = v
          else attrs[key] = JSON.parse(v)
          break
        default:
          attrs[key] = v
      }
    }
    else if (dest.default) attrs[key] = dest.default

    if (dest.required && attrs[key] == undefined) {
      attrs.valid = false
      attrs.valid_message = `required key is undefined: ${key}`
    }
  }
  console.log(attrs)
  return attrs
}


async function sync(doc: block) {
  loading.show = true
  loading.text = `${doc.content}: 导出中`

  let data: block = JSON.parse(JSON.stringify(doc))
  data.markdown = await exportMd(doc.id)

  let attrs = getAttrs(data)
  if (!attrs.valid) {
    ElMessage.error({ message: attrs.valid_message })
    loading.show = false
    return
  }

  // 生成文件名
  let created_time = data.attrs['created_at']
  let created_date = /\d{4}-\d{1,2}-\d{1,2}/g.exec(created_time)[0]
  let filename = data.attrs.title
  if (config.sync.filename.key in data.attrs) filename = data.attrs[config.sync.filename.key]
  filename = created_date + "-" + filename + ".md"

  // 去除封面图片
  data.markdown = data.markdown.replace(/^\!\[.*?\].*?\n/ig, "")
  data.markdown = `---\n${YAML.stringify(attrs)}---\n${data.markdown}`

  // 迁移图片
  if (config.sync.migratePictures) {
    data.markdown = await migrate(data.markdown)
  }

  // 上传到 github
  await upsertFile(filename, data.markdown)
  let syncAttr: { [key: string]: any } = { "lastSyncTime": dayjs().format("YYYY-MM-DD HH:mm:ss") }
  if (!attrs.publishTime) syncAttr.publishTime = dayjs().format("YYYY-MM-DD HH:mm:ss")
  await setBlockAttrs(doc.id, syncAttr)
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
