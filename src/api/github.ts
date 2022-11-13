import { Octokit } from "octokit"
import { config } from "~/config/config"
import { encode } from 'js-base64';

const client = new Octokit({
    auth: config.github.secret,
    userAgent: "siyuan-sync"
})

export async function upsertFile(filename: string, content: string) {
    let sha = ""
    try {
        let rsp = await client.rest.repos.getContent({
            owner: config.github.owner,
            repo: config.github.repo,
            path: `${config.sync.dir}${filename}`,
        })
        let data: any = rsp.data
        sha = data.sha
    } catch (error) {
    }

    await client.rest.repos.createOrUpdateFileContents({
        owner: config.github.owner,
        repo: config.github.repo,
        path: `${config.sync.dir}${filename}`,
        message: `sync by siyuan note: ${filename}`,
        content: encode(content),
        sha: sha
    })
}