// import crypto from "crypto"
import { config } from "~/config/config";
import axios from "axios";
import md5 from "md5"
import { S3 } from '@aws-sdk/client-s3';


function getImages(content: string) {
    const markdownURLList = (content.match(/\!\[.*\]\(.*\)/g) || [])
        .map((item: string) => {
            const res = item.match(/\!\[.*\]\((.*?)( ".*")?\)/);
            if (res) {
                return res[1];
            }
            return null;
        })
        .filter((item: string) => item);

    const imageTagURLList = (content.match(/<img.*?(?:>|\/>)/gi) || [])
        .map((item: string) => {
            const res = item.match(/src=[\'\"]?(.*?)[\'\"]/i);
            if (res) return res[1];
            return null;
        })
        .filter((item: string) => item);

    let urls = markdownURLList.concat(imageTagURLList);

    // front matter
    let matchs = content.matchAll(/.*img:\s(.*)/gi);
    for (const m of matchs) {
        let src = m[1];
        src = src.replace(/^'/, "").replace(/'$/, "");
        src = src.replace(/^"/, "").replace(/"$/, "");
        src = src.trim();
        if (!src) continue;
        urls.push(src);
    }
    return urls
}

async function upload(filename: string, body: any) {
    (window as any).global = window;

    let client = new S3({
        credentials: {
            accessKeyId: config.s3.accessKey,
            secretAccessKey: config.s3.secretKey
        },
        region: config.s3.region,
        endpoint: config.s3.endpoint,
    })
    let params = {
        Bucket: config.s3.bucket,
        Key: `${config.s3.prefix}/${filename}`,
        Body: body
    }

    await client.putObject(params)
    let endpoint = new URL(config.s3.endpoint)
    endpoint.host = `${params.Bucket}.${endpoint.host}`
    endpoint.pathname = params.Key
    return endpoint.toString()
}



export async function migrate(md: string) {
    let images = getImages(md)
    for (let i = 0; i < images.length; i++) {
        let image = images[i];
        image = image.includes("http") ? image : config.baseURL + "/" + image

        console.log(`[${i + 1}]: begin migrate ${image}`)

        let url = new URL(image)
        let filename = url.pathname.split("/").reverse()[0];
        let ext = filename.split(".").reverse()[0]
        if (ext) ext = "." + ext
        let rsp = await axios.get(image, { responseType: "arraybuffer" })
        let buffer = rsp.data
        filename = md5(buffer) + ext;

        let newURL = await upload(filename, buffer)
        md = md.replaceAll(images[i], newURL)
        console.log(`[${i + 1}]: migrate ${image} to ${newURL} success`)
    }
    return md
}