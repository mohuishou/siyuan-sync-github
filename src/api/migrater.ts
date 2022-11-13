// import crypto from "crypto"
import { config } from "~/config/config";
import axios from "axios";
import md5 from "md5"
import S3 from 'aws-sdk/clients/s3';
import { da, pa } from "element-plus/es/locale";


// async function migrate(ctx: PicGo, files: string[]) {
//     ctx.log.info("Migrating...");

//     let total = 0;
//     let success = 0;

//     for (const file of files) {
//         const fileHandler = new BlogFileHandler(ctx);
//         // read File
//         fileHandler.read(file);
//         const migrater = new Migrater(ctx, null, file);
//         migrater.init(fileHandler.getFileUrlList(file));

//         // migrate pics
//         const result = await migrater.migrate();

//         if (result.total === 0) continue;

//         total += result.total;
//         success += result.success;
//         if (result.success === 0) {
//             ctx.log.warn(
//                 `Please check your configuration, since no images migrated successfully in ${file}`
//             );
//             return;
//         }
//         let content = fileHandler.getFileContent(file);
//         // replace content
//         result.urls.forEach((item: any) => {
//             content = content.replaceAll(item.original, item.new);
//         });
//         fileHandler.write(file, content, "", true);
//     }
//     return { total, success };
// }

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
    return new Promise<string>((resolve, reject) => {
        client.upload(params, (err: Error, data: S3.ManagedUpload.SendData) => {
            if (err) return reject(err)
            resolve(data.Location)
        })
    })
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