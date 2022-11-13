var SiyuanSyncConfig = {
    baseURL: "http://127.0.0.1:6806",

    // github 仓库配置
    github: {
        owner: "",
        repo: "",
        secret: "",
    },

    // 图床配置，支持所有兼容 s3 协议的对象存储
    // 例如 oss, cos, 七牛云 等
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
    sync: {
        // 文件保存文件夹
        dir: "source/_posts/siyuan/",
        // 文件名映射规则，以什么字段作为文件名，文件扩展名固定为 .md
        filename: {key: "urlname"},
        // 属性映射, yaml front matter 只会映射这配置了的属性
        attrs: {
            index_img: { key: "title-img" },
            categories: { key: "categories", type: "array" },
            tags: { key: "tags" },
            show_category: { default: true },
            date: { key: "updated_at" },
            urlname: { key: "urlname" },
            title: { key: "title" }
        },
        migratePictures: true
    }
}