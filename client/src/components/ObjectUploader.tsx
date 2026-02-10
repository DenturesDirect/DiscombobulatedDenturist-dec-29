getUploadParameters: async (file) => {
  const params = await onGetUploadParameters(file);
  const headers = { ...(params.headers || {}) };
  if (!("Content-Type" in headers) && file?.type) {
    headers["Content-Type"] = file.type;
  }
  return { ...params, headers };
}