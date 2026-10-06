export async function call(channel, payload) {
  const res = await window.api.invoke(channel, payload);
  if (!res.ok) throw new Error(res.error);
  return res.data;
}
