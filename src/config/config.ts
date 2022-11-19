export interface Github {
    owner: string;
    repo: string;
    secret: string;
}

export interface S3 {
    accessKey: string;
    secretKey: string;
    endpoint: string;
    bucket: string;
    region: string;
    prefix: string;
    // 自定义域名
    baseURL: string;
}


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

export interface Attrs {
    index_img: Attr;
    categories: Attr;
    tags: Attr;
    show_category: Attr;
    date: Attr;
    urlname: Attr;
    title: Attr;
    [key: string]: Attr;
}

export interface Sync {
    dir: string;
    filename: Attr,
    attrs: Attrs;
    migratePictures: boolean;
}

export interface Config {
    baseURL: string;
    // 自定义 sql，注意仅支持文档块
    sql?: string;
    github: Github;
    s3: S3;
    sync: Sync;
}

// @ts-ignore: Unreachable code error
export let config: Config = SiyuanSyncConfig

// 发布状态
export const statues: { [key: string]: { [key: string]: any } } = {
    published: { key: "published", label: "已发布", color: "success" },
    unpublished: { key: "unpublished", label: "待发布", color: "warning" },
}