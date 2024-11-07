export async function fetchPOST(url: string, headers: any, body: any) {
  console.log(url);
  try {
    const resFetch = await fetch(`${url}`, {
      method: "POST",
      headers,
      body,
    });

    if (!resFetch.ok)
      throw new Error(`Error fetching on : ${url} ${await resFetch.text()}`);

    try {
      return await resFetch.json();
    } catch (_) {
      return await resFetch.text();
    }
  } catch (e) {
    console.error(e);
    throw new Error(`Error fetch POST`);
  }
}
