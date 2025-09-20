import { Session } from "@inrupt/solid-client-authn-node";
import { readFile } from 'fs/promises';
import { overwriteFile, getSourceUrl } from "@inrupt/solid-client";
import dotenv from 'dotenv'

import parseUrl from '../src/utils/urlParser.js';

const default_acl = "./acls/.acl"

dotenv.config({ path: '../.env' })
const session = new Session();
await session.login({
    oidcIssuer: process.env.OPENID_PROVIDER,
    clientId: process.env.TOKEN_IDENTIFIER,
    clientSecret: process.env.TOKEN_SECRET,
});

console.log(`You are now logged in as ${session.info.webId}`);


let pod = parseUrl(session.info.webId)
console.log(pod)

//await test1()


let options = { path: "holacratie/" }
await testHolacratie(options)

async function testHolacratie(options) {
    console.log(options)
    let root_folders = ["constitution", "organisations", "acteurs", "partenaires"]

    // let res = await session.fetch(session.info.webId)
    // console.log(await res.text())
    if (session.info.isLoggedIn) {
        pod.hola_root = pod.storage + options.path

        for await (const rf of root_folders) {
            let path = pod.hola_root + rf + '/'
            await create_folder(path)
            pod[rf] = path
        }
        await console.log(pod)
        // pod.constitution = hola_root + 'constitution/'
        // await create_folder(pod.constituion)
        // uploadFile('../doc/Constitution-Holacracy.md', "text/markdown", `${hola_root}constitution/Constitution-Holacracy.md`, session.fetch);
    }
    else {
        console.log("You are not logged")
    }


}

async function create_folder(path) {
    var parts = path.split('/');
    var slug = parts.pop() || parts.pop();

    let post_folder = await session.fetch(path, {
        method: 'PUT',
        'Content-Type': 'text/turtle',
        'Link': '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"',
        'Slug': slug
        // headers: { 'content-type': 'text/turtle' },
        // body: "<ex:s> <ex:p> <ex:o>."
    }
    )
    // console.log("put_result_ttl: ",put_result_ttl)
    console.log(post_folder.status, "[post_folder]", path)
    await setAcl(path)
    return post_folder
}

async function setAcl(path, acl_string) {
    if (acl_string == undefined) {
        acl_string = await readFile(default_acl);
    }
    let put_acl = await session.fetch(path + ".acl", {
        method: 'PUT',
        headers: { 'content-type': 'text/turtle' },
        body: acl_string
    })
    console.log(put_acl.status, "[put_acl]", path + ".acl")
}

// Read local file and save to targetURL
async function uploadFile(filepath, mimetype, targetURL, fetch) {
    try {
        const data = await readFile(filepath);
        writeFileToPod(data, mimetype, targetURL, fetch);
    } catch (err) {
        console.log(err);
    }
}



// Upload data as a file to the targetFileURL.
// If the targetFileURL exists, overwrite the file.
// If the targetFileURL does not exist, create the file at the location.
async function writeFileToPod(filedata, mimetype, targetFileURL, fetch) {
    try {
        const savedFile = await overwriteFile(
            targetFileURL,                   // URL for the file.
            filedata,                        // Buffer containing file data
            { contentType: mimetype, fetch: fetch } // mimetype if known, fetch from the authenticated session
        );
        console.log(`File saved at ${getSourceUrl(savedFile)}`);
    } catch (error) {
        console.error(error);
    }
}


