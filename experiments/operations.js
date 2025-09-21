import { SolidOperations } from "../src/solidOperations.js"

let envFile = '../.env'
let op = new SolidOperations({ envFile })
let session = await op.init()
console.log("session.info", session.info)
console.log("op.pod:", op.pod)


let options = {
    path: "holacratie/",
    structure: {
        root_folders: ["constitution", "organisations", "acteurs", "partenaires"],
        organisations: [
            { name: "premier_cercle", label: "Premier_cercle" },
            {
                name: "tension", label: "Tensions", schema: [
                    { name: "what_is", type: "string" },
                    { name: "what_should_be", type: "string" },
                    { name: "role", type: "string" },
                    { name: "proposition", type: "string" }
                ]
            },
            {
                name: "projets", label: "Projets"
            },
            {
                name: "prochaines_actions", label: "Prochaines_actions", schema: [
                    { name: "action", type: "string" },
                    { name: "role", type: "string" },
                    { name: "description", type: "string" },
                    { name: "avancement", type: "string" },
                    // blocage ? contrainte
                ]
            },
            {
                name: "roles", label: "Roles", schema: [
                    { name: "name", type: "string" },
                    { name: "raison_etre", type: "string" },
                    { name: "domaines", type: "array" },
                    { name: "redevabilites", type: "array" },
                    { name: "tensions", type: "array" }
                ]
            },
            {
                name: "domaines"
            },
            {
                name: "associes"
            },
            {
                name: "acteurs"
            },
            {
                name: "autorites"
            },
            {
                name: "gouvernance"
            },
            {
                name: "fourre_tout"
            },
            {
                name: "obligations"
            },
            { name: "raison_etre" },
            { name: "contraintes" }
        ]
    },
    data: {
        organisations: [
            {
                "name": "Château des Robots",
                folder: "chateau_des_robots",
                shortname: "cdr",
                description: "Lieu de départ des expeditions vers le Monde Numérique.",
                roles: [{
                    name: "accueil",
                    label: "Accueil",
                    raison_etre: "Accueillir les visiteur, leur expliquer le fonctionnement du Château des Robots, et les guider. Leur proposer de s'abonner à la newsletter pour rester informé, leur proposer une première expérience en visitant l'Académie, ou le musée des explorations, ou en rencontrant des explorateurs à la Taverne...",
                    domaines: ["arrivee_au_chateau", "newsletter", "flyers"],
                    redevabilites: [],
                    tensions: []
                },
                {
                    name: "guide",
                    label: "Guide",
                    raison_etre: "Prendre en charge et suivre la progression des apprentis explorateurs",
                    domaines: ["guidage", "aide_aux_explorateurs", "accompagnement"],
                    redevabilites: [],
                    tensions: []
                },
                {
                    name: "apprenti_explorateur",
                    label: "Apprenti Explorateur",
                    raison_etre: "Découvrir le Monde Numérique",
                    domaines: ["exploration", "apprentissage"],
                    redevabilites: [],
                    tensions: []
                },
                {
                    name: "explorateur",
                    label: "Explorateur",
                    raison_etre: "Partager le Monde Numérique",
                    domaines: ["enseignement", "accompagnement"],
                    redevabilites: [],
                    tensions: []
                }

                ],
                acteurs: [
                    { name: "lila", label: "Lila", roles: ["apprenti_explorateur", "decouvreuse"] },
                    { name: "tartelru", label: "Tartuffe El Ruic", roles: ["artisan", "guide"], description: "Ancien explorateur aguerri, reconverti en artisan du cuir. Confectionne des outils pour les explorateurs." },
                    { name: "er3an", label: "Er3an", roles: ["apprenti_explorateur"] },
                    { name: "dady", label: "Da. dy Falavaleris" }
                ]
            },
            { "name": "Village des Constructeurs de navires", folder: "navcovi", shortname: "ncv", description: "Village où le navires pour le monde Numerique sont construits. Se situe à proximité du Château des Robots." },
            { "name": "Monde Numérique", folder: "monde_numerique", shortname: "mn", description: "Le Monde Numérique. Un monde à explorer" },
            { "name": "Guilde des explorateurs", folder: "guilde_explorateurs", shortname: "guildx", description: "Précedemment rattachée au Château des Robots, la guilde des Explorateurs assure le bon déroulement des explorations du Monde Numérique" },
            { "name": "Académie du Château des Robots", folder: "academie_cdr", shortname: "acad", description: "Lieu d'apprentissage, de partage de savoir au sujet du monde numerique, et du monde réel." }
        ],

    }


}
//await testHolacratie(options)
test1()

async function testHolacratie(options) {
    console.log(options)


    if (session.info.isLoggedIn) {
        op.pod.hola_root = op.pod.storage + options.path

        for await (const rf of options.structure.root_folders) {
            let path = op.pod.hola_root + rf + '/'
            await op.mkdir(path)
            op.pod[rf] = path
        }

        op.pod.organisations_list = {}
        for await (const org of options.data.organisations) {
            org.path = op.pod.organisations + org.folder + '/'
            await op.mkdir(org.path)
            op.pod.organisations_list[org.shortname] = org
        }

        for await (const [short, orga] of Object.entries(op.pod.organisations_list)) {
            op.pod.organisations_list[short].folders = {}
            console.log('\n------------------\n', short, orga);
            for await (const sub_folder of options.structure.organisations) {
                let folder = orga.path + sub_folder.name + '/'
                await op.mkdir(folder)
                op.pod.organisations_list[short].folders[sub_folder] = folder
                if (sub_folder.schema != undefined) {
                    let url = folder + "schema.ttl"
                    let method = 'PUT'
                    let headers = { 'content-type': 'text/turtle' }
                    let body = ""
                    for (const f of sub_folder.schema) {
                        let pred = f.type == "string" ? "<hola:has>" : "<hola:has_many>"
                        body += "<hola:" + short + "> " + pred + " <hola:" + f.name + ">.\n"
                    }
                    await op.fetch(method, url, headers, body)
                }
                if (orga[sub_folder.name] != undefined) {
                    for await (const entite of orga[sub_folder.name]) {
                        let url = folder + entite.name
                        let method = 'PUT'
                        let headers = { 'content-type': 'text/turtle' }
                        let body = ""
                        // for (const f of sub_folder.schema) {
                        for (const [key, val] of Object.entries(entite)) {
                            // let pred = f.type == "string" ? "<hola:has>" : "<hola:has_many>"
                            if (Array.isArray(val)) {
                                for (const v of val) {
                                    body += "<hola:" + entite.name + "> < hola:" + key + "> <hola:" + v + ">.\n"
                                }

                            } else {
                                body += "<hola:" + entite.name + "> < hola:" + key + "> <hola:" + val + ">.\n"

                            }
                        }
                        console.log("body", body)
                        await op.fetch(method, url, headers, body)
                    }

                }




            }

        }
        console.log("op.pod:", op.pod)
        // pod.constitution = hola_root + 'constitution/'
        // await create_folder(pod.constituion)
        // uploadFile('../doc/Constitution-Holacracy.md', "text/markdown", `${hola_root}constitution/Constitution-Holacracy.md`, session.fetch);
    }
    else {
        console.log("You are not logged")
    }


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