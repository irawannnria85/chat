const html404 = `<!DOCTYPE html>
<body>
  <h1>404 Not Found.</h1>
  <p>The url you visit is not found.</p>
</body>`;

async function randomString(len) {
  len = len || 6;
  let $chars = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678";
  /****Removed confusing letters an numbers, oOLl,9gq,Vv,Uu,I1****/
  let maxPos = $chars.length;
  let result = "";
  for (i = 0; i < len; i++) {
    result += $chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return result;
}
async function checkURL(URL) {
  let str = URL;
  let Expression = /http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/;
  let objExp = new RegExp(Expression);
  if (objExp.test(str) == true) {
    if (str[0] == "h") return true;
    else return false;
  } else {
    return false;
  }
}
async function save_url(URL) {
  let random_key = await randomString();
  let is_exist = await LINKS.get(random_key);
  console.log(is_exist);
  if (is_exist == null) return await LINKS.put(random_key, URL), random_key;
  else save_url(URL);
}

/*
 * Break down base64 encoded authorization string into plain-text username and password
 * @param {string} authorization
 * @returns {string[]}
 */
function parseCredentials(authorization) {
  const parts = authorization.split(' ')
  const plainAuth = atob(parts[1])
  const credentials = plainAuth.split(':')
  return credentials
}

/*
 * Helper funtion to generate Response object
 * @param {string} message
 * @returns {Response}
 */
function getUnauthorizedResponse(message) {
  let response = new Response(message, {
    status: 401,
  })
  response.headers.set('WWW-Authenticate', `Basic realm="${REALM}"`)
  return response
}




async function handleRequest(request) {
  let header = {
    "content-type": "text/html;charset=UTF-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST",
  };
  console.log(request);
  if (request.method === "POST") {
    let req = await request.json();
    console.log(req["url"]);
    if (!(await checkURL(req["url"]))) {
      return new Response(`{"status":500,"key":": Error: Url illegal."}`, {
        headers: header,
      });
    }
    let stat,
      random_key = await save_url(req["url"]);
    console.log(stat);
    if (typeof stat == "undefined") {
      return new Response(`{"status":200,"key":"/` + random_key + `"}`, {
        headers: header,
      });
    }
    //
    else {
      return new Response(
        `{"status":200,"key":": Error:Reach the KV write limitation."}`,
        {
          headers: header,
        }
      );
    }
  } else if (request.method === "OPTIONS") {
    return new Response(``, {
      headers: header,
    });
  }

  const authorization = request.headers.get('authorization')
  if (!request.headers.has('authorization')) {
    return getUnauthorizedResponse(
      'Provide User Name and Password to access this page.',
    )
  }
  const credentials = parseCredentials(authorization)
  if (credentials[0] !== USERNAME || credentials[1] !== PASSWORD) {
    return getUnauthorizedResponse(
      'The User Name and Password combination you have entered is invalid.',
    )
  }


  const requestURL = new URL(request.url);
  const path = requestURL.pathname.split("/")[1];
  console.log(path);
  if (!path) {

    const html = await fetch(
      "https://github.com/kobyalex/link-shortener/raw/main/index.html"
    );
    /****customized index.html at main branch, easier to edit it****/

    return new Response(await html.text(), {
      headers: header,
    });
  }
  const value = await LINKS.get(path);
  console.log(value);

  const location = value;
  if (location) {
    return Response.redirect(location, 302);
  }
  // If request not in kv, return 404
  return new Response(html404, {
    headers: {
      "content-type": "text/html;charset=UTF-8",
    },
    status: 404,
  });
}

addEventListener("fetch", async (event) => {
  event.respondWith(handleRequest(event.request));
});