async function test1() {
    let res = await session.fetch(session.info.webId)
    console.log(await res.text())

    // https://forum.solidproject.org/t/my-first-app-adding-resources/275/14
    let post_folder = await session.fetch("http://localhost:3000/david/machin/logbook2/", {
        method: 'PUT',
        'Content-Type': 'text/turtle',
        'Link': '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"',
        'Slug': 'logbook2'
        // headers: { 'content-type': 'text/turtle' },
        // body: "<ex:s> <ex:p> <ex:o>."
    }
    )
    // console.log("put_result_ttl: ",put_result_ttl)
    console.log("ok post_folder: ", post_folder)


    // curl -X PUT -H "Content-Type: text/plain"   -d "abc"   http://localhost:3000/david/myfile.txt
    let put_result_txt = await session.fetch("http://localhost:3000/david/myfile.txt", {
        method: 'PUT',
        headers: { 'content-type': 'text/plain' },
        body: "test de data 2"
    }
    )
    // console.log("put_result_txt: ",put_result_txt)
    console.log("ok put_result_txt: ", put_result_txt.ok)

    // curl -X PUT -H "Content-Type: text/turtle"   -d "<ex:s> <ex:p> <ex:o>."   http://localhost:3000/myfile.ttl
    let put_result_ttl = await session.fetch("http://localhost:3000/david/myfile.ttl", {
        method: 'PUT',
        headers: { 'content-type': 'text/turtle' },
        body: "<ex:s> <ex:p> <ex:o>."
    }
    )
    // console.log("put_result_ttl: ",put_result_ttl)
    console.log("ok put_result_ttl: ", put_result_ttl.ok)

    // curl -X PUT -H "Content-Type: text/turtle"   -d "<ex:s> <ex:p> <ex:o>."   http://localhost:3000/myfile.ttl
    let put_result_json = await session.fetch("http://localhost:3000/david/myfile.json", {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ truc: "ll" }),
    }
    )
    // console.log("put_result_json: ",put_result_json)
    console.log("ok put_result_json: ", put_result_json.ok)

    const lennon = {
        "@context": "https://json-ld.org/contexts/person.jsonld",
        "@id": "http://dbpedia.org/resource/John_Lennon",
        "name": "John Lennon",
        "born": "1940-10-09",
        "spouse": "http://dbpedia.org/resource/Cynthia_Lennon"
    }

    let put_result_json_ld = await session.fetch("http://localhost:3000/david/folder/myfile.ld.json", {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(lennon),
    }
    )
    // console.log("put_result_json_ld: ",put_result_json_ld)
    console.log("ok put_result_json_ld: ", put_result_json_ld.ok)

    // curl -X POST -H "Content-Type: text/plain"   -d "abc"   http://localhost:3000/

    let post_result_json = await session.fetch("http://localhost:3000/david/", {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ truc: "ll" }),
    }
    )
    // console.log("post_result_json: ",post_result_json)
    console.log("ok post_result_json: ", post_result_json.ok)
    let location = post_result_json.headers.get("location")
    console.log("location: ", location)

    // curl -X DELETE http://localhost:3000/myfile.txt
    let delete_file = await session.fetch(location, {
        method: 'DELETE'
    }
    )
    // console.log("post_result_json: ",post_result_json)
    console.log("ok delete_file: ", await delete_file.text())

    // curl -H "Accept: text/plain"   http://localhost:3000/myfile.txt
    // curl -H "Accept: text/turtle"   http://localhost:3000/myfile.ttl
    let get_result_ttl = await session.fetch("http://localhost:3000/david/myfile.ttl", {
        method: 'GET',
        headers: { 'accept': 'text/turtle' }
    }
    )
    // console.log("post_result_json: ",post_result_json)
    console.log("ok get_result_ttl: ", await get_result_ttl.text())
    // console.log("location: ",post_result_json.headers.get("location"))
    // curl -H "Accept: application/ld+json"  http://localhost:3000/myfile.ttl

    /* curl -X PATCH -H "Content-Type: text/n3" \
      --data-raw "@prefix solid: <http://www.w3.org/ns/solid/terms#>. _:rename a solid:InsertDeletePatch; solid:inserts { <ex:s2> <ex:p2> <ex:o2>. }." \
      http://localhost:3000/myfile.ttl
      */
    let patch_n3 = await session.fetch("http://localhost:3000/david/myfile.ttl", {
        method: 'PATCH',
        headers: { 'content-type': 'text/n3' },
        body: "@prefix solid: <http://www.w3.org/ns/solid/terms#>. _:rename a solid:InsertDeletePatch; solid:inserts { <ex:s2> <ex:p2> <ex:o2>. }."
    }
    )
    // console.log("post_result_json: ",post_result_json)
    console.log("ok patch_n3: ", await patch_n3.text())

    let get_result_ttl2 = await session.fetch("http://localhost:3000/david/myfile.ttl", {
        method: 'GET',
        headers: { 'accept': 'text/turtle' }
    }
    )
    // console.log("post_result_json: ",post_result_json)
    console.log("ok get_result_ttl2: ", await get_result_ttl2.text())
    // console.log("location: ",post_result_json.headers.get("location"))
    /*
    curl -X PATCH -H "Content-Type: application/sparql-update" \
     -d "INSERT DATA { <ex:s2> <ex:p2> <ex:o2> }" \
     http://localhost:3000/myfile.ttl
     */

    let sparql_update = await session.fetch("http://localhost:3000/david/myfile.ttl", {
        method: 'PATCH',
        headers: { 'content-type': 'application/sparql-update' },
        body: "INSERT DATA { <ex:s3> <ex:p3> <ex:o3> }"
    }
    )
    // console.log("post_result_json: ",post_result_json)
    console.log("ok sparql_update: ", await sparql_update.text())

    let get_result_ttl3 = await session.fetch("http://localhost:3000/david/myfile.ttl", {
        method: 'GET',
        headers: { 'accept': 'text/turtle' }
    }
    )
    // console.log("post_result_json: ",post_result_json)
    console.log("ok get_result_ttl3: ", await get_result_ttl3.text())


    let get_result_ttl3_json = await session.fetch("http://localhost:3000/david/myfile.ttl", {
        method: 'GET',
        headers: { 'accept': 'application/json' }
    }
    )
    // console.log("post_result_json: ",post_result_json)
    console.log("ok get_result_ttl3_json: ", await get_result_ttl3_json.json())
    /*
    curl -I -H "Accept: text/plain" \
     http://localhost:3000/myfile.txt
     */
    // curl -X OPTIONS -i http://localhost:3000/myfile.txt


    let list_folder = await session.fetch("http://localhost:3000/david/", {
        method: 'GET',
        headers: { 'accept': 'application/json' }
    }
    )
    // console.log("post_result_json: ",post_result_json)
    console.log("ok list_folder: ", await list_folder.json())

}

await session.logout();