# siyuan-sync-github

## 使用说明

- 在思源集市安装 siyuan-sync-github 或者是[手动下载](https://github.com/mohuishou/siyuan-sync-github/archive/refs/heads/main.zip) 解压缩到 `data/widget/siyuan-sync-github` 目录

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

## Changelog

### v0.1.0 支持自定义 sql 查询模板

- 支持 配置 `sql` 模板