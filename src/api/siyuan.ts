import axios from 'axios'
import { dayjs } from 'element-plus';
import { statues } from "../config/config"

let http = axios.create({
    baseURL: "http://127.0.0.1:6806"
})


export interface block {
    alias: string;
    box: string;
    content: string;

    fcontent: string;
    hash: string;
    hpath: string;
    ial: string;
    id: string;
    length: number;
    markdown: string;
    memo: string;
    name: string;
    parent_id: string;
    path: string;
    root_id: string;
    sort: number;
    subtype: string;
    tag: string;
    attrs?: any;
    type: string;
    updated: string;
    created: string;

    [key: string]: any;
}

export async function query(sql: string): Promise<block[]> {
    let rsp = await http.post("/api/query/sql", { stmt: sql })
    let items: block[] = rsp.data.data
    items.map(item => {
        if (!item.ial) return item
        let attrs: any = { created: item.created }
        let iter = item.ial.matchAll(/(\b.*?)="(.*?)"/igm)
        for (let m of iter) {
            let k = m[1], v = m[2]
            attrs[k] = v
        }
        item.attrs = genAttrs(attrs)
        return item
    })

    return items
}

function genAttrs(attrs: { [key: string]: any }) {
    for (let k in attrs) {
        let v = attrs[k]
        if (k.includes("custom-")) k = k.replace("custom-", "")
        attrs[k] = v
    }
    if ("title-img" in attrs) {
        let re = /background-image:url\(&quot;(.*?)&quot;\)/ig
        let m = re.exec(attrs["title-img"])
        if (m && m.length > 1) attrs["title-img"] = m[1]
    }
    attrs.updated_at = dayjs(attrs.updated).format("YYYY-MM-DD HH:mm:ss")
    attrs.created_at = dayjs(attrs.created).format("YYYY-MM-DD HH:mm:ss")
    if ('tags' in attrs) attrs.tags = attrs.tags.split(",")
    else attrs.tags = []
    if (!attrs.lastSyncTime || dayjs(attrs.updated).isAfter(dayjs(attrs.lastSyncTime))) {
        attrs.status = statues.unpublished.key
    } else {
        attrs.status = statues.published.key
    }
    return attrs
}

export function notifyError(msg: string) {
    http.post("/api/notification/pushErrMsg", {
        msg: msg,
        timeout: 1500,
    })
}

// 获取当前挂件块对应的文件 id
export async function getCurrentDocID() {
    console.log("try to get current widget doc id")
    // 获取挂件块 id
    let id;
    try {
        let widget = window.frameElement.parentElement.parentElement;
        id = widget.getAttribute("data-node-id");
    } catch (error) {
        id = import.meta.env.VITE_WIDGET_ID;
        console.log("dev mode, use custom id: " + id);
    }

    // 获取文章 id
    let rows = await query(`select root_id from blocks where id = '${id}'`);
    if (!rows || rows.length != 1) notifyError("can not found doc id");
    return rows[0].root_id;
}

export async function exportMd(id: string) {
    let rsp = await http.post("/api/export/exportMdContent", { id: id })
    let md: string = rsp.data.data.content
    return md
}

export async function getBlockAttrs(id: string) {
    let rsp = await http.post("/api/attr/getBlockAttrs", { id })
    return genAttrs(rsp.data.data)
}

export async function setBlockAttrs(id: string, attrs: { [key: string]: string }) {
    let newAttrs: { [key: string]: string } = {}
    let rsp = await http.post("/api/attr/getBlockAttrs", { id })
    newAttrs = rsp.data.data

    for (let k in attrs) {
        if (!k.includes("custom-")) newAttrs[`custom-${k}`] = attrs[k]
        else newAttrs[k] = attrs[k]
    }
    await http.post("/api/attr/setBlockAttrs", { id: id, attrs: newAttrs })
}