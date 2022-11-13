var SiyuanSyncConfig = {
    baseURL: "http://127.0.0.1:6806",
    github: {
        owner: "",
        repo: "",
        secret: "",
    },
    // 图床配置
    s3: {
        accessKey: "",
        secretKey: "",
        endpoint: "oss-cn-hangzhou.aliyuncs.com",
        bucket: "",
        region: "oss-cn-hangzhou",
        prefix: "siyuan"
    },
    sync: {
        // 文件保存文件夹
        dir: "source/_posts/siyuan/",
        // 属性映射, yaml front matter 只会映射这配置了的属性
        attrs: {
            index_img: { key: "title_img" },
            categories: { key: "categories" },
            tags: { key: "tags" },
            show_category: { default: true },
            date: { key: "updated_at" },
            urlname: { key: "urlname" },
            title: { key: "title" }
        },
        migratePictures: true
    }
}