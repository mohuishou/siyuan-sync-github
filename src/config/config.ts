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

export interface Attr {
    key: string;
    default: any;
    type?: "string" | "json" | "array"
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