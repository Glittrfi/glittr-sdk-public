export async function fetchPOST(url: string, headers: any, body: any) {
  console.log(body)
  try {
    const resFetch = await fetch(`${url}`, {
      method: "POST",
      headers,
      body,
    });
    
    if (!resFetch.ok) throw new Error(`Error POST on : ${url}`);

    // Get the content type from headers
    const contentType = resFetch.headers.get("content-type");
    
    // Clone the response before reading it
    if (contentType && contentType.includes("application/json")) {
      return await resFetch.json();
    } else {
      return await resFetch.text();
    }
  } catch (e) {
    console.error(e);
    throw new Error(`Error fetch POST`);
  }
}