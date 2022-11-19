# siyuan-sync-github

同步思源笔记文档 Markdown 到 github 指定路径，可以用于 hexo, hugo 等博客工具

- 支持自动上传图片到 s3/oss/cos 等对象存储图床
- 支持自定 yaml front matter 自定义

## 使用说明

在思源集市安装 siyuan-sync-github 或者是[手动下载最新 Release](https://github.com/mohuishou/siyuan-sync-github/releases) 解压缩到 `data/widget/siyuan-sync-github` 目录

### 配置 `config.js`
  
创建 `siyuan-sync-github/config.js` 文件，目前仅支持手动设置配置文件，暂未实现配置页面

注意: 默认情况下，我们获取当前挂件块所在页面下的所有文档

```js
  var SiyuanSyncConfig = {
    // 思源的 api 地址，一般不需要修改
    baseURL: "http://127.0.0.1:6806",

    // sql 模板，这个可以不配置，不配置默认值如下
    // select * from blocks where type = 'd' and path like '/${current_doc_id}/%' and content like '%${keyword}%' order by sort asc, updated desc
    // sql: ""

    // github 仓库配置
    github: {
        owner: "",
        repo: "",
        secret: "",
    },

    sync: {
        // 文件保存文件夹
        dir: "source/_posts/siyuan/",
        // 文件名映射规则，以什么字段作为文件名，文件扩展名固定为 .md
        filename: {key: "urlname"},
        // 属性映射, yaml front matter 只会映射这配置了的属性
        // key: 文档自定义属性值，或者是自带的属性值
        // type: array, json，不配置则不对数据做解析
        //       array: 以逗号分割字符串数组
        //       json:  会执行  JSON.parse
        // default: 如果文档不存在对应的属性值，使用默认值填充这个值
        // 详细说明可以查看下方的 FAQ
        attrs: {
            index_img: { key: "title-img" },
            categories: { key: "categories", type: "array" },
            tags: { key: "tags" },
            show_category: { default: true },
            date: { key: "updated_at" },
            urlname: { key: "urlname" },
            title: { key: "title" }
        },
        // 是否上传图片到图床
        migratePictures: true
    },

    // 图床配置，支持所有兼容 s3 协议的对象存储
    // 例如 oss, cos, 七牛云 等
    // 如果 sync.migratePictures = false，那么这个配置可以不用配置
    s3: {
        accessKey: "",
        secretKey: "",
        endpoint: "https://oss-cn-hangzhou.aliyuncs.com",
        bucket: "",
        region: "oss-cn-hangzhou",
        prefix: "siyuan",
        // 自定义域名
        baseURL: "https://you-domain.com/"
    },
  }
```

## FAQ

### 如何获取到其他页面的文档?

可以修改配置中的 `sql` 模板, sql 模板默认值如下，类似 `${current_doc_id}` 字段表示变量，会在执行前进行替换

- `${current_doc_id}`: 当前挂件块所在文档 id
- `${keyword}`: 当前输入框的搜索关键词

```sql
select * from blocks 
where type = 'd' and path like '/${current_doc_id}/%' and content like '%${keyword}%' 
order by sort asc, updated desc
```

所以我们不想局限于当前文档的子文档的话我们可以修改 sql 为
```sql
select * from blocks 
where type = 'd' and content like '%${keyword}%' 
order by sort asc, updated desc
```

### 如何自定义 yaml front matter ?

`yaml front matter` 就是生成 Markdown 文件时，我们会在 Markdown 文件的最上方添加一部分 yaml 字段，这个功能在 hexo、hugo 等静态博客中很常见，最后生产的效果类似下方

```markdown
---
title: 这是一篇测试文档
date: 2022-11-16 10:00:00
tags: ["test"]
---

test
```

支持设置的字段分为两种，一种是思源自带的系统字段，一种是大家可以设置的自定义字段，下面展示了系统字段

```js
{
    "id": "20221115205844-yy9adlf",
    // 文档标签
    "tags": [
        "k8s",
        "kubebuilder"
    ],
    // 文档标题
    "title": "第三方应用如何调用我们 kubebuilder 生成的自定义资源?",
    // 笔记的题头图，去掉了 css
    "title-img": "assets/operator-kubebuilder-clientset-20221116105037-powgjpb.png",

    // 自带的更新时间
    "updated": "20221116103539",

    // 这两个字段是挂件帮忙格式化后的字段
    "updated_at": "2022-11-16 10:35:39",
    "created_at": "2022-11-16 23:13:29",
}
```

自定义字段就是我们设置文档属性的时候自定的字段，字段名和字段值都是大家自行设置的

属性字段这么多，挂件在导出文档的时候不会所有字段都渲染出来，渲染的字段依靠配置里的 `sync.attrs` 字段控制

```js
{
    title_rename: { key: "title", type: "string", default: "" },
}
```

配置示例如上，attrs 的 key 是我们最终渲染到 Markdown 文件中的 key, value 是一个对象

```typescript
// Attr front matter 属性定义
export interface Attr {
    // 表示思源文档的属性值，例如我们这里取值是 title，表示使用文档标题
    key: string;
    // `default`: 表示如果没有设置这个字段，就用 default 来填充
    default: any;
    // 数据类型, 表示这个字段的类型，这个一般用于我们的自定义字段
    // - `string`: 默认值，不做任何处理
    // - `json`: 会使用 `JSON.parse` 解析字符串，字符串必须是一个 json 字符串
    // - `array`: 会使用 `,` 分割字符串为数组，例如 `"".split(",")`
    type?: "string" | "json" | "array"
    // `required`: 是否必填，如果必填字段不存在会直接报错
    required?: boolean
    // 在表格中对外展示的配置
    column?: AttrColumn
}

// AttrColumn 在表格中对外展示的配置
export interface AttrColumn {
    // 是否展示
    show?: boolean
    // 列表宽度
    width?: number
    // 展示的名字
    label?: string

    [key: string]: any
}
```

我们上面的示例配置渲染出来的文档就是

```markdown
---
title_rename: 测试文档
---

test
```

## Changelog

### v0.3.0 支持自定义表格显示字段

- 支持自定义表格显示字段
### v0.2.0 支持设置字段必填校验

- 支持设置字段必填校验
- 已发布文档禁用发布

### v0.1.0 支持自定义 sql 查询模板

- 支持 配置 `sql` 模板